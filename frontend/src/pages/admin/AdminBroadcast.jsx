import React, { useState, useEffect, useMemo } from 'react';
import axios, { SERVER_URL , getImageUrl } from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { FiSend, FiUsers, FiSearch } from 'react-icons/fi';

const AdminBroadcast = () => {
    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    // User selection state
    const [sendMode, setSendMode] = useState('selected'); // 'all' or 'selected'
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState(new Set());

    // Fetch all users for selection
    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                // API này cần được tạo ở backend để lấy danh sách rút gọn tất cả user
                const { data } = await axios.get('/users/list-all');
                setUsers(data);
            } catch (error) {
                toast.error('Không thể tải danh sách người dùng.');
            } finally {
                setUsersLoading(false);
            }
        };
        fetchAllUsers();
    }, []);

    // Memoized filtered users
    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        return users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    // Handle individual user selection
    const handleSelectUser = (userId) => {
        const newSelectedIds = new Set(selectedUserIds);
        if (newSelectedIds.has(userId)) {
            newSelectedIds.delete(userId);
        } else {
            newSelectedIds.add(userId);
        }
        setSelectedUserIds(newSelectedIds);
    };

    // Handle "select all" checkbox
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allFilteredIds = new Set(filteredUsers.map(u => u._id));
            setSelectedUserIds(allFilteredIds);
        } else {
            setSelectedUserIds(new Set());
        }
    };

    // Handle form submission
    const handleBroadcast = async (e) => {
        e.preventDefault();
        
        if (!title.trim() || !content.trim()) {
            toast.error('Vui lòng nhập đầy đủ Tiêu đề và Nội dung!');
            return;
        }

        if (sendMode === 'selected' && selectedUserIds.size === 0) {
            toast.error('Vui lòng chọn ít nhất một người dùng để gửi!');
            return;
        }

        setLoading(true);
        const toastId = toast.loading('Đang phát sóng thông báo...');

        try {
            const payload = {
                title,
                content,
                sendToAll: sendMode === 'all',
                userIds: sendMode === 'selected' ? Array.from(selectedUserIds) : []
            };

            const res = await axios.post('/notifications/broadcast', payload);
            
            toast.success(res.data.message || 'Gửi thông báo thành công!', { id: toastId });
            // Reset form
            setTitle(''); 
            setContent('');
            setSelectedUserIds(new Set());
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi gửi thông báo.', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const isAllFilteredSelected = filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length;

    return (
        <div className="p-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Phát Sóng Thông Báo (Broadcast)</h1>

            <form onSubmit={handleBroadcast} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form Inputs */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-8 border border-sky-100 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">1. Soạn thảo nội dung</h3>
                    <div className="space-y-6 flex-grow">
                        <div>
                            <label htmlFor="broadcast-title" className="block text-sm font-bold text-gray-700 mb-2">Tiêu đề</label>
                            <input id="broadcast-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Flash Sale Cuối Tuần! 🍔" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors" />
                        </div>
                        <div>
                            <label htmlFor="broadcast-content" className="block text-sm font-bold text-gray-700 mb-2">Nội dung</label>
                            <textarea id="broadcast-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="VD: Nhập mã DUALEOFOOD giảm ngay 50K..." rows="8" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors resize-y"></textarea>
                        </div>
                    </div>
                    <div className="pt-6 mt-auto">
                        <button type="submit" disabled={loading} className={`w-full inline-flex items-center justify-center px-8 py-3 rounded-lg text-white font-bold transition-transform duration-200 transform ${loading ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 hover:scale-105 shadow-lg shadow-sky-500/30'}`}>
                            <FiSend className="mr-2" />
                            {loading ? 'Đang phát sóng...' : 'Gửi Thông Báo'}
                        </button>
                    </div>
                </div>

                {/* Right Column: User Selection */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-8 border border-sky-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">2. Chọn đối tượng nhận</h3>
                    <div className="flex items-center gap-4 bg-gray-100 p-1 rounded-full mb-6">
                        <button type="button" onClick={() => setSendMode('selected')} className={`flex-1 text-center px-4 py-2 text-sm font-semibold rounded-full transition-colors ${sendMode === 'selected' ? 'bg-sky-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Chọn thủ công</button>
                        <button type="button" onClick={() => setSendMode('all')} className={`flex-1 text-center px-4 py-2 text-sm font-semibold rounded-full transition-colors ${sendMode === 'all' ? 'bg-sky-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Gửi cho tất cả</button>
                    </div>

                    {sendMode === 'all' ? (
                        <div className="flex flex-col items-center justify-center h-full bg-sky-50 rounded-lg p-8 text-center border-2 border-dashed border-sky-200">
                            <FiUsers className="text-5xl text-sky-400 mb-4" />
                            <h4 className="font-bold text-sky-800">Chế độ gửi hàng loạt</h4>
                            <p className="text-sm text-sky-600 mt-2">Thông báo sẽ được gửi đến tất cả <span className="font-bold">{users.length}</span> khách hàng trong hệ thống.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="relative flex-grow">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder="Tìm tên hoặc email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                                </div>
                                <div className="flex items-center bg-gray-100 p-2 rounded-lg flex-shrink-0">
                                    <input type="checkbox" id="select-all" checked={isAllFilteredSelected} onChange={handleSelectAll} className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500" />
                                    <label htmlFor="select-all" className="ml-2 text-sm font-medium text-gray-700">Chọn tất cả ({selectedUserIds.size} / {filteredUsers.length})</label>
                                </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                {usersLoading ? (
                                    <p className="p-4 text-center text-gray-500">Đang tải danh sách người dùng...</p>
                                ) : filteredUsers.length === 0 ? (
                                    <p className="p-4 text-center text-gray-500">Không tìm thấy người dùng nào.</p>
                                ) : (
                                    <ul className="divide-y divide-gray-200">
                                        {filteredUsers.map(user => (
                                            <li key={user._id} onClick={() => handleSelectUser(user._id)} className="p-3 flex items-center gap-4 cursor-pointer hover:bg-sky-50 transition-colors">
                                                <input type="checkbox" checked={selectedUserIds.has(user._id)} readOnly className="w-5 h-5 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500" />
                                                <img src={user.avatar ? `${getImageUrl(user.avatar)}` : `https://ui-avatars.com/api/?name=${user.name}&background=random&color=fff`} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                                <div className="flex-grow">
                                                    <p className="font-bold text-gray-800">{user.name}</p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AdminBroadcast;