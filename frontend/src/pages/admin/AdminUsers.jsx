import React, { useState, useEffect, useCallback } from 'react';
import axios, { SERVER_URL , getImageUrl } from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { FiUsers, FiSearch, FiTrash2, FiEdit, FiChevronLeft, FiChevronRight, FiShield, FiUser, FiUserCheck } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalUsers: 0 });
    const [searchTerm, setSearchTerm] = useState('');

    // State for stats chart
    const [statsData, setStatsData] = useState([]);
    const [statsPeriod, setStatsPeriod] = useState('7d'); // '7d', '30d', '12m'
    const [statsLoading, setStatsLoading] = useState(true);

    // State for modals
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('customer');

    const fetchUsers = useCallback(async (page = 1, search = '') => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/users?page=${page}&limit=8&search=${search}`);
            setUsers(data.users);
            setPagination({
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                totalUsers: data.totalUsers
            });
        } catch (error) {
            toast.error('Không thể tải danh sách người dùng.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchUsers(1, searchTerm);
        }, 500); // Debounce search input
        return () => clearTimeout(debounceTimer);
    }, [searchTerm, fetchUsers]);

    // Fetch user registration statistics
    useEffect(() => {
        const fetchStats = async () => {
            setStatsLoading(true);
            try {
                const { data } = await axios.get(`/users/stats?period=${statsPeriod}`);
                setStatsData(data);
            } catch (error) {
                toast.error('Không thể tải dữ liệu thống kê.');
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, [statsPeriod]);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            fetchUsers(newPage, searchTerm);
        }
    };

    // --- Delete User Logic ---
    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            await axios.delete(`/users/${selectedUser._id}`);
            toast.success(`Đã xóa người dùng ${selectedUser.name}.`);
            closeDeleteModal();
            fetchUsers(pagination.currentPage, searchTerm); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xóa người dùng thất bại.');
        }
    };

    // --- Change Role Logic ---
    const openRoleModal = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setIsRoleModalOpen(true);
    };

    const closeRoleModal = () => {
        setIsRoleModalOpen(false);
        setSelectedUser(null);
    };

    const handleRoleChange = async () => {
        if (!selectedUser) return;
        try {
            await axios.put(`/users/${selectedUser._id}/role`, { role: newRole });
            toast.success(`Đã cập nhật quyền cho ${selectedUser.name}.`);
            closeRoleModal();
            // Cập nhật UI ngay lập tức để có trải nghiệm tốt hơn
            setUsers(users.map(u => u._id === selectedUser._id ? {...u, role: newRole} : u));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Cập nhật quyền thất bại.');
        }
    };

    return (
        <div className="font-sans p-4 md:p-8">
            <h1 className="text-3xl font-black text-sky-500 mb-8 border-b border-sky-100 pb-4 flex items-center gap-3">
                <FiUsers /> Quản Lý Người Dùng
            </h1>

            {/* Stats Chart Section */}
            <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-sky-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-lg font-bold text-gray-700">Người dùng mới</h2>
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full">
                        <button onClick={() => setStatsPeriod('7d')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${statsPeriod === '7d' ? 'bg-sky-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>7 ngày</button>
                        <button onClick={() => setStatsPeriod('30d')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${statsPeriod === '30d' ? 'bg-sky-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>30 ngày</button>
                        <button onClick={() => setStatsPeriod('12m')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${statsPeriod === '12m' ? 'bg-sky-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>12 tháng</button>
                    </div>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    {statsLoading ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">Đang tải biểu đồ...</div>
                    ) : (
                        <ResponsiveContainer>
                            <AreaChart data={statsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'white', 
                                        border: '1px solid #e2e8f0', 
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        fontWeight: 'bold'
                                    }}
                                    labelStyle={{ color: '#334155' }}
                                    formatter={(value) => [`${value} người dùng`, 'Số lượng']}
                                />
                                <Area type="monotone" dataKey="count" stroke="#0284c7" fillOpacity={1} fill="url(#colorUv)" strokeWidth={2.5} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Search and Stats */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:max-w-md">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên hoặc email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                    />
                </div>
                <div className="font-bold text-gray-600">
                    Tổng số: <span className="text-sky-500">{pagination.totalUsers}</span> người dùng
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-sky-50 overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-sky-50/50">
                        <tr>
                            <th scope="col" className="px-6 py-4">Người dùng</th>
                            <th scope="col" className="px-6 py-4">Vai trò</th>
                            <th scope="col" className="px-6 py-4">Ngày tham gia</th>
                            <th scope="col" className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" className="text-center py-16 text-gray-500">Đang tải danh sách...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-16 text-gray-500">Không tìm thấy người dùng nào.</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user._id} className="bg-white border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <img
                                                className="w-10 h-10 rounded-full object-cover"
                                                src={user.avatar ? `${getImageUrl(user.avatar)}` : `https://ui-avatars.com/api/?name=${user.name}&background=random&color=fff&bold=true`}
                                                alt={user.name}
                                            />
                                            <div>
                                                <div className="font-bold">{user.name}</div>
                                                <div className="text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full font-semibold text-xs ${
                                            user.role === 'admin' 
                                                ? 'bg-orange-100 text-orange-600' 
                                                : user.role === 'staff'
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-sky-100 text-sky-600'
                                        }`}>
                                            {user.role === 'admin' ? 'Quản trị viên' : user.role === 'staff' ? 'Nhân viên' : 'Khách hàng'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-4">
                                            <button onClick={() => openRoleModal(user)} className="font-medium text-blue-500 hover:underline flex items-center gap-1"><FiEdit /> Sửa quyền</button>
                                            <button onClick={() => openDeleteModal(user)} className="font-medium text-red-500 hover:underline flex items-center gap-1"><FiTrash2 /> Xóa</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-4">
                    <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50">
                        <FiChevronLeft /> Trước
                    </button>
                    <span className="text-sm font-bold text-gray-600">
                        Trang {pagination.currentPage} / {pagination.totalPages}
                    </span>
                    <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50">
                        Sau <FiChevronRight />
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                        <h3 className="text-xl font-bold text-gray-800">Xác nhận xóa</h3>
                        <p className="mt-4 text-gray-600">
                            Bạn có chắc chắn muốn xóa người dùng <span className="font-bold">{selectedUser.name}</span>? Hành động này không thể hoàn tác.
                        </p>
                        <div className="mt-6 flex justify-end gap-4">
                            <button onClick={closeDeleteModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300">Hủy</button>
                            <button onClick={handleDeleteUser} className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600">Xóa</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Change Modal */}
            {isRoleModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                        <h3 className="text-xl font-bold text-gray-800">Thay đổi vai trò</h3>
                        <p className="mt-4 text-gray-600">
                            Chọn vai trò mới cho người dùng <span className="font-bold">{selectedUser.name}</span>.
                        </p>
                        <div className="mt-4 space-y-2">
                            <label className="flex items-center gap-3 p-3 border rounded-lg has-[:checked]:bg-sky-50 has-[:checked]:border-sky-500 cursor-pointer">
                                <input type="radio" name="role" value="customer" checked={newRole === 'customer'} onChange={(e) => setNewRole(e.target.value)} className="w-5 h-5 text-sky-600 focus:ring-sky-500"/>
                                <div>
                                    <p className="font-bold flex items-center gap-2"><FiUser /> Khách hàng</p>
                                    <p className="text-xs text-gray-500">Quyền cơ bản, có thể mua hàng và đánh giá.</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 border rounded-lg has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-500 cursor-pointer">
                                <input type="radio" name="role" value="staff" checked={newRole === 'staff'} onChange={(e) => setNewRole(e.target.value)} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"/>
                                <div>
                                    <p className="font-bold flex items-center gap-2"><FiUserCheck /> Nhân viên</p>
                                    <p className="text-xs text-gray-500">Xử lý đơn hàng, xem tin nhắn. Không truy cập Dashboard.</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 border rounded-lg has-[:checked]:bg-orange-50 has-[:checked]:border-orange-500 cursor-pointer">
                                <input type="radio" name="role" value="admin" checked={newRole === 'admin'} onChange={(e) => setNewRole(e.target.value)} className="w-5 h-5 text-orange-600 focus:ring-orange-500"/>
                                <div>
                                    <p className="font-bold flex items-center gap-2"><FiShield /> Quản trị viên</p>
                                    <p className="text-xs text-gray-500">Toàn quyền truy cập vào trang quản trị.</p>
                                </div>
                            </label>
                        </div>
                        <div className="mt-6 flex justify-end gap-4">
                            <button onClick={closeRoleModal} className="px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300">Hủy</button>
                            <button onClick={handleRoleChange} className="px-4 py-2 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600">Lưu thay đổi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;