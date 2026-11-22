import React, { useState, useEffect, useMemo } from 'react';
import axios, { getImageUrl } from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { 
  FiZap, FiSearch, FiCheck, FiTrash2, FiPlus, FiSave, 
  FiLayers, FiHelpCircle, FiChevronRight, FiAlertCircle 
} from 'react-icons/fi';

const AdminUpsell = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bộ lọc cột trái
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Món chính đang được chọn để cấu hình gợi ý bán kèm
  const [activeProduct, setActiveProduct] = useState(null);

  // Danh sách các ID món gợi ý đang chỉnh sửa của activeProduct
  const [currentUpsellIds, setCurrentUpsellIds] = useState([]);

  // Tìm kiếm món để thêm vào gợi ý (cột phải)
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateCategory, setCandidateCategory] = useState('ALL');

  // Helper trích xuất ID chuỗi nhất quán
  const extractId = (p) => {
    if (!p) return null;
    if (typeof p === 'string') return p;
    if (typeof p === 'object') return (p._id || p).toString();
    return String(p);
  };

  // Tải danh mục và sản phẩm
  const fetchData = async () => {
    try {
      setLoading(true);
      const [catsRes, prodsRes] = await Promise.all([
        axios.get('/categories'),
        axios.get('/products?limit=100') // Lấy toàn bộ món
      ]);
      setCategories(catsRes.data || []);
      const allProds = prodsRes.data?.products || [];
      setProducts(allProds);

      // Mặc định chọn món đầu tiên nếu có
      if (allProds.length > 0 && !activeProduct) {
        setActiveProduct(allProds[0]);
        setCurrentUpsellIds(
          (allProds[0].upsellProducts || []).map(extractId).filter(Boolean)
        );
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu Upsell:', error);
      toast.error('Không thể tải danh sách sản phẩm!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Khi chọn một món chính khác ở cột trái
  const handleSelectProduct = (product) => {
    setActiveProduct(product);
    setCurrentUpsellIds(
      (product.upsellProducts || []).map(extractId).filter(Boolean)
    );
  };

  // Thêm một món vào danh sách gợi ý
  const handleAddUpsell = (productId) => {
    const idStr = String(productId);
    if (!currentUpsellIds.includes(idStr)) {
      setCurrentUpsellIds(prev => [...prev, idStr]);
    }
  };

  // Xóa một món khỏi danh sách gợi ý
  const handleRemoveUpsell = (productId) => {
    const idStr = String(productId);
    setCurrentUpsellIds(prev => prev.filter(id => String(id) !== idStr));
  };

  // Lưu cấu hình gợi ý bán kèm cho món chính
  const handleSaveUpsells = async () => {
    if (!activeProduct) return;
    setSaving(true);
    try {
      const res = await axios.put(`/products/${activeProduct._id}/upsell`, {
        upsellProductIds: currentUpsellIds
      });

      toast.success(`Đã cập nhật gợi ý bán kèm cho món "${activeProduct.name}"!`);

      const savedUpsellList = res.data.product?.upsellProducts || currentUpsellIds;

      // Cập nhật lại trong danh sách local
      setProducts(prev => prev.map(p => {
        if (String(p._id) === String(activeProduct._id)) {
          return {
            ...p,
            upsellProducts: savedUpsellList
          };
        }
        return p;
      }));

      // Cập nhật activeProduct
      setActiveProduct(prev => ({
        ...prev,
        upsellProducts: savedUpsellList
      }));
    } catch (error) {
      console.error('Lỗi lưu upsell:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi lưu gợi ý bán kèm!');
    } finally {
      setSaving(false);
    }
  };

  // Lọc danh sách món chính cột trái
  const filteredMainProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const catId = String(p.category?._id || p.category || '');
      const matchesCat = selectedCategory === 'ALL' || catId === String(selectedCategory);
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Các đối tượng món ăn đầy đủ trong danh sách gợi ý hiện tại
  const selectedUpsellProducts = useMemo(() => {
    const idSet = new Set(currentUpsellIds.map(id => String(id)));
    return products.filter(p => idSet.has(String(p._id)));
  }, [products, currentUpsellIds]);

  // Danh sách các ứng viên món ăn có thể thêm làm gợi ý (loại trừ chính nó và các món đã chọn)
  const candidateProducts = useMemo(() => {
    if (!activeProduct) return [];
    const excludedSet = new Set([
      String(activeProduct._id), 
      ...currentUpsellIds.map(id => String(id))
    ]);

    return products.filter(p => {
      if (excludedSet.has(String(p._id))) return false;
      const matchesSearch = p.name.toLowerCase().includes(candidateSearch.toLowerCase());
      const catId = String(p.category?._id || p.category || '');
      const matchesCat = candidateCategory === 'ALL' || catId === String(candidateCategory);
      return matchesSearch && matchesCat;
    });
  }, [products, activeProduct, currentUpsellIds, candidateSearch, candidateCategory]);

  // Thống kê nhanh
  const configuredCount = useMemo(() => {
    return products.filter(p => Array.isArray(p.upsellProducts) && p.upsellProducts.length > 0).length;
  }, [products]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-semibold animate-pulse">
        Đang tải dữ liệu cấu hình gợi ý bán kèm...
      </div>
    );
  }

  return (
    <div className="font-sans container mx-auto px-4 py-6 max-w-7xl">
      {/* HEADER TRANG */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-sky-100 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-2.5">
            <span className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <FiZap className="w-6 h-6" />
            </span>
            <span>SMART UPSELLING - GỢI Ý BÁN KÈM TẠI GIỎ HÀNG</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Gán các món ăn kèm (khoai tây, xúc xích) hoặc nước ngọt để hiển thị trực tiếp tại Giỏ hàng của khách.
          </p>
        </div>

        {/* THẺ THỐNG KÊ NHANH */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-center shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tổng thực đơn</span>
            <span className="font-black text-slate-800 text-base">{products.length} món</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-center shadow-xs">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Đã có gợi ý</span>
            <span className="font-black text-emerald-700 text-base">{configuredCount} món</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-center shadow-xs">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Chưa gán</span>
            <span className="font-black text-amber-700 text-base">{products.length - configuredCount} món</span>
          </div>
        </div>
      </div>

      {/* KHÔNG GIAN LÀM VIỆC 2 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= CỘT TRÁI: DANH SÁCH MÓN CHÍNH (5 CỘT) ================= */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="mb-3">
            <h2 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center justify-between mb-2">
              <span>1. Chọn Món Chính Để Cài Đặt</span>
              <span className="text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full font-bold">
                {filteredMainProducts.length} món
              </span>
            </h2>

            {/* Ô tìm kiếm */}
            <div className="relative mb-2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm món chính theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-100 transition"
              />
            </div>

            {/* Lọc danh mục */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            >
              <option value="ALL">-- Tất cả danh mục --</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Danh sách cuộn các món chính */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredMainProducts.map(p => {
              const isSelected = activeProduct?._id === p._id;
              const upsellCount = Array.isArray(p.upsellProducts) ? p.upsellProducts.length : 0;
              return (
                <div
                  key={p._id}
                  onClick={() => handleSelectProduct(p)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-sky-500 bg-sky-50/70 shadow-xs' 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-xs sm:text-sm truncate ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>
                      {p.name}
                    </h3>
                    <p className="text-[11px] font-black text-sky-600 mt-0.5">
                      {(p.price || 0).toLocaleString('vi-VN')}đ
                    </p>
                  </div>

                  {/* Badge trạng thái đã gán gợi ý chưa */}
                  <div className="shrink-0 text-right">
                    {upsellCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                        <FiZap size={10} /> {upsellCount} món kèm
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400">
                        Chưa gán
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= CỘT PHẢI: BẢNG THIẾT LẬP MÓN BÁN KÈM (7 CỘT) ================= */}
        <div className="lg:col-span-7 space-y-5">
          {activeProduct ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              
              {/* THẺ MÓN CHÍNH ĐANG CẤU HÌNH */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-sky-50/70 to-slate-50 border border-sky-100 mb-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl bg-white overflow-hidden shrink-0 border border-sky-200 shadow-xs">
                    <img src={getImageUrl(activeProduct.image)} alt={activeProduct.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 bg-sky-100/70 px-2 py-0.5 rounded-md">
                      Món chính đang chọn
                    </span>
                    <h3 className="font-black text-slate-800 text-base sm:text-lg mt-0.5">
                      {activeProduct.name}
                    </h3>
                    <p className="text-xs font-bold text-slate-500">
                      Giá gốc: <span className="text-sky-600">{(activeProduct.price || 0).toLocaleString('vi-VN')}đ</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveUpsells}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
                >
                  <FiSave className="w-4 h-4" />
                  <span>{saving ? 'Đang lưu...' : 'LƯU GỢI Ý'}</span>
                </button>
              </div>

              {/* PHẦN 1: CÁC MÓN GỢI Ý HIỆN TẠI */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <span>Món Gợi Ý Bán Kèm Hiện Tại</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      {selectedUpsellProducts.length} món
                    </span>
                  </h4>
                  <span className="text-[11px] text-slate-400 italic">
                    (Khách mua món này sẽ được gợi ý các món dưới đây)
                  </span>
                </div>

                {selectedUpsellProducts.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <FiAlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">Chưa có món bán kèm nào được gán!</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Hãy chọn các món phụ (nước ngọt, khoai tây chiên...) ở danh sách bên dưới để thêm vào.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedUpsellProducts.map(p => (
                      <div key={p._id} className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/30 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={getImageUrl(p.image)} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                            <p className="text-[11px] font-black text-emerald-600">{(p.price || 0).toLocaleString('vi-VN')}đ</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveUpsell(p._id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition cursor-pointer shrink-0"
                          title="Gỡ khỏi gợi ý"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PHẦN 2: CHỌN MÓN ĐỂ THÊM VÀO GỢI Ý */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <span>Thêm Món Bán Kèm Khác</span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {candidateProducts.length} món khả dụng
                    </span>
                  </h4>
                </div>

                {/* Bộ lọc ứng viên */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Tìm món ăn kèm / nước uống..."
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-sky-500"
                    />
                  </div>
                  <select
                    value={candidateCategory}
                    onChange={(e) => setCandidateCategory(e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
                  >
                    <option value="ALL">-- Tất cả danh mục --</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Danh sách các món ứng viên */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {candidateProducts.map(p => (
                    <div key={p._id} className="flex items-center justify-between p-2 rounded-xl border border-slate-100 hover:border-sky-200 bg-slate-50/50 hover:bg-white transition shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={getImageUrl(p.image)} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{p.name}</p>
                          <p className="text-[11px] font-black text-sky-600">{(p.price || 0).toLocaleString('vi-VN')}đ</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddUpsell(p._id)}
                        className="px-2.5 py-1 bg-white hover:bg-sky-500 text-sky-600 hover:text-white border border-sky-200 hover:border-sky-500 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <FiPlus size={12} /> Thêm
                      </button>
                    </div>
                  ))}
                  {candidateProducts.length === 0 && (
                    <p className="col-span-2 text-center text-xs text-slate-400 py-6 italic">
                      Không tìm thấy món ăn phù hợp để thêm.
                    </p>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              Vui lòng chọn một món ăn ở cột bên trái để bắt đầu cấu hình.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminUpsell;
