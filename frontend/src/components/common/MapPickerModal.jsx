import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiSearch, FiMapPin, FiNavigation, FiCheck, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getCurrentCoordinates, reverseGeocodeOSM } from '../../utils/geolocation';

/**
 * Modal Bản đồ tương tác chọn vị trí giao hàng (OpenStreetMap + Leaflet)
 * Hỗ trợ: Chấm điểm trên bản đồ, kéo ghim, tìm kiếm địa chỉ, lấy GPS thiết bị
 */
const MapPickerModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onSelectLocation,
  initialLocation = null, 
  storeLocation = null 
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const storeMarkerRef = useRef(null);

  const [currentCoords, setCurrentCoords] = useState(
    initialLocation?.lat && initialLocation?.lng
      ? { lat: Number(initialLocation.lat), lng: Number(initialLocation.lng) }
      : (storeLocation?.lat && storeLocation?.lng
          ? { lat: Number(storeLocation.lat), lng: Number(storeLocation.lng) }
          : { lat: 10.776889, lng: 106.700806 }) // TP. HCM mặc định
  );

  const [addressPreview, setAddressPreview] = useState(initialLocation?.address || '');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Tìm kiếm địa chỉ
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 1. Tải tài nguyên Leaflet CSS & JS dynamically để đảm bảo tương thích tuyệt đối
  useEffect(() => {
    if (!isOpen) return;

    // Cập nhật lại tọa độ nếu modal mở lại với initialLocation mới
    if (initialLocation?.lat && initialLocation?.lng) {
      setCurrentCoords({
        lat: Number(initialLocation.lat),
        lng: Number(initialLocation.lng)
      });
      if (initialLocation.address) {
        setAddressPreview(initialLocation.address);
      }
    }

    const loadLeaflet = async () => {
      // Nạp CSS Leaflet nếu chưa có
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Nạp Leaflet JS nếu window.L chưa tồn tại
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.id = 'leaflet-js';
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      initMap();
    };

    loadLeaflet().catch(err => {
      console.error('Không thể tải Leaflet:', err);
      toast.error('Không thể tải bản đồ. Vui lòng thử lại sau.');
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // 2. Khởi tạo bản đồ
  const initMap = () => {
    if (!mapContainerRef.current || !window.L) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const L = window.L;
    const center = [currentCoords.lat, currentCoords.lng];

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: 16,
      zoomControl: false
    });

    // Thêm nút zoom ở góc phải
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layer bản đồ OpenStreetMap chuẩn
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Icon Ghim vị trí của Khách hàng (Màu xanh neon đẹp mắt)
    const customerIcon = L.divIcon({
      className: 'custom-customer-marker',
      html: `
        <div style="
          width: 38px; 
          height: 38px; 
          background: #0284c7; 
          border: 3px solid white; 
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg); 
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 12px; 
            height: 12px; 
            background: white; 
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38]
    });

    // Tạo Marker cho Khách hàng
    const marker = L.marker(center, { 
      icon: customerIcon, 
      draggable: true 
    }).addTo(map);

    // Sự kiện kéo thả ghim
    marker.on('dragend', async () => {
      const pos = marker.getLatLng();
      updateSelectedLocation(pos.lat, pos.lng);
    });

    // Sự kiện bấm vào bất kỳ đâu trên bản đồ để đặt ghim
    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      updateSelectedLocation(e.latlng.lat, e.latlng.lng);
    });

    // Nếu có tọa độ Quán ăn, vẽ thêm Marker của Quán để khách dễ hình dung
    if (storeLocation?.lat && storeLocation?.lng) {
      const storeIcon = L.divIcon({
        className: 'custom-store-marker',
        html: `
          <div style="
            padding: 4px 8px;
            background: #ef4444;
            color: white;
            font-size: 11px;
            font-weight: 800;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            white-space: nowrap;
            border: 2px solid white;
          ">
            🏪 Quán DualeoFood
          </div>
        `,
        iconSize: [110, 30],
        iconAnchor: [55, 30]
      });

      L.marker([storeLocation.lat, storeLocation.lng], { icon: storeIcon })
        .addTo(map)
        .bindPopup(`<b>${storeLocation.address || 'Quán DualeoFood'}</b>`);
    }

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Đảm bảo map render đủ kích thước khi modal mở
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    // Dịch địa chỉ lần đầu nếu chưa có text
    if (!addressPreview) {
      updateSelectedLocation(currentCoords.lat, currentCoords.lng);
    }
  };

  // Cập nhật vị trí và dịch ngược địa chỉ
  const updateSelectedLocation = async (lat, lng) => {
    const cleanLat = Number(lat.toFixed(6));
    const cleanLng = Number(lng.toFixed(6));
    setCurrentCoords({ lat: cleanLat, lng: cleanLng });

    setIsGeocoding(true);
    try {
      const address = await reverseGeocodeOSM(cleanLat, cleanLng);
      if (address) {
        setAddressPreview(address);
      }
    } catch (e) {
      console.warn('Lỗi reverse geocode:', e);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Lấy GPS hiện tại của thiết bị
  const handleGetDeviceGPS = async () => {
    setIsLocating(true);
    try {
      const coords = await getCurrentCoordinates();
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.flyTo([coords.lat, coords.lng], 17, { duration: 1.2 });
        markerRef.current.setLatLng([coords.lat, coords.lng]);
        updateSelectedLocation(coords.lat, coords.lng);
      }
      toast.success('Đã định vị vị trí của bạn!');
    } catch (err) {
      toast.error(err.message || 'Không thể lấy GPS của thiết bị.');
    } finally {
      setIsLocating(false);
    }
  };

  // Tìm kiếm địa chỉ qua OpenStreetMap Nominatim
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery.trim())}&format=json&countrycodes=vn&limit=5&accept-language=vi`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data || []);
        if (data.length === 0) {
          toast.error('Không tìm thấy địa điểm này. Vui lòng nhập chi tiết hơn!');
        }
      }
    } catch (err) {
      toast.error('Lỗi kết nối khi tìm kiếm địa chỉ.');
    } finally {
      setIsSearching(false);
    }
  };

  // Chọn 1 kết quả từ danh sách tìm kiếm
  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
      markerRef.current.setLatLng([lat, lng]);
      setAddressPreview(result.display_name);
      setCurrentCoords({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  // Xác nhận vị trí: Hỗ trợ linh hoạt cả onSelectLocation lẫn onConfirm
  const handleConfirm = () => {
    if (!currentCoords.lat || !currentCoords.lng) {
      toast.error('Vui lòng chọn vị trí trên bản đồ!');
      return;
    }

    const finalAddress = addressPreview?.trim() || `Vị trí GPS (${currentCoords.lat}, ${currentCoords.lng})`;
    const callback = onSelectLocation || onConfirm;

    if (typeof callback === 'function') {
      callback({
        lat: currentCoords.lat,
        lng: currentCoords.lng,
        address: finalAddress
      });
      toast.success('Đã lưu vị trí giao hàng!');
    } else {
      console.warn('MapPickerModal: Không tìm thấy callback onSelectLocation hoặc onConfirm.');
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl h-[90vh] max-h-[700px] flex flex-col overflow-hidden animate-scale-up border border-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="p-1.5 bg-sky-100 text-sky-600 rounded-lg"><FiMapPin size={18} /></span>
              Chọn Vị Trí Giao Hàng Trên Bản Đồ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chấm điểm hoặc kéo thả ghim màu xanh đến chính xác địa chỉ của bạn
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* THANH TÌM KIẾM ĐỊA CHỈ */}
        <div className="relative p-3 bg-slate-50 border-b border-slate-200/80 shrink-0">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm tên đường, phường/xã, địa danh (VD: Cầu Giấy, Bến Thành...)"
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isSearching ? <FiLoader className="animate-spin" /> : <FiSearch />}
              <span className="hidden sm:inline">Tìm kiếm</span>
            </button>
            <button
              type="button"
              onClick={handleGetDeviceGPS}
              disabled={isLocating}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              title="Lấy GPS vị trí hiện tại của thiết bị"
            >
              <FiNavigation className={isLocating ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Vị trí của tôi</span>
            </button>
          </form>

          {/* Gợi ý kết quả tìm kiếm */}
          {searchResults.length > 0 && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((res, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectSearchResult(res)}
                  className="p-3 text-xs text-slate-700 hover:bg-sky-50 cursor-pointer transition flex items-start gap-2"
                >
                  <FiMapPin className="text-sky-500 shrink-0 mt-0.5" size={14} />
                  <span>{res.display_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KHUNG BẢN ĐỒ LEAFLET */}
        <div className="relative flex-1 w-full bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />
        </div>

        {/* FOOTER: ĐỊA CHỈ ĐƯỢC CHỌN & NÚT XÁC NHẬN */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black uppercase text-sky-600 bg-sky-100/70 px-2 py-0.5 rounded">
                Điểm đã ghim
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentCoords.lat}, {currentCoords.lng}
              </span>
              {isGeocoding && <span className="text-xs text-slate-400 italic">(Đang nhận diện địa chỉ...)</span>}
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2" title={addressPreview}>
              {addressPreview || 'Đang xác định địa chỉ...'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-xs sm:text-sm shadow-md shadow-sky-500/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <FiCheck size={18} />
              <span>Xác nhận vị trí này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPickerModal;
