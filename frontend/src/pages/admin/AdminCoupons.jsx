import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiTag, FiLoader } from 'react-icons/fi';

// --- Component Modal Form ---
const CouponFormModal = ({ isOpen, onClose, onSave, coupon, isEditing }) => {
    const [formData, setFormData] = useState({
        code: '',
        discountPercent: '',
        maxDiscountAmount: '',
        minOrderValue: '',
        expiryDate: '',
        usageLimit: '',
        isActive: true,
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isEditing && coupon) {
            setFormData({
                code: coupon.code || '',
                discountPercent: coupon.discountPercent || '',
                maxDiscountAmount: coupon.maxDiscountAmount || '',
                minOrderValue: coupon.minOrderValue || '',
                // Format date for input type="datetime-local"
                expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().slice(0, 16) : '',
                usageLimit: coupon.usageLimit || '',
                isActive: coupon.isActive ?? true,
            });
        } else {
            // Reset form for creating new
            setFormData({
                code: '', discountPercent: '', maxDiscountAmount: '', minOrderValue: '',
                expiryDate: '', usageLimit: '', isActive: true,
            });
        }
    }, [isOpen, coupon, isEditing]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Convert usageLimit to number, or null if empty/0
            const payload = {
                ...formData,
                usageLimit: formData.usageLimit && Number(formData.usageLimit) > 0 ? Number(formData.usageLimit) : null
            };
            await onSave(payload, coupon?._id);
            onClose(); // Close modal on success
        } catch (error) {
            // Error is already handled in the parent component's onSave function
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 animate-fade-in-down">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-bold text-gray-800">{isEditing ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}</h3>
                    <button onClick={onClose} className="text-2xl text-gray-500 hover:text-red-500">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mã Code *</label>
                            <input type="text" name="code" value={formData.code} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phần trăm giảm (%) *</label>
                            <input type="number" name="discountPercent" value={formData.discountPercent} onChange={handleChange} required min="1" max="100" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Giảm tối đa (VNĐ) *</label>
                            <input type="number" name="maxDiscountAmount" value={formData.maxDiscountAmount} onChange={handleChange} required min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Đơn tối thiểu (VNĐ) *</label>
                            <input type="number" name="minOrderValue" value={formData.minOrderValue} onChange={handleChange} required min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ngày hết hạn *</label>
                            <input type="datetime-local" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Giới hạn lượt dùng</label>
                            <input type="number" name="usageLimit" value={formData.usageLimit} onChange={handleChange} placeholder="Để trống nếu không giới hạn" min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500" />
                        <label className="ml-2 block text-sm text-gray-900">Kích hoạt mã</label>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Hủy</button>
                        <button type="submit" disabled={isSaving} className="bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 disabled:bg-sky-300 flex items-center gap-2">
                            {isSaving && <FiLoader className="animate-spin" />}
                            {isSaving ? 'Đang lưu...' : 'Lưu lại'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Component chính ---
const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Lấy danh sách mã giảm giá từ Backend
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/coupons');
      setCoupons(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách mã giảm giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentCoupon(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon) => {
    setIsEditing(true);
    setCurrentCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleSave = async (formData, id) => {
    const toastId = toast.loading(isEditing ? 'Đang cập nhật...' : 'Đang tạo...');
    try {
      let response;
      if (isEditing) {
        response = await axios.put(`/coupons/${id}`, formData);
      } else {
        response = await axios.post('/coupons', formData);
      }
      toast.success(response.data.message, { id: toastId });
      fetchCoupons(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đã có lỗi xảy ra.', { id: toastId });
      throw error; // Re-throw to keep modal open on error
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa mã giảm giá này không?')) {
      const toastId = toast.loading('Đang xóa...');
      try {
        const { data } = await axios.delete(`/coupons/${id}`);
        toast.success(data.message, { id: toastId });
        fetchCoupons(); // Refresh list
      } catch (error) {
        toast.error(error.response?.data?.message || 'Xóa thất bại.', { id: toastId });
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <CouponFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        coupon={currentCoupon}
        isEditing={isEditing}
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FiTag /> Quản lý Mã giảm giá</h1>
        <button onClick={handleOpenAddModal} className="bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 flex items-center gap-2">
          <FiPlus /> Thêm mã mới
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giảm giá</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điều kiện</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lượt dùng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hết hạn</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="7" className="text-center py-10">Đang tải...</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-10 text-gray-500">Chưa có mã giảm giá nào.</td></tr>
            ) : (
              coupons.map(coupon => (
                <tr key={coupon._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{coupon.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{coupon.discountPercent}%</div>
                    <div className="text-xs text-gray-500">Tối đa {coupon.maxDiscountAmount.toLocaleString('vi-VN')}đ</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Đơn từ {coupon.minOrderValue.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-700">{coupon.usageCount}</span>
                    <span className="text-sm text-gray-500"> / {coupon.usageLimit !== null ? coupon.usageLimit : '∞'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(coupon.expiryDate).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {coupon.isActive ? 'Hoạt động' : 'Vô hiệu'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenEditModal(coupon)} className="text-sky-600 hover:text-sky-900 mr-4"><FiEdit size={18} /></button>
                    <button onClick={() => handleDelete(coupon._id)} className="text-red-600 hover:text-red-900"><FiTrash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCoupons;

