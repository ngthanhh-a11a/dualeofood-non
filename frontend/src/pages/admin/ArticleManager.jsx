import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const ArticleManager = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    const [formData, setFormData] = useState({
        _id: '',
        title: '',
        slug: '',
        content: '',
        tags: '',
        isPublished: false,
        thumbnail: null,
        previewImage: null
    });

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/articles');
            setArticles(res.data);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách bài viết');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    const generateSlug = (text) => {
        return text.toString().toLowerCase()
            .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
            .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
            .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
            .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
            .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
            .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
            .replace(/đ/gi, 'd')
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        if (!isEditing) {
            setFormData({ ...formData, title, slug: generateSlug(title) });
        } else {
            setFormData({ ...formData, title });
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleContentChange = (content) => {
        setFormData({ ...formData, content });
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData({ ...formData, thumbnail: file, previewImage: URL.createObjectURL(file) });
        }
    };

    const handleOpenModal = async (articleId = null) => {
        if (articleId) {
            const loadingToast = toast.loading('Đang tải dữ liệu bài viết...');
            try {
                const res = await axios.get(`/articles/id/${articleId}`);
                const article = res.data;
                setFormData({
                    _id: article._id,
                    title: article.title,
                    slug: article.slug,
                    content: article.content,
                    tags: article.tags ? article.tags.join(', ') : '',
                    isPublished: article.isPublished,
                    thumbnail: null,
                    previewImage: article.thumbnail
                });
                setIsEditing(true);
                toast.dismiss(loadingToast);
            } catch (error) {
                toast.error('Không thể tải bài viết', { id: loadingToast });
                return;
            }
        } else {
            setFormData({
                _id: '', title: '', slug: '', content: '', tags: '', isPublished: false, thumbnail: null, previewImage: null
            });
            setIsEditing(false);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) return toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung');
        if (!isEditing && !formData.thumbnail) return toast.error('Vui lòng chọn ảnh bìa cho bài viết');

        const data = new FormData();
        data.append('title', formData.title);
        data.append('slug', formData.slug);
        data.append('content', formData.content);
        data.append('tags', formData.tags);
        data.append('isPublished', formData.isPublished);
        if (formData.thumbnail) data.append('thumbnail', formData.thumbnail);

        const loadingToast = toast.loading(isEditing ? 'Đang cập nhật bài viết...' : 'Đang tạo bài viết...');
        try {
            if (isEditing) {
                await axios.put(`/articles/${formData._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Cập nhật thành công', { id: loadingToast });
            } else {
                await axios.post('/articles', data, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Tạo bài viết thành công', { id: loadingToast });
            }
            setShowModal(false);
            fetchArticles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: loadingToast });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xoá bài viết này không?')) {
            try {
                await axios.delete(`/articles/${id}`);
                toast.success('Xoá bài viết thành công');
                fetchArticles();
            } catch (error) {
                toast.error('Lỗi khi xoá bài viết');
            }
        }
    };

    const togglePublish = async (article) => {
        try {
            await axios.put(`/articles/${article._id}`, { isPublished: !article.isPublished });
            toast.success(article.isPublished ? 'Đã ẩn bài viết' : 'Đã xuất bản bài viết');
            fetchArticles();
        } catch (error) {
            toast.error('Lỗi khi cập nhật trạng thái xuất bản');
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await axios.put(`/articles/${id}`, { status });
            toast.success(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} bài viết`);
            fetchArticles();
        } catch (error) {
            toast.error('Lỗi khi cập nhật trạng thái kiểm duyệt');
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
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Bài viết & Tin tức</h1>
                    <p className="text-sm text-gray-500">Quản lý các bài viết trên trang Blog/Tin tức</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                    <FiPlus /> Viết bài mới
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
                                <th className="p-4 w-32">Ảnh bìa</th>
                                <th className="p-4">Tiêu đề</th>
                                <th className="p-4 w-32 text-center">Lượt xem</th>
                                <th className="p-4 w-32 text-center">Hiển thị</th>
                                <th className="p-4 w-32 text-center">Kiểm duyệt</th>
                                <th className="p-4 w-40 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {articles.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">
                                        Chưa có bài viết nào. Hãy tạo bài viết đầu tiên!
                                    </td>
                                </tr>
                            ) : (
                                articles.map(article => (
                                    <tr key={article._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 align-middle">
                                            <div className="h-16 w-24 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                                                <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover" />
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <h3 className="font-bold text-slate-800 mb-1">{article.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span>{new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                                                {article.author && <span className="px-2 py-0.5 bg-gray-100 rounded-full">{article.author.name}</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-center font-semibold text-gray-600">
                                            {article.views}
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            <span 
                                                onClick={() => togglePublish(article)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${article.isPublished ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                {article.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            {renderStatus(article.status || 'approved')}
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {userInfo.role === 'admin' && article.status === 'pending' && (
                                                    <div className="flex flex-col gap-1 mr-2">
                                                        <button onClick={() => handleUpdateStatus(article._id, 'approved')} className="text-white bg-green-500 hover:bg-green-600 px-2 py-1 rounded text-xs font-bold transition-colors">Duyệt</button>
                                                        <button onClick={() => handleUpdateStatus(article._id, 'rejected')} className="text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-xs font-bold transition-colors">Từ chối</button>
                                                    </div>
                                                )}
                                                <Link to={`/blog/${article.slug}`} target="_blank" className="text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-lg" title="Xem thử">
                                                    <FiExternalLink />
                                                </Link>
                                                {userInfo.role === 'admin' && (
                                                    <>
                                                        <button onClick={() => handleOpenModal(article._id)} className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg" title="Sửa">
                                                            <FiEdit2 />
                                                        </button>
                                                        <button onClick={() => handleDelete(article._id)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg" title="Xoá">
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto mt-10">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-slate-800">
                                {isEditing ? 'Chỉnh sửa Bài viết' : 'Viết bài mới'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-2 space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tiêu đề bài viết <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" required
                                            value={formData.title} onChange={handleTitleChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-lg font-semibold"
                                            placeholder="Nhập tiêu đề..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Đường dẫn (Slug)</label>
                                        <input 
                                            type="text" name="slug" required
                                            value={formData.slug} onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm text-gray-500 bg-gray-50"
                                        />
                                    </div>
                                    <div className="pb-12">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nội dung <span className="text-red-500">*</span></label>
                                        <div className="bg-white rounded-lg border border-gray-200 h-96">
                                            <ReactQuill 
                                                theme="snow"
                                                value={formData.content}
                                                onChange={handleContentChange}
                                                modules={modules}
                                                className="h-[340px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-1 space-y-6">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <h3 className="font-bold text-slate-700 mb-4 border-b border-gray-200 pb-2">Xuất bản</h3>
                                        <label className="flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" name="isPublished"
                                                checked={formData.isPublished} onChange={handleInputChange}
                                                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 border-gray-300"
                                            />
                                            <span className="ml-2 font-semibold text-gray-700">Công khai bài viết này</span>
                                        </label>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <h3 className="font-bold text-slate-700 mb-4 border-b border-gray-200 pb-2">Ảnh bìa <span className="text-red-500">*</span></h3>
                                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors overflow-hidden">
                                            {formData.previewImage ? (
                                                <img src={formData.previewImage} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <FiImage className="w-8 h-8 text-gray-400 mb-2" />
                                                    <p className="text-sm text-gray-500 font-medium">Tải ảnh lên</p>
                                                </div>
                                            )}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </label>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <h3 className="font-bold text-slate-700 mb-4 border-b border-gray-200 pb-2">Thẻ (Tags)</h3>
                                        <input 
                                            type="text" name="tags"
                                            value={formData.tags} onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm"
                                            placeholder="Cách nhau bởi dấu phẩy, vd: Khuyến mãi, Trà sữa"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors">
                                    {isEditing ? 'Lưu bài viết' : 'Đăng bài viết'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArticleManager;
