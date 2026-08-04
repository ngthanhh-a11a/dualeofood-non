import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { Toaster, toast } from 'react-hot-toast';
import { FiPlus, FiMapPin, FiEdit, FiTrash2, FiCheckCircle } from 'react-icons/fi';

// Modal component for Add/Edit Address
const AddressModal = ({ isOpen, onClose, onSubmit, addressData, setAddressData }) => { // NOSONAR
    if (!isOpen) return null;

    const isEditing = addressData && addressData._id;

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setAddressData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(addressData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-11/12 max-w-lg transform transition-all animate-modal-in">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEditing ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-600 font-semibold mb-2 text-sm">Tên gợi nhớ (VD: Nhà, Công ty...)</label>
                        <input type="text" name="label" value={addressData.label || ''} onChange={handleInputChange} placeholder="Tùy chọn" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-2 text-sm">Họ và Tên *</label>
                        <input type="text" name="name" value={addressData.name} onChange={handleInputChange} required placeholder="Nguyễn Văn A" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-2 text-sm">Số điện thoại *</label>
                        <input type="tel" name="phone" value={addressData.phone} onChange={handleInputChange} required pattern="[0-9]{10}" title="Số điện thoại phải có 10 chữ số" placeholder="09xxxxxxxx" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-2 text-sm">Địa chỉ chi tiết *</label>
                        <textarea name="street" value={addressData.street} onChange={handleInputChange} required rows="3" placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 resize-none"></textarea>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="isDefault" name="isDefault" checked={addressData.isDefault} onChange={handleInputChange} className="w-5 h-5 text-sky-500 rounded focus:ring-sky-500" />
                        <label htmlFor="isDefault" className="font-semibold text-gray-700">Đặt làm địa chỉ mặc định</label>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button>
                        <button type="submit" className="px-6 py-2 font-bold text-white bg-sky-500 rounded-lg hover:bg-sky-600">Lưu</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const MyAddresses = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAddress, setCurrentAddress] = useState(null);

    const initialFormData = { label: '', name: '', phone: '', street: '', isDefault: false };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/users/profile');
            setAddresses(data.addresses || []);
        } catch (error) {
            toast.error('Không thể tải danh sách địa chỉ.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (address = null) => {
        setCurrentAddress(address ? { ...address } : initialFormData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentAddress(null);
    };

    const handleSubmit = async (addressData) => {
        const isEditing = addressData._id;
        const apiCall = isEditing
            ? axios.put(`/users/addresses/${addressData._id}`, addressData)
            : axios.post('/users/addresses', addressData);
        
        const toastId = toast.loading(isEditing ? 'Đang cập nhật...' : 'Đang thêm...');

        try {
            const { data } = await apiCall;
            setAddresses(data);
            toast.success(isEditing ? 'Cập nhật thành công!' : 'Thêm địa chỉ thành công!', { id: toastId });
            handleCloseModal();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đã xảy ra lỗi.', { id: toastId });
        }
    };

    const handleDelete = async (addressId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
            const toastId = toast.loading('Đang xóa...');
            try {
                const { data } = await axios.delete(`/users/addresses/${addressId}`);
                setAddresses(data);
                toast.success('Xóa địa chỉ thành công!', { id: toastId });
            } catch (error) {
                toast.error(error.response?.data?.message || 'Lỗi khi xóa địa chỉ.', { id: toastId });
            }
        }
    };

    const handleSetDefault = async (addressId) => {
        const toastId = toast.loading('Đang đặt làm mặc định...');
        try {
            const { data } = await axios.put(`/users/addresses/${addressId}/default`);
            setAddresses(data);
            toast.success('Đặt làm địa chỉ mặc định thành công!', { id: toastId });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đã xảy ra lỗi.', { id: toastId });
        }
    };

    if (loading) return <div className="text-center py-20 font-bold text-sky-500">Đang tải...</div>;

    return (
        <div className="font-sans bg-slate-50/70 min-h-screen py-12">
            <Toaster position="top-right" />
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="flex justify-between items-center mb-8 border-b border-sky-100 pb-4">
                    <h1 className="text-3xl font-black text-sky-500">📍 Sổ Địa Chỉ</h1>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-sky-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-600 transition shadow-sm">
                        <FiPlus />
                        <span>Thêm địa chỉ mới</span>
                    </button>
                </div>

                {addresses.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
                        <p className="text-xl text-gray-500 mb-6">Bạn chưa có địa chỉ nào được lưu.</p>
                        <button onClick={() => handleOpenModal()} className="text-sky-500 font-bold hover:underline">
                            Thêm địa chỉ đầu tiên của bạn
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {addresses.map(addr => (
                            <div key={addr._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        {addr.label && <span className="text-xs font-bold text-sky-600 bg-sky-100 px-2 py-1 rounded-full flex-shrink-0">{addr.label}</span>}
                                        <h3 className="font-bold text-gray-800 truncate">{addr.name}</h3>
                                        <span className="text-gray-500">|</span>
                                        <p className="text-gray-600">{addr.phone}</p>
                                    </div>
                                    <p className="text-gray-500 text-sm">{addr.street}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {addr.isDefault ? (
                                        <span className="flex items-center gap-1.5 text-sm font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                                            <FiCheckCircle /> Mặc định
                                        </span>
                                    ) : (
                                        <button onClick={() => handleSetDefault(addr._id)} className="text-sm font-semibold text-gray-500 hover:text-sky-500">Đặt làm mặc định</button>
                                    )}
                                    <button onClick={() => handleOpenModal(addr)} className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-blue-50" title="Sửa">
                                        <FiEdit />
                                    </button>
                                    <button onClick={() => handleDelete(addr._id)} className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50" title="Xóa">
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AddressModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                addressData={currentAddress}
                setAddressData={setCurrentAddress}
            />
        </div>
    );
};

export default MyAddresses;