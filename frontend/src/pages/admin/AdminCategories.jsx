import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';

// --- BẮT ĐẦU PHẦN CSS ---
// Toàn bộ CSS được đưa vào đây dưới dạng một chuỗi template literal
const styles = `
.admin-categories-container {
    padding: 2rem;
    background-color: #f9fafb;
    min-height: 100vh;
}

.admin-categories-container .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.admin-categories-container h1 {
    font-size: 1.8rem;
    font-weight: 600;
}

.btn {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
}

.btn-primary {
    background-color: #3b82f6;
    color: white;
}
.btn-primary:hover {
    background-color: #2563eb;
}

.btn-secondary {
    background-color: #6b7280;
    color: white;
}
.btn-secondary:hover {
    background-color: #4b5563;
}

.btn-danger {
    background-color: #ef4444;
    color: white;
}
.btn-danger:hover {
    background-color: #dc2626;
}

.categories-table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
}

.categories-table th, .categories-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
}

.categories-table td:first-child {
    font-size: 1.5rem; /* Tăng kích thước icon */
    text-align: center;
    width: 80px;
}

.categories-table th {
    background-color: #f3f4f6;
    font-weight: 600;
}

.categories-table .status {
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 500;
}

.status.active {
    background-color: #dcfce7;
    color: #166534;
}

.status.inactive {
    background-color: #fee2e2;
    color: #991b1b;
}

.categories-table .actions {
    display: flex;
    gap: 0.5rem;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.form-group input[type="text"] {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
}

.form-group-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
}
`;

// Component này chỉ có nhiệm vụ render thẻ <style>
const CategoryStyles = () => <style>{styles}</style>;
// --- KẾT THÚC PHẦN CSS ---


import api from '../../utils/axiosConfig';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        image: '',
        isActive: true,
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/categories');
            setCategories(data);
        } catch (error) {
            toast.error('Lỗi khi tải danh mục!');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        setCurrentCategory(category);
        if (category) {
            setFormData({
                name: category.name,
                image: category.image || '',
                isActive: category.isActive,
            });
        } else {
            setFormData({ name: '', image: '', isActive: true });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCategory(null);
        setFormData({ name: '', image: '', isActive: true });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error('Tên danh mục không được để trống.');
            return;
        }

        const apiCall = currentCategory
            ? api.put(`/categories/${currentCategory._id}`, formData)
            : api.post('/categories', formData);

        const toastId = toast.loading(currentCategory ? 'Đang cập nhật...' : 'Đang tạo mới...');

        try {
            await apiCall;
            toast.success(currentCategory ? 'Cập nhật thành công!' : 'Tạo mới thành công!', { id: toastId });
            fetchCategories();
            handleCloseModal();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi';
            toast.error(errorMessage, { id: toastId });
            console.error(error);
        }
    };

    const handleDelete = async (categoryId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác.')) {
            const toastId = toast.loading('Đang xóa...');
            try {
                await api.delete(`/categories/${categoryId}`);
                toast.success('Xóa danh mục thành công!', { id: toastId });
                fetchCategories();
            } catch (error) {
                const errorMessage = error.response?.data?.message || 'Lỗi khi xóa danh mục';
                toast.error(errorMessage, { id: toastId });
                console.error(error);
            }
        }
    };

    return (
        <div className="admin-categories-container">
            <CategoryStyles /> {/* Thêm component style vào đây */}
            <Toaster position="top-right" />
            <div className="header">
                <h1>Quản lý Danh mục</h1>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>Thêm Danh mục mới</button>
            </div>

            {loading ? <p>Đang tải dữ liệu...</p> : (
                <table className="categories-table">
                    <thead>
                        <tr>
                            <th className="text-center">Icon</th>
                            <th>Tên Danh mục</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(cat => (
                            <tr key={cat._id}>
                                <td>{cat.image}</td>
                                <td>{cat.name}</td>
                                <td>
                                    <span className={`status ${cat.isActive ? 'active' : 'inactive'}`}>
                                        {cat.isActive ? 'Đang hoạt động' : 'Tạm ẩn'}
                                    </span>
                                </td>
                                <td className="actions">
                                    <button className="btn btn-secondary" onClick={() => handleOpenModal(cat)}>Sửa</button>
                                    <button className="btn btn-danger" onClick={() => handleDelete(cat._id)}>Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{currentCategory ? 'Chỉnh sửa Danh mục' : 'Tạo Danh mục mới'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="name">Tên Danh mục</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="image">Biểu tượng (Icon)</label>
                                <input
                                    type="text"
                                    id="image"
                                    name="image"
                                    value={formData.image}
                                    onChange={handleInputChange}
                                    placeholder="Dán một emoji vào đây, ví dụ: 🍔"
                                />
                            </div>
                            <div className="form-group form-group-checkbox">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                />
                                <label htmlFor="isActive">Hiển thị danh mục này</label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Hủy</button>
                                <button type="submit" className="btn btn-primary">
                                    {currentCategory ? 'Lưu thay đổi' : 'Tạo mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategories;
