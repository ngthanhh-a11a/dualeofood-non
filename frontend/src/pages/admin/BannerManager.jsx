import React, { useState, useEffect, useRef } from 'react';
import axios, { getOptimizedVideoUrl, getVideoPosterUrl, getOptimizedImageUrl } from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { 
    FiPlus, FiEdit2, FiTrash2, FiImage, FiToggleLeft, FiToggleRight, 
    FiArrowUp, FiArrowDown, FiVideo, FiEye, FiEyeOff, FiCheck, FiX, FiLock,
    FiMove, FiAlignLeft, FiAlignCenter, FiAlignRight, FiRotateCcw
} from 'react-icons/fi';

const BannerManager = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const isAdmin = userInfo?.role === 'admin';
    const isStaff = userInfo?.role === 'staff';
    
    const [formData, setFormData] = useState({
        _id: '',
        title: '',
        subtitle: '',
        buttonText: 'Khám phá thêm',
        posX: 50,
        posY: 50,
        textAlign: 'center',
        linkUrl: '',
        order: 0,
        isActive: true,
        showContent: true,
        mediaType: 'image',
        image: null,
        previewImage: null
    });

    const [isDragging, setIsDragging] = useState(false);
    const previewContainerRef = useRef(null);

    const isVideoBanner = (banner) => {
        if (banner?.mediaType === 'video') return true;
        if (typeof banner?.image === 'string') {
            const url = banner.image.toLowerCase();
            return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.includes('/video/upload/');
        }
        return false;
    };

    const fetchBanners = async () => {
        setLoading(true);
        try {
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

    // Pointer events for dragging content box across the live preview canvas
    const updatePositionFromPointer = (e) => {
        if (!previewContainerRef.current) return;
        const rect = previewContainerRef.current.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;
        const xPercent = Math.round(((clientX - rect.left) / rect.width) * 100);
        const yPercent = Math.round(((clientY - rect.top) / rect.height) * 100);
        
        setFormData(prev => ({
            ...prev,
            posX: Math.max(5, Math.min(95, xPercent)),
            posY: Math.max(8, Math.min(92, yPercent))
        }));
    };

    const handlePointerDown = (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        setIsDragging(true);
        updatePositionFromPointer(e);
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        updatePositionFromPointer(e);
    };

    const handlePointerUp = (e) => {
        if (isDragging) {
            setIsDragging(false);
            try {
                e.currentTarget.releasePointerCapture?.(e.pointerId);
            } catch (err) {}
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleMediaChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const isVideo = file.type && file.type.startsWith('video');
            setFormData({
                ...formData,
                image: file,
                mediaType: isVideo ? 'video' : 'image',
                previewImage: URL.createObjectURL(file)
            });
        }
    };

    const handleOpenModal = (banner = null) => {
        if (banner) {
            const isVid = isVideoBanner(banner);
            setFormData({
                _id: banner._id,
                title: banner.title || '',
                subtitle: banner.subtitle || '',
                buttonText: banner.buttonText || 'Khám phá thêm',
                posX: banner.posX !== undefined ? banner.posX : 50,
                posY: banner.posY !== undefined ? banner.posY : 50,
                textAlign: banner.textAlign || 'center',
                linkUrl: banner.linkUrl || '',
                order: banner.order || 0,
                isActive: banner.isActive !== undefined ? banner.isActive : true,
                showContent: banner.showContent !== false,
                mediaType: isVid ? 'video' : 'image',
                image: null,
                previewImage: banner.image
            });
            setIsEditing(true);
        } else {
            setFormData({
                _id: '',
                title: '',
                subtitle: '',
                buttonText: 'Khám phá thêm',
                posX: 50,
                posY: 50,
                textAlign: 'center',
                linkUrl: '',
                order: 0,
                isActive: true,
                showContent: true,
                mediaType: 'image',
                image: null,
                previewImage: null
            });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Nếu bật hiển thị chữ & nút mà chưa nhập tiêu đề thì báo lỗi
        if (formData.showContent && !formData.title.trim()) {
            return toast.error('Vui lòng nhập tiêu đề cho banner');
        }

        if (!isEditing && !formData.image) {
            return toast.error('Vui lòng chọn hình ảnh hoặc video cho banner');
        }

        const data = new FormData();
        const submitTitle = formData.title.trim() 
            ? formData.title.trim() 
            : (formData.showContent ? 'Banner Mới' : (formData.mediaType === 'video' ? 'Video Banner' : 'Banner'));

        data.append('title', submitTitle);
        data.append('subtitle', formData.subtitle ? formData.subtitle.trim() : '');
        data.append('buttonText', formData.buttonText ? formData.buttonText.trim() : 'Khám phá thêm');
        data.append('posX', formData.posX !== undefined ? formData.posX : 50);
        data.append('posY', formData.posY !== undefined ? formData.posY : 50);
        data.append('textAlign', formData.textAlign || 'center');
        data.append('linkUrl', formData.linkUrl || '');
        data.append('order', formData.order || 0);
        data.append('isActive', formData.isActive);
        data.append('showContent', formData.showContent);
        if (formData.image) {
            data.append('image', formData.image);
        }

        const loadingToast = toast.loading(isEditing ? 'Đang cập nhật...' : 'Đang tạo banner...');

        try {
            if (isEditing) {
                await axios.put(`/banners/${formData._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success(
                    isStaff 
                        ? 'Cập nhật thành công! Banner đang ở trạng thái chờ Admin duyệt.' 
                        : 'Cập nhật banner thành công', 
                    { id: loadingToast }
                );
            } else {
                await axios.post('/banners', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success(
                    isStaff 
                        ? 'Tạo banner mới thành công! Đang chờ Admin duyệt.' 
                        : 'Tạo banner mới thành công', 
                    { id: loadingToast }
                );
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
        if (!isAdmin) {
            return toast.error('Chỉ Quản trị viên (Admin) mới có quyền xoá banner');
        }
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
        if (!isAdmin) {
            return toast.error('Chỉ Quản trị viên (Admin) mới có quyền duyệt banner');
        }
        try {
            await axios.put(`/banners/${id}`, { status });
            toast.success(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} banner`);
            fetchBanners();
        } catch (error) {
            toast.error('Lỗi khi cập nhật trạng thái kiểm duyệt');
        }
    };

    const renderStatus = (status) => {
        switch (status) {
            case 'approved': 
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Đã duyệt</span>;
            case 'pending': 
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">Chờ duyệt</span>;
            case 'rejected': 
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">Từ chối</span>;
            default: 
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
                        <span>Quản lý Banner Quảng Cáo</span>
                        {isStaff && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                Quyền Nhân Viên
                            </span>
                        )}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Hỗ trợ đăng tải Hình ảnh & Video lặp mượt mà, tùy chỉnh ẩn/hiện chữ và link điều hướng trang chủ.
                    </p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer self-start sm:self-auto"
                >
                    <FiPlus size={18} /> Thêm Banner Mới
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-24">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[750px]">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    <th className="p-4 w-20 text-center">Thứ tự</th>
                                    <th className="p-4 w-60">Media (Ảnh / Video)</th>
                                    <th className="p-4">Tiêu đề & Cài đặt</th>
                                    <th className="p-4 w-32 text-center">Hiển thị</th>
                                    <th className="p-4 w-32 text-center">Kiểm duyệt</th>
                                    <th className="p-4 w-36 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {banners.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center text-slate-400">
                                            Chưa có banner nào. Hãy bấm "Thêm Banner Mới" để tạo ngay!
                                        </td>
                                    </tr>
                                ) : (
                                    banners.map(banner => {
                                        const isVid = isVideoBanner(banner);
                                        return (
                                            <tr key={banner._id} className="hover:bg-slate-50/50 transition-colors">
                                                {/* Thứ tự */}
                                                <td className="p-4 align-middle">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <button onClick={() => moveOrder(banner, 'up')} className="text-slate-400 hover:text-orange-500 transition cursor-pointer p-0.5" title="Di chuyển lên">
                                                            <FiArrowUp size={16} />
                                                        </button>
                                                        <span className="font-bold text-slate-700 text-xs">{banner.order}</span>
                                                        <button onClick={() => moveOrder(banner, 'down')} className="text-slate-400 hover:text-orange-500 transition cursor-pointer p-0.5" title="Di chuyển xuống">
                                                            <FiArrowDown size={16} />
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Media Ảnh / Video preview */}
                                                <td className="p-4 align-middle">
                                                    <div className="h-24 w-48 rounded-xl overflow-hidden border border-slate-200 shadow-2xs relative group bg-black shrink-0">
                                                        {isVid ? (
                                                            <>
                                                                <video 
                                                                    src={getOptimizedVideoUrl(banner.image)} 
                                                                    poster={getVideoPosterUrl(banner.image) || undefined}
                                                                    autoPlay 
                                                                    loop 
                                                                    muted 
                                                                    playsInline 
                                                                    className="w-full h-full object-cover" 
                                                                />
                                                                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 text-amber-300 text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                                                                    <FiVideo size={11} /> VIDEO
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <img 
                                                                    src={getOptimizedImageUrl(banner.image, 600)} 
                                                                    alt={banner.title} 
                                                                    className="w-full h-full object-cover" 
                                                                />
                                                                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-extrabold shadow-xs">
                                                                    ẢNH
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Tiêu đề & Cài đặt */}
                                                <td className="p-4 align-middle">
                                                    {banner.subtitle && (
                                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-0.5">
                                                            {banner.subtitle}
                                                        </span>
                                                    )}
                                                    <h3 className="font-bold text-slate-800 text-sm mb-1">{banner.title}</h3>
                                                    {banner.linkUrl ? (
                                                        <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-600 hover:underline line-clamp-1">
                                                            🔗 {banner.linkUrl}
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Không liên kết điều hướng</span>
                                                    )}

                                                    {/* Badge tuỳ chọn chữ, nút & vị trí */}
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                                        {banner.showContent === false ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                                                <FiEyeOff size={12} /> Ẩn chữ & nút giữa (Video/Ảnh thuần)
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                                                    <FiEye size={12} /> Hiện chữ & nút
                                                                </span>
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                    <FiMove size={11} /> X: {banner.posX ?? 50}% | Y: {banner.posY ?? 50}% ({banner.textAlign || 'center'})
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Bật/Tắt Hiển thị */}
                                                <td className="p-4 align-middle text-center">
                                                    <button 
                                                        onClick={() => handleToggleActive(banner)}
                                                        className={`inline-flex items-center justify-center gap-1 transition cursor-pointer ${banner.isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                                                    >
                                                        {banner.isActive ? <FiToggleRight size={26} /> : <FiToggleLeft size={26} />}
                                                        <span className="text-xs font-bold">{banner.isActive ? 'Bật' : 'Tắt'}</span>
                                                    </button>
                                                </td>

                                                {/* Kiểm duyệt */}
                                                <td className="p-4 align-middle text-center">
                                                    {renderStatus(banner.status || 'approved')}
                                                </td>

                                                {/* Thao tác */}
                                                <td className="p-4 align-middle text-center">
                                                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                        {/* Duyệt / Từ chối (Chỉ Admin mới có quyền) */}
                                                        {isAdmin && banner.status === 'pending' && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleUpdateStatus(banner._id, 'approved')} 
                                                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition cursor-pointer flex items-center gap-1"
                                                                    title="Phê duyệt banner để hiện ra trang chủ"
                                                                >
                                                                    <FiCheck size={12} /> Duyệt
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleUpdateStatus(banner._id, 'rejected')} 
                                                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition cursor-pointer flex items-center gap-1"
                                                                    title="Từ chối duyệt banner này"
                                                                >
                                                                    <FiX size={12} /> Từ chối
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* Nút Sửa (Cả Admin và Staff đều được sửa) */}
                                                        <button 
                                                            onClick={() => handleOpenModal(banner)} 
                                                            className="text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 p-2 rounded-xl transition cursor-pointer" 
                                                            title="Chỉnh sửa banner"
                                                        >
                                                            <FiEdit2 size={15} />
                                                        </button>

                                                        {/* Nút Xoá (Chỉ Admin mới có quyền) */}
                                                        {isAdmin && (
                                                            <button 
                                                                onClick={() => handleDelete(banner._id)} 
                                                                className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2 rounded-xl transition cursor-pointer" 
                                                                title="Xoá banner"
                                                            >
                                                                <FiTrash2 size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Thêm/Sửa Banner */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col animate-fade-in">
                        {/* Header modal */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                            <div>
                                <h2 className="text-lg font-black text-slate-800">
                                    {isEditing ? 'Chỉnh Sửa Banner' : 'Tạo Banner Mới'}
                                </h2>
                                <p className="text-xs text-slate-500">Kéo thả vị trí chữ trực tiếp & Định dạng chữ sang trọng</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl cursor-pointer">&times;</button>
                        </div>

                        {/* Form body */}
                        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
                            {/* Thông báo phân quyền nếu là Staff */}
                            {isStaff && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                                    ℹ️ <strong>Lưu ý:</strong> Bạn đang thao tác với quyền <strong>Nhân viên</strong>. Banner sau khi lưu sẽ tự động chuyển sang trạng thái <strong>Chờ duyệt</strong> bởi Quản trị viên trước khi xuất hiện trên trang chủ.
                                </div>
                            )}

                            {/* Cài đặt Ẩn/Hiện tiêu đề & nút giữa banner */}
                            <div className={`p-4 rounded-2xl border transition-all ${
                                !formData.showContent 
                                    ? 'bg-amber-50/70 border-amber-200' 
                                    : 'bg-slate-50 border-slate-200/80'
                            }`}>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        name="hideContent"
                                        checked={!formData.showContent} 
                                        onChange={(e) => {
                                            const isHidden = e.target.checked;
                                            setFormData(prev => ({
                                                ...prev,
                                                showContent: !isHidden
                                            }));
                                        }}
                                        className="w-4.5 h-4.5 text-amber-600 rounded focus:ring-amber-500 border-slate-300 mt-0.5 cursor-pointer accent-amber-600"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800 text-xs sm:text-sm block">
                                                Ẩn tiêu đề & nút bấm trên banner
                                            </span>
                                            {!formData.showContent && (
                                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold flex items-center gap-1 border border-amber-200">
                                                    <FiLock size={10} /> ĐANG KHÓA TIÊU ĐỀ
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-slate-500 block mt-1 leading-relaxed">
                                            Tích chọn để hiển thị video/ảnh thuần 100% không che chữ. Khi tích mục này, <strong>ô tiêu đề sẽ bị khóa không cần điền</strong>. Muốn nhập tiêu đề thì <strong>tắt (bỏ tích)</strong> mục này.
                                        </span>
                                    </div>
                                </label>
                            </div>

                            {/* KHUNG XEM TRƯỚC TRỰC QUAN & KÉO THẢ VỊ TRÍ CHỮ */}
                            {formData.showContent && (
                                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-900/5 space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                <FiMove className="text-orange-500" /> Khung xem trước & Kéo thả vị trí chữ:
                                            </span>
                                            <span className="text-[11px] font-mono font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md border border-orange-200">
                                                X: {formData.posX}% | Y: {formData.posY}%
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-slate-500">
                                            💡 Giữ chuột/chạm và kéo khối chữ để đặt vị trí bất kỳ
                                        </span>
                                    </div>

                                    {/* Canvas Preview kéo thả */}
                                    <div 
                                        ref={previewContainerRef}
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={handlePointerUp}
                                        className="relative w-full aspect-[21/9] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/80 shadow-inner select-none cursor-crosshair"
                                    >
                                        {/* Media nền */}
                                        {formData.previewImage ? (
                                            formData.mediaType === 'video' ? (
                                                <video 
                                                    src={formData.previewImage} 
                                                    autoPlay 
                                                    muted 
                                                    loop 
                                                    playsInline
                                                    className="w-full h-full object-cover pointer-events-none select-none" 
                                                />
                                            ) : (
                                                <img 
                                                    src={formData.previewImage} 
                                                    alt="Preview" 
                                                    className="w-full h-full object-cover pointer-events-none select-none" 
                                                />
                                            )
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center bg-gradient-to-br from-slate-900 to-slate-950">
                                                <FiImage size={32} className="mb-2 opacity-40 text-slate-400" />
                                                <p className="text-xs font-semibold text-slate-400">Chưa có ảnh/video được tải lên</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">Chọn tệp bên dưới để xem hình nền thực tế tại đây</p>
                                            </div>
                                        )}

                                        {/* Lớp phủ tối nhẹ để nổi bật chữ */}
                                        <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                                        {/* Khối chữ có thể Kéo Thả (Kiểu dáng sang trọng giống LV) */}
                                        <div 
                                            onPointerDown={handlePointerDown}
                                            className={`absolute select-none cursor-grab active:cursor-grabbing px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-75 touch-none ${
                                                isDragging 
                                                    ? 'ring-2 ring-orange-400 bg-black/50 backdrop-blur-xs scale-[1.02] shadow-2xl' 
                                                    : 'hover:ring-1 hover:ring-white/50 bg-black/20 backdrop-blur-2xs'
                                            }`}
                                            style={{
                                                left: `${formData.posX}%`,
                                                top: `${formData.posY}%`,
                                                transform: 'translate(-50%, -50%)',
                                                textAlign: formData.textAlign
                                            }}
                                        >
                                            <div className={`flex flex-col ${
                                                formData.textAlign === 'left' ? 'items-start text-left' :
                                                formData.textAlign === 'right' ? 'items-end text-right' :
                                                'items-center text-center'
                                            }`}>
                                                {/* Phụ đề (Subtitle uppercase LV style) */}
                                                {formData.subtitle ? (
                                                    <p className="text-white/95 text-[9px] sm:text-xs md:text-sm font-semibold tracking-[0.25em] uppercase mb-0.5 sm:mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] pointer-events-none select-none">
                                                        {formData.subtitle}
                                                    </p>
                                                ) : (
                                                    <p className="text-white/60 text-[8px] sm:text-[10px] font-semibold tracking-[0.2em] uppercase mb-0.5 border border-dashed border-white/40 px-1.5 py-0.2 rounded pointer-events-none select-none">
                                                        PHỤ ĐỀ TRÊN
                                                    </p>
                                                )}

                                                {/* Tiêu đề chính */}
                                                <h3 className="text-white text-sm sm:text-xl md:text-3xl font-normal sm:font-medium tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] leading-tight pointer-events-none select-none">
                                                    {formData.title.trim() || 'Ngày Phụ nữ Việt Nam'}
                                                </h3>

                                                {/* Nút bấm / Link gạch chân sang trọng */}
                                                <div className="inline-flex flex-col items-center mt-1.5 sm:mt-2.5 pointer-events-none select-none">
                                                    <span className="text-white text-[11px] sm:text-sm md:text-base font-medium tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                                                        {formData.buttonText || 'Khám phá thêm'}
                                                    </span>
                                                    <span className="w-full h-[1.5px] bg-white mt-0.5 shadow-sm" />
                                                </div>
                                            </div>

                                            {/* Tag biểu tượng kéo thả */}
                                            <div className="absolute -top-2.5 -right-2.5 bg-orange-500 text-white rounded-full p-1 text-[9px] shadow-md flex items-center justify-center pointer-events-none">
                                                <FiMove size={10} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Thanh công cụ định vị nhanh & Căn lề chữ */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                        {/* Căn lề chữ */}
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-slate-600 mr-1">Căn lề:</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, textAlign: 'left' }))}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                                                    formData.textAlign === 'left' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <FiAlignLeft size={13} /> Trái
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, textAlign: 'center' }))}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                                                    formData.textAlign === 'center' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <FiAlignCenter size={13} /> Giữa
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, textAlign: 'right' }))}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                                                    formData.textAlign === 'right' ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <FiAlignRight size={13} /> Phải
                                            </button>
                                        </div>

                                        {/* Vị trí nhanh (Presets) */}
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-xs font-bold text-slate-600 mr-1">Vị trí mẫu:</span>
                                            {[
                                                { label: '🎯 Giữa tâm', x: 50, y: 50, align: 'center' },
                                                { label: '⬇️ Đáy giữa', x: 50, y: 80, align: 'center' },
                                                { label: '⬆️ Đỉnh giữa', x: 50, y: 20, align: 'center' },
                                                { label: '↙️ Đáy trái', x: 22, y: 80, align: 'left' },
                                                { label: '↘️ Đáy phải', x: 78, y: 80, align: 'right' },
                                                { label: '⬅️ Giữa trái', x: 22, y: 50, align: 'left' },
                                            ].map((preset) => (
                                                <button
                                                    key={preset.label}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ 
                                                        ...prev, 
                                                        posX: preset.x, 
                                                        posY: preset.y,
                                                        textAlign: preset.align 
                                                    }))}
                                                    className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition cursor-pointer"
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CÁC TRƯỜNG NHẬP NỘI DUNG */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Phụ đề trên (Subtitle) */}
                                <div>
                                    <label className={`block text-xs font-bold mb-1 transition-colors ${!formData.showContent ? 'text-slate-400' : 'text-slate-700'}`}>
                                        Phụ đề trên (Chữ in hoa thanh lịch)
                                    </label>
                                    <input 
                                        type="text" 
                                        name="subtitle"
                                        disabled={!formData.showContent}
                                        value={formData.subtitle} 
                                        onChange={handleInputChange}
                                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                                            !formData.showContent 
                                                ? 'bg-slate-100 border border-slate-300 text-slate-400 cursor-not-allowed select-none' 
                                                : 'bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white'
                                        }`}
                                        placeholder="Ví dụ: GỢI Ý QUÀ TẶNG hoặc BST MỚI"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Xuất hiện ngay phía trên tiêu đề chính với khoảng cách chữ rộng.</p>
                                </div>

                                {/* Tiêu đề chính Banner */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className={`block text-xs font-bold transition-colors ${!formData.showContent ? 'text-slate-400' : 'text-slate-700'}`}>
                                            Tiêu đề Banner {formData.showContent ? <span className="text-rose-500">*</span> : <span className="text-xs font-normal text-slate-400">(Không cần điền)</span>}
                                        </label>
                                        {!formData.showContent && (
                                            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                                <FiLock size={10} /> Đã khóa
                                            </span>
                                        )}
                                    </div>
                                    <input 
                                        type="text" 
                                        required={formData.showContent}
                                        disabled={!formData.showContent}
                                        name="title"
                                        value={formData.title} 
                                        onChange={handleInputChange}
                                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                                            !formData.showContent 
                                                ? 'bg-slate-100 border border-slate-300 text-slate-400 cursor-not-allowed select-none' 
                                                : 'bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white'
                                        }`}
                                        placeholder="Ví dụ: Ngày Phụ nữ Việt Nam"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Tiêu đề trung tâm với kích thước lớn và hiệu ứng đổ bóng cao cấp.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Chữ hiển thị trên Nút / Link */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Chữ trên nút / Link gạch chân
                                    </label>
                                    <input 
                                        type="text" 
                                        name="buttonText"
                                        value={formData.buttonText} 
                                        onChange={handleInputChange}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition"
                                        placeholder="Mặc định: Khám phá thêm"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Được gạch chân sang trọng theo phong cách Louis Vuitton.</p>
                                </div>

                                {/* Link điều hướng */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Link điều hướng khi click vào banner (tùy chọn)
                                    </label>
                                    <input 
                                        type="text" 
                                        name="linkUrl"
                                        value={formData.linkUrl} 
                                        onChange={handleInputChange}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition"
                                        placeholder="Ví dụ: /menu hoặc /products/... hoặc link ngoài"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        💡 Khi bật chữ, khách hàng chỉ bấm vào nút gạch chân mới chuyển trang (bấm ra ngoài không nhảy trang). Khi ẩn chữ, bấm toàn bộ banner sẽ chuyển trang.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Thứ tự hiển thị</label>
                                    <input 
                                        type="number" 
                                        name="order"
                                        value={formData.order} 
                                        onChange={handleInputChange}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-0.5">Số nhỏ hơn sẽ ưu tiên hiện trước</p>
                                </div>
                                <div className="flex-1 flex items-center mt-5">
                                    <label className="flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            name="isActive"
                                            checked={formData.isActive} 
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500 border-slate-300 cursor-pointer"
                                        />
                                        <span className="ml-2 font-bold text-slate-700 text-xs sm:text-sm">Bật hiển thị ngay</span>
                                    </label>
                                </div>
                            </div>

                            {/* Upload Hình ảnh hoặc Video */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Tệp Banner (Hình Ảnh hoặc Video) <span className="text-rose-500">*</span>
                                </label>
                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                    <div className="flex-1 w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-4 pb-5 text-center px-4">
                                                <div className="flex items-center gap-2 mb-1.5 text-slate-400">
                                                    <FiImage size={22} />
                                                    <span className="text-slate-300">/</span>
                                                    <FiVideo size={22} />
                                                </div>
                                                <p className="text-xs sm:text-sm text-slate-700 font-bold">Bấm để tải Ảnh hoặc Video mới lên</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">Định dạng: JPG, PNG, WEBP, MP4, WEBM (Tỷ lệ khuyến nghị 21:9)</p>
                                            </div>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*,video/mp4,video/webm,video/quicktime" 
                                                onChange={handleMediaChange} 
                                            />
                                        </label>
                                    </div>

                                    {/* Khung thumbnail nhỏ */}
                                    {formData.previewImage && (
                                        <div className="w-full sm:w-44 h-32 rounded-2xl overflow-hidden border border-slate-200 shadow-xs flex-shrink-0 bg-black relative">
                                            {formData.mediaType === 'video' ? (
                                                <video 
                                                    src={formData.previewImage} 
                                                    controls 
                                                    autoPlay 
                                                    muted 
                                                    loop 
                                                    playsInline
                                                    className="w-full h-full object-cover" 
                                                />
                                            ) : (
                                                <img 
                                                    src={formData.previewImage} 
                                                    alt="Thumbnail Preview" 
                                                    className="w-full h-full object-cover" 
                                                />
                                            )}
                                            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-extrabold shadow-xs">
                                                {formData.mediaType === 'video' ? '▶ VIDEO' : 'ẢNH'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)} 
                                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-orange-500 hover:bg-orange-600 transition shadow-sm cursor-pointer"
                                >
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
