const asyncHandler = require('express-async-handler');
const ActivityLog = require('../models/ActivityLog');

// @desc    Lấy danh sách nhật ký hoạt động (có phân trang, lọc)
// @route   GET /api/activity-logs
// @access  Private/Admin
const getActivityLogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Hỗ trợ lọc theo user hoặc action
    const { userId, action } = req.query;
    const filterQuery = {};

    if (userId) filterQuery.user = userId;
    if (action) filterQuery.action = action;

    const totalLogs = await ActivityLog.countDocuments(filterQuery);
    const logs = await ActivityLog.find(filterQuery)
        .sort({ createdAt: -1 }) // Mới nhất lên đầu
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email role avatar'); // Populate thông tin người thực hiện

    res.status(200).json({
        logs,
        currentPage: page,
        totalPages: Math.ceil(totalLogs / limit),
        totalLogs
    });
});

// @desc    Lấy thống kê hoạt động của Staff (số thao tác theo ngày)
// @route   GET /api/activity-logs/stats
// @access  Private/Admin
const getActivityStats = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const stats = await ActivityLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: {
                    user: '$user',
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                },
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id.user',
                foreignField: '_id',
                as: 'userInfo'
            }
        },
        {
            $project: {
                _id: 0,
                date: '$_id.date',
                userName: { $ifNull: [{ $arrayElemAt: ['$userInfo.name', 0] }, 'Đã xóa'] },
                userRole: { $ifNull: [{ $arrayElemAt: ['$userInfo.role', 0] }, 'unknown'] },
                actionsCount: '$count'
            }
        },
        { $sort: { date: -1, actionsCount: -1 } }
    ]);

    res.status(200).json(stats);
});

module.exports = { getActivityLogs, getActivityStats };
