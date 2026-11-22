import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { FiSave, FiSettings, FiTruck, FiCreditCard, FiTrash2, FiPlus, FiMapPin, FiNavigation, FiInfo } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import { getCurrentCoordinates, reverseGeocodeOSM } from '../../utils/geolocation';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('store');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocatingStore, setIsLocatingStore] = useState(false);

  // States
  const [storeInfo, setStoreInfo] = useState({ name: '', address: '', phone: '', email: '' });
  const [operationalAreas, setOperationalAreas] = useState([]);
  const [shippingConfig, setShippingConfig] = useState({
    enabled: true,
    restaurantLocation: {
      address: '123 Đường Bánh Mì, Quận Gà Rán, TP. HCM',
      lat: 10.776889,
      lng: 106.700806
    },
    baseDistanceKm: 3,
    baseFee: 15000,
    pricePerKm: 5000,
    maxDistanceKm: 25
  });
  
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
          const { storeInfo, operationalAreas, shippingConfig: savedShippingConfig } = generalRes.data.value;
          setStoreInfo(storeInfo || { name: '', address: '', phone: '', email: '' });
          setOperationalAreas(operationalAreas || []);
          if (savedShippingConfig) {
            setShippingConfig(prev => ({
              ...prev,
              ...savedShippingConfig,
              restaurantLocation: {
                ...prev.restaurantLocation,
                ...(savedShippingConfig.restaurantLocation || {})
              }
            }));
          }
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
        operationalAreas,
        shippingConfig
      };
      await axios.put('/settings/general', payload);
      toast.success('Lưu cấu hình chung và cước ship GPS thành công!');
    } catch (error) {
      toast.error('Lỗi khi lưu cấu hình chung!');
    } finally {
      setIsSaving(false);
    }
  };

  // Tự động lấy tọa độ GPS vị trí thực tế của Quán ăn
  const handleGetStoreGPS = async () => {
    setIsLocatingStore(true);
    const toastId = toast.loading('Đang lấy tín hiệu GPS của Quán...');
    try {
      const coords = await getCurrentCoordinates();
      toast.loading('Đang cập nhật địa chỉ...', { id: toastId });
      const addressName = await reverseGeocodeOSM(coords.lat, coords.lng);

      setShippingConfig(prev => ({
        ...prev,
        restaurantLocation: {
          address: addressName || prev.restaurantLocation.address,
          lat: Number(coords.lat.toFixed(6)),
          lng: Number(coords.lng.toFixed(6))
        }
      }));
      toast.success('Đã cập nhật tọa độ GPS Quán ăn thành công!', { id: toastId });
    } catch (err) {
      toast.error(err.message || 'Không thể lấy tọa độ GPS của Quán.', { id: toastId });
    } finally {
      setIsLocatingStore(false);
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
              {/* KHỐI 1: CẤU HÌNH PHÍ SHIP THEO GPS & KHOẢNG CÁCH (MÔ-ĐUN 03) */}
              <div className="p-5 sm:p-6 bg-gradient-to-br from-sky-50/70 via-white to-blue-50/50 rounded-2xl border border-sky-100 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                      <span className="p-1.5 bg-sky-500 text-white rounded-lg"><FiNavigation size={18} /></span>
                      Phí Ship Tự Động Theo Số Km Thực Tế (GPS)
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Hệ thống tự đo cự ly từ Quán đến Khách để tính cước chính xác và minh bạch.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto bg-white px-3.5 py-2 rounded-xl border border-sky-200 shadow-2xs">
                    <input 
                      type="checkbox" 
                      checked={shippingConfig.enabled} 
                      onChange={e => setShippingConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                    />
                    <span className="text-xs font-bold text-slate-700">Kích hoạt tính theo km</span>
                  </label>
                </div>

                {/* Vị trí quán */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <FiMapPin className="text-sky-600" /> Tọa độ Quán ăn (Gốc tính phí)
                    </label>
                    <button
                      type="button"
                      onClick={handleGetStoreGPS}
                      disabled={isLocatingStore}
                      className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <FiNavigation size={13} />
                      {isLocatingStore ? 'Đang lấy vị trí...' : 'Lấy tọa độ quán hiện tại'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Vĩ độ (Latitude)</label>
                      <input 
                        type="number" 
                        step="0.000001"
                        value={shippingConfig.restaurantLocation?.lat || ''} 
                        onChange={e => setShippingConfig(prev => ({
                          ...prev,
                          restaurantLocation: { ...prev.restaurantLocation, lat: parseFloat(e.target.value) || 0 }
                        }))}
                        placeholder="VD: 10.776889"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kinh độ (Longitude)</label>
                      <input 
                        type="number" 
                        step="0.000001"
                        value={shippingConfig.restaurantLocation?.lng || ''} 
                        onChange={e => setShippingConfig(prev => ({
                          ...prev,
                          restaurantLocation: { ...prev.restaurantLocation, lng: parseFloat(e.target.value) || 0 }
                        }))}
                        placeholder="VD: 106.700806"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Địa chỉ Quán hiển thị</label>
                      <input 
                        type="text" 
                        value={shippingConfig.restaurantLocation?.address || ''} 
                        onChange={e => setShippingConfig(prev => ({
                          ...prev,
                          restaurantLocation: { ...prev.restaurantLocation, address: e.target.value }
                        }))}
                        placeholder="Địa chỉ số nhà, tên đường quán"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bảng định mức giá cước thông minh - 5 Cột Rõ Ràng */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-sky-300 transition">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      1. Cự ly cơ sở
                    </label>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <input 
                        type="number" 
                        min="1"
                        value={shippingConfig.baseDistanceKm} 
                        onChange={e => setShippingConfig(prev => ({ ...prev, baseDistanceKm: Math.max(1, Number(e.target.value)) }))}
                        className="w-full bg-transparent text-sm font-black text-slate-800 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-500 shrink-0">km</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">Áp dụng cước cơ sở (VD: 3km)</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-sky-300 transition">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      2. Cước cơ sở (đầu)
                    </label>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <input 
                        type="number" 
                        step="1000"
                        value={shippingConfig.baseFee} 
                        onChange={e => setShippingConfig(prev => ({ ...prev, baseFee: Math.max(0, Number(e.target.value)) }))}
                        className={`w-full bg-transparent text-sm font-black outline-none ${shippingConfig.baseFee === 0 ? 'text-emerald-600' : 'text-sky-600'}`}
                      />
                      <span className="text-xs font-bold text-slate-500 shrink-0">đ</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                      {shippingConfig.baseFee === 0 ? '🎉 Đang MIỄN PHÍ giao hàng' : `Giá trọn gói ${shippingConfig.baseDistanceKm}km đầu`}
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-sky-300 transition">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      3. Cước bắt đầu khi vượt
                    </label>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <input 
                        type="number" 
                        step="1000"
                        value={shippingConfig.startFeeAfterBase ?? 10000} 
                        onChange={e => setShippingConfig(prev => ({ ...prev, startFeeAfterBase: Math.max(0, Number(e.target.value)) }))}
                        className="w-full bg-transparent text-sm font-black text-indigo-600 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-500 shrink-0">đ</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">Giá km đầu tiên sau mốc cơ sở (VD: 10k)</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-sky-300 transition">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      4. Phí mỗi km tiếp theo
                    </label>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <input 
                        type="number" 
                        step="500"
                        value={shippingConfig.pricePerKm} 
                        onChange={e => setShippingConfig(prev => ({ ...prev, pricePerKm: Math.max(0, Number(e.target.value)) }))}
                        className="w-full bg-transparent text-sm font-black text-amber-600 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-500 shrink-0">đ/km</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">Cộng dồn các km sau đó (VD: 5k/km)</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-sky-300 transition">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      5. Bán kính tối đa
                    </label>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <input 
                        type="number" 
                        min="5"
                        value={shippingConfig.maxDistanceKm} 
                        onChange={e => setShippingConfig(prev => ({ ...prev, maxDistanceKm: Math.max(1, Number(e.target.value)) }))}
                        className="w-full bg-transparent text-sm font-black text-slate-700 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-500 shrink-0">km</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">Cảnh báo nếu khách quá xa</p>
                  </div>
                </div>

                {/* THẺ GIẢI THÍCH CÔNG THỨC & VÍ DỤ TRỰC QUAN KHỚP VỚI SỐ LIỆU */}
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50/40 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
                    <FiInfo className="shrink-0 text-amber-600" size={17} />
                    <span>Minh họa cách tính cước thực tế từ Quán:</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-slate-700">
                    <div className="bg-white/80 p-3 rounded-xl border border-amber-100">
                      <p className="font-bold text-slate-800 mb-1">
                        📍 Đơn trong bán kính cơ sở (&le; {shippingConfig.baseDistanceKm} km):
                      </p>
                      <p className="text-slate-600">
                        {shippingConfig.baseFee === 0 ? (
                          <span className="text-emerald-700 font-bold">🎉 Miễn phí giao hàng (0đ) cho khách trong {shippingConfig.baseDistanceKm}km đầu.</span>
                        ) : (
                          <span>Cước cơ sở trọn gói = <strong className="text-sky-600 font-bold">{shippingConfig.baseFee?.toLocaleString('vi-VN')}đ</strong>.</span>
                        )}
                      </p>
                    </div>

                    <div className="bg-white/80 p-3 rounded-xl border border-amber-100">
                      <p className="font-bold text-slate-800 mb-1">
                        📍 Đơn giao xa hơn (&gt; {shippingConfig.baseDistanceKm} km - Ví dụ 5 km):
                      </p>
                      <p className="text-slate-600">
                        {shippingConfig.baseFee === 0 ? (
                          <span>
                            Vừa vượt {shippingConfig.baseDistanceKm}km: bắt đầu là <strong>{(shippingConfig.startFeeAfterBase ?? 10000).toLocaleString('vi-VN')}đ</strong> (cho km {shippingConfig.baseDistanceKm}-{shippingConfig.baseDistanceKm + 1}) + thêm 1km &times; {shippingConfig.pricePerKm?.toLocaleString('vi-VN')}đ = <strong className="text-amber-700 font-bold">{((shippingConfig.startFeeAfterBase ?? 10000) + Math.max(0, 5 - (shippingConfig.baseDistanceKm + 1)) * shippingConfig.pricePerKm).toLocaleString('vi-VN')}đ</strong>.
                          </span>
                        ) : (
                          <span>
                            {shippingConfig.baseFee?.toLocaleString('vi-VN')}đ + ({5 - shippingConfig.baseDistanceKm}km &times; {shippingConfig.pricePerKm?.toLocaleString('vi-VN')}đ) = <strong className="text-amber-700 font-bold">{(shippingConfig.baseFee + (5 - shippingConfig.baseDistanceKm) * shippingConfig.pricePerKm).toLocaleString('vi-VN')}đ</strong>.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: KHU VỰC HOẠT ĐỘNG */}
              <div>
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Khu Vực Hoạt Động (Giao hàng)</h2>
                  <button onClick={handleAddArea} className="text-sky-500 text-sm font-bold flex items-center gap-1 hover:text-sky-600"><FiPlus /> Thêm khu vực</button>
                </div>
                <div className="space-y-3">
                  {operationalAreas.map((area, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <input type="text" value={area} onChange={e => handleUpdateArea(index, e.target.value)} placeholder="VD: Hà Nội, TP. Hồ Chí Minh..." className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500 outline-none" />
                      <button onClick={() => handleRemoveArea(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 size={20} /></button>
                    </div>
                  ))}
                  {operationalAreas.length === 0 && <p className="text-sm text-gray-500 italic">Chưa có khu vực nào. Hãy thêm khu vực.</p>}
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
