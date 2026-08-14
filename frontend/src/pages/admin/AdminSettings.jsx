import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { FiSave, FiSettings, FiTruck, FiCreditCard, FiTrash2, FiPlus } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('store');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // States
  const [storeInfo, setStoreInfo] = useState({ name: '', address: '', phone: '', email: '' });
  const [shippingFees, setShippingFees] = useState([]);
  const [operationalAreas, setOperationalAreas] = useState([]);
  
  // Order Settings (Tự động xóa)
  const [orderSettings, setOrderSettings] = useState({ enabled: false, deleteAfterDays: 90 });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const [generalRes, orderRes] = await Promise.all([
          axios.get('/settings/general'),
          axios.get('/settings/orders')
        ]);
        
        if (generalRes.data && generalRes.data.value) {
          const { storeInfo, shippingFees, operationalAreas } = generalRes.data.value;
          setStoreInfo(storeInfo || { name: '', address: '', phone: '', email: '' });
          setShippingFees(shippingFees || []);
          setOperationalAreas(operationalAreas || []);
        }
        
        if (orderRes.data && orderRes.data.value && orderRes.data.value.autoDelete) {
          setOrderSettings(orderRes.data.value.autoDelete);
        }
      } catch (error) {
        console.error('Lỗi khi tải cài đặt:', error);
        toast.error('Không thể tải dữ liệu cài đặt');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      const payload = {
        storeInfo,
        shippingFees,
        operationalAreas
      };
      await axios.put('/settings/general', payload);
      toast.success('Lưu cấu hình chung thành công!');
    } catch (error) {
      toast.error('Lỗi khi lưu cấu hình chung!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOrderSettings = async () => {
    setIsSaving(true);
    try {
      await axios.put('/settings/orders', { autoDelete: orderSettings });
      toast.success('Cài đặt đơn hàng đã được lưu!');
    } catch (error) {
      toast.error('Lỗi khi lưu cài đặt đơn hàng!');
    } finally {
      setIsSaving(false);
    }
  };

  // Các hàm helper cho array inputs
  const handleAddShippingFee = () => {
    setShippingFees([...shippingFees, { id: Date.now(), area: '', fee: 0 }]);
  };
  
  const handleUpdateShippingFee = (index, field, value) => {
    const updated = [...shippingFees];
    updated[index][field] = field === 'fee' ? Number(value) : value;
    setShippingFees(updated);
  };
  
  const handleRemoveShippingFee = (index) => {
    setShippingFees(shippingFees.filter((_, i) => i !== index));
  };
  
  const handleAddArea = () => {
    setOperationalAreas([...operationalAreas, '']);
  };
  
  const handleUpdateArea = (index, value) => {
    const updated = [...operationalAreas];
    updated[index] = value;
    setOperationalAreas(updated);
  };
  
  const handleRemoveArea = (index) => {
    setOperationalAreas(operationalAreas.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Đang tải cài đặt hệ thống...</div>;
  }

  return (
    <div className="font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-800">⚙️ Cài Đặt Hệ Thống</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar cho Tabs */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 space-y-1">
            <button 
              onClick={() => setActiveTab('store')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'store' ? 'bg-sky-50 text-sky-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <FaStore size={18} /> Thông Tin Cửa Hàng
            </button>
            <button 
              onClick={() => setActiveTab('shipping')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'shipping' ? 'bg-sky-50 text-sky-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <FiTruck size={18} /> Vận Chuyển & Khu Vực
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'orders' ? 'bg-sky-50 text-sky-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <FiSettings size={18} /> Cài Đặt Đơn Hàng
            </button>
          </div>
        </div>

        {/* Nội dung Tabs */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          
          {/* TAB: THÔNG TIN CỬA HÀNG */}
          {activeTab === 'store' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Thông Tin Cửa Hàng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tên cửa hàng</label>
                  <input type="text" value={storeInfo.name} onChange={e => setStoreInfo({...storeInfo, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
                  <input type="text" value={storeInfo.phone} onChange={e => setStoreInfo({...storeInfo, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Địa chỉ</label>
                  <input type="text" value={storeInfo.address} onChange={e => setStoreInfo({...storeInfo, address: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email liên hệ</label>
                  <input type="email" value={storeInfo.email} onChange={e => setStoreInfo({...storeInfo, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500 outline-none" />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button onClick={handleSaveGeneral} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600 transition disabled:opacity-50">
                  <FiSave /> {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </div>
          )}

          {/* TAB: VẬN CHUYỂN & KHU VỰC */}
          {activeTab === 'shipping' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Khu Vực Hoạt Động</h2>
                  <button onClick={handleAddArea} className="text-sky-500 text-sm font-bold flex items-center gap-1 hover:text-sky-600"><FiPlus /> Thêm khu vực</button>
                </div>
                <div className="space-y-3">
                  {operationalAreas.map((area, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <input type="text" value={area} onChange={e => handleUpdateArea(index, e.target.value)} placeholder="VD: Hà Nội, Quận 1..." className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500 outline-none" />
                      <button onClick={() => handleRemoveArea(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 size={20} /></button>
                    </div>
                  ))}
                  {operationalAreas.length === 0 && <p className="text-sm text-gray-500 italic">Chưa có khu vực nào. Hãy thêm khu vực.</p>}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Cước Phí Vận Chuyển</h2>
                  <button onClick={handleAddShippingFee} className="text-sky-500 text-sm font-bold flex items-center gap-1 hover:text-sky-600"><FiPlus /> Thêm cước phí</button>
                </div>
                <div className="space-y-3">
                  {shippingFees.map((fee, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <input type="text" value={fee.area} onChange={e => handleUpdateShippingFee(index, 'area', e.target.value)} placeholder="Tên khu vực (VD: Nội thành)" className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500 outline-none" />
                      <div className="relative">
                        <input type="number" value={fee.fee} onChange={e => handleUpdateShippingFee(index, 'fee', e.target.value)} className="w-32 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500 outline-none" />
                        <span className="absolute right-3 top-2.5 text-gray-500 text-sm font-bold">đ</span>
                      </div>
                      <button onClick={() => handleRemoveShippingFee(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 size={20} /></button>
                    </div>
                  ))}
                  {shippingFees.length === 0 && <p className="text-sm text-gray-500 italic">Chưa có biểu phí nào.</p>}
                </div>
              </div>

              <div className="pt-4 flex justify-end border-t">
                <button onClick={handleSaveGeneral} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600 transition disabled:opacity-50">
                  <FiSave /> {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </div>
          )}

          {/* TAB: CÀI ĐẶT ĐƠN HÀNG */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Cài Đặt Đơn Hàng</h2>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-sky-500 rounded focus:ring-sky-500"
                    checked={orderSettings.enabled}
                    onChange={(e) => setOrderSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                  <span className="ml-3 font-bold text-gray-700">Tự động xóa đơn hàng đã hoàn thành</span>
                </label>
                <p className="text-sm text-gray-500 mt-2 ml-8">
                  Hệ thống sẽ tự động xóa vĩnh viễn các đơn hàng có trạng thái "Hoàn thành" sau một khoảng thời gian để tối ưu hóa cơ sở dữ liệu. Tính năng này chạy ngầm vào 2:00 sáng mỗi ngày.
                </p>
              </div>

              {orderSettings.enabled && (
                <div className="pl-8 animate-fade-in">
                  <label className="block text-gray-600 font-semibold mb-2">Xóa sau:</label>
                  <select 
                    value={orderSettings.deleteAfterDays}
                    onChange={(e) => setOrderSettings(prev => ({ ...prev, deleteAfterDays: Number(e.target.value) }))}
                    className="w-full md:w-1/2 border border-gray-300 rounded-lg px-4 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="30">30 ngày</option>
                    <option value="60">60 ngày</option>
                    <option value="90">90 ngày</option>
                    <option value="180">6 tháng</option>
                    <option value="365">1 năm</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button onClick={handleSaveOrderSettings} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-white font-bold rounded-lg hover:bg-sky-600 transition disabled:opacity-50">
                  <FiSave /> {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
