import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiToggleLeft, FiToggleRight, FiArrowUp, FiArrowDown } from 'react-icons/fi';

const BannerManager = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    const [formData, setFormData] = useState({
        _id: '',
        title: '',
        linkUrl: '',
        order: 0,
        isActive: true,
        image: null,
        previewImage: null
    });

    const fetchBanners = async () => {
        setLoading(true);
        try {
            // Admin fetches all banners (active and inactive)
            const res = await axios.get('/banners');
            setBanners(res.data);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách banner');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData({
                ...formData,
                image: file,
                previewImage: URL.createObjectURL(file)
            });
        }
    };

    const handleOpenModal = (banner = null) => {
        if (banner) {
            setFormData({
                _id: banner._id,
                title: banner.title,
                linkUrl: banner.linkUrl,
                order: banner.order,
                isActive: banner.isActive,
                image: null,
                previewImage: banner.image
            });
            setIsEditing(true);
        } else {
            setFormData({
                _id: '',
                title: '',
                linkUrl: '',
                order: 0,
                isActive: true,
                image: null,
                previewImage: null
            });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isEditing && !formData.image) {
            return toast.error('Vui lòng chọn hình ảnh cho banner');
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('linkUrl', formData.linkUrl);
        data.append('order', formData.order);
        data.append('isActive', formData.isActive);
        if (formData.image) {
            data.append('image', formData.image);
        }

        const loadingToast = toast.loading(isEditing ? 'Đang cập nhật...' : 'Đang tạo banner...');

        try {
            if (isEditing) {
                await axios.put(`/banners/${formData._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Cập nhật banner thành công', { id: loadingToast });
            } else {
                await axios.post('/banners', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Tạo banner mới thành công', { id: loadingToast });
            }
            setShowModal(false);
            fetchBanners();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: loadingToast });
        }
    };

    const handleToggleActive = async (banner) => {
        try {
            await axios.put(`/banners/${banner._id}`, { isActive: !banner.isActive });
            toast.success('Cập nhật trạng thái thành công');
            fetchBanners();
        } catch (error) {
            toast.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xoá banner này không?')) {
            try {
                await axios.delete(`/banners/${id}`);
                toast.success('Xoá banner thành công');
                fetchBanners();
            } catch (error) {
                toast.error('Lỗi khi xoá banner');
            }
        }
    };

    const moveOrder = async (banner, direction) => {
        try {
            const newOrder = direction === 'up' ? banner.order - 1 : banner.order + 1;
            await axios.put(`/banners/${banner._id}`, { order: newOrder });
            fetchBanners();
        } catch (error) {
            toast.error('Lỗi khi cập nhật thứ tự');
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await axios.put(`/banners/${id}`, { status });
            toast.success(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} banner`);
            fetchBanners();
        } catch (error) {
            toast.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const renderStatus = (status) => {
        switch (status) {
            case 'approved': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Đã duyệt</span>;
            case 'pending': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 animate-pulse">Chờ duyệt</span>;
            case 'rejected': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Từ chối</span>;
            default: return null;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Banner</h1>
                    <p className="text-sm text-gray-500">Thêm, sửa, xoá các hình ảnh quảng cáo trên trang chủ</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                    <FiPlus /> Thêm Banner
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                                <th className="p-4 w-20 text-center">Thứ tự</th>
                                <th className="p-4 w-64">Hình ảnh</th>
                                <th className="p-4">Tiêu đề & Link</th>
                                <th className="p-4 w-32 text-center">Hiển thị</th>
                                <th className="p-4 w-32 text-center">Kiểm duyệt</th>
                                <th className="p-4 w-40 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {banners.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">
                                        Chưa có banner nào. Hãy tạo banner mới!
                                    </td>
                                </tr>
                            ) : (
                                banners.map(banner => (
                                    <tr key={banner._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 align-middle">
                                            <div className="flex flex-col items-center gap-1">
                                                <button onClick={() => moveOrder(banner, 'up')} className="text-gray-400 hover:text-orange-500"><FiArrowUp/></button>
                                                <span className="font-bold text-gray-700">{banner.order}</span>
                                                <button onClick={() => moveOrder(banner, 'down')} className="text-gray-400 hover:text-orange-500"><FiArrowDown/></button>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="h-24 w-48 rounded-lg overflow-hidden border border-gray-100 shadow-sm relative group">
                                                <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <h3 className="font-bold text-slate-800 mb-1">{banner.title}</h3>
                                            {banner.linkUrl ? (
                                                <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline line-clamp-1">{banner.linkUrl}</a>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Không có link điều hướng</span>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            <button 
                                                onClick={() => handleToggleActive(banner)}
                                                className={`flex items-center justify-center w-full gap-1 ${banner.isActive ? 'text-green-500' : 'text-gray-400'}`}
                                            >
                                                {banner.isActive ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                                                <span className="text-xs font-semibold">{banner.isActive ? 'Đang hiện' : 'Đang ẩn'}</span>
                                            </button>
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            {renderStatus(banner.status || 'approved')}
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {userInfo.role === 'admin' && banner.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleUpdateStatus(banner._id, 'approved')} className="text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded-lg text-xs font-bold transition-colors">Duyệt</button>
                                                        <button onClick={() => handleUpdateStatus(banner._id, 'rejected')} className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg text-xs font-bold transition-colors">Từ chối</button>
                                                    </>
                                                )}
                                                {userInfo.role === 'admin' && (
                                                    <>
                                                        <button onClick={() => handleOpenModal(banner)} className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors" title="Sửa">
                                                            <FiEdit2 />
                                                        </button>
                                                        <button onClick={() => handleDelete(banner._id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Xoá">
                                                            <FiTrash2 />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Thêm/Sửa Banner */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-slate-800">
                                {isEditing ? 'Chỉnh sửa Banner' : 'Tạo Banner mới'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề Banner <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" required name="title"
                                        value={formData.title} onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                        placeholder="Ví dụ: Siêu Sale Giữa Tháng"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Link điều hướng (tuỳ chọn)</label>
                                    <input 
                                        type="text" name="linkUrl"
                                        value={formData.linkUrl} onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                        placeholder="Ví dụ: /products/tra-sua-tran-chau"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Khi khách bấm vào banner sẽ chuyển đến link này.</p>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Thứ tự hiển thị</label>
                                        <input 
                                            type="number" name="order"
                                            value={formData.order} onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                        />
                                    </div>
                                    <div className="flex-1 flex items-center mt-6">
                                        <label className="flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" name="isActive"
                                                checked={formData.isActive} onChange={handleInputChange}
                                                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300"
                                            />
                                            <span className="ml-2 font-semibold text-gray-700">Hiển thị ngay</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Hình ảnh <span className="text-red-500">*</span></label>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <FiImage className="w-8 h-8 text-gray-400 mb-2" />
                                                    <p className="text-sm text-gray-500 font-medium">Bấm để tải ảnh lên</p>
                                                    <p className="text-xs text-gray-400 mt-1">Tỷ lệ khuyên dùng: 21:9</p>
                                                </div>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                            </label>
                                        </div>
                                        {formData.previewImage && (
                                            <div className="w-48 h-32 rounded-xl overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
                                                <img src={formData.previewImage} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors">
                                    {isEditing ? 'Lưu thay đổi' : 'Tạo Banner'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BannerManager;
