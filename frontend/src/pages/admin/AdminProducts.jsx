import React, { useState, useEffect, useRef } from 'react';
import axios, { SERVER_URL , getImageUrl } from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { FaMapPin, FaPlus, FaTrash } from 'react-icons/fa';

const Admin = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]); // State để lưu danh sách danh mục

  // State cho chế độ sửa
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  // State cho Form thêm món mới
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '', // Sẽ được cập nhật khi danh mục được tải
  });
  const [sizes, setSizes] = useState([]); // Mảng kích cỡ [{ name: '', priceOffset: 0 }]
  const [toppings, setToppings] = useState([]); // Mảng topping [{ name: '', price: 0 }]
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // State để xem trước ảnh
  const formRef = useRef(null); // Ref để cuộn tới form

  // State cho phân trang sản phẩm
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  // Lấy danh sách món ăn từ Backend
  const fetchProducts = async () => {
    try {
      // Gửi yêu cầu lấy sản phẩm theo trang
      const response = await axios.get(`/products?page=${pagination.currentPage}`);
      const { products, totalPages, currentPage } = response.data;
      setProducts(products);
      setPagination({ currentPage, totalPages });
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [pagination.currentPage]); // Gọi lại mỗi khi trang thay đổi

  // Lấy danh sách danh mục từ Backend khi component được mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/categories');
        setCategories(data);
      } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
        toast.error('Không thể tải danh mục!');
      }
    };
    fetchCategories();
  }, []); // Chạy 1 lần khi component mount

  // Xử lý khi chọn file ảnh
  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
    // Tạo URL xem trước cho ảnh được chọn
    if (e.target.files[0]) {
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    } else {
      setImagePreview(null);
    }
  };

  // Các hàm quản lý Kích cỡ (Sizes)
  const handleAddSize = () => {
    setSizes(prev => [...prev, { name: '', priceOffset: 0 }]);
  };
  const handleRemoveSize = (index) => {
    setSizes(prev => prev.filter((_, i) => i !== index));
  };
  const handleSizeChange = (index, field, value) => {
    setSizes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Các hàm quản lý Topping
  const handleAddTopping = () => {
    setToppings(prev => [...prev, { name: '', price: 0 }]);
  };
  const handleRemoveTopping = (index) => {
    setToppings(prev => prev.filter((_, i) => i !== index));
  };
  const handleToppingChange = (index, field, value) => {
    setToppings(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Xử lý submit thêm món ăn
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vì có upload file ảnh, ta phải dùng FormData thay vì JSON thông thường
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('price', formData.price);
    submitData.append('description', formData.description);
    submitData.append('category', formData.category);

    // Gửi kèm Sizes và Toppings dạng JSON
    const cleanSizes = sizes
      .filter(s => s.name && s.name.trim())
      .map(s => ({ name: s.name.trim(), priceOffset: Number(s.priceOffset) || 0 }));
    const cleanToppings = toppings
      .filter(t => t.name && t.name.trim())
      .map(t => ({ name: t.name.trim(), price: Number(t.price) || 0 }));
    submitData.append('sizes', JSON.stringify(cleanSizes));
    submitData.append('toppings', JSON.stringify(cleanToppings));

    // Chỉ thêm ảnh vào FormData nếu người dùng đã chọn file ảnh mới
    if (imageFile) {
      submitData.append('image', imageFile);
    }

    setLoading(true);
    try {
      if (isEditMode) {
        // ================= LOGIC SỬA SẢN PHẨM =================
        await axios.put(`/products/${editingProductId}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Cập nhật món ăn thành công!');
      } else {
        // ================= LOGIC THÊM SẢN PHẨM =================
        if (!imageFile) {
          toast.error('Vui lòng chọn một hình ảnh cho món ăn!');
          setLoading(false);
          return;
        }
        await axios.post('/products', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Thêm món ăn thành công!');
      }
      resetForm(); // Reset form và thoát chế độ sửa
      fetchProducts(); // Tải lại danh sách
    } catch (error) {
      toast.error(error.response?.data?.message || (isEditMode ? 'Lỗi khi cập nhật món ăn!' : 'Lỗi khi thêm món ăn!'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm reset form về trạng thái ban đầu
  const resetForm = () => {
    setIsEditMode(false);
    setEditingProductId(null);
    setFormData({
      name: '',
      price: '',
      description: '',
      category: '' // Luôn reset về giá trị rỗng để hiển thị placeholder
    });
    setSizes([]);
    setToppings([]);
    setImageFile(null);
    setImagePreview(null);
    if (formRef.current) {
      formRef.current.reset(); // Reset input file
    }
  };

  // ================= HÀM XÓA MÓN ĂN =================
  const handleDelete = async (productId) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa món ăn này vĩnh viễn không?');
    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`/products/${productId}`);
      toast.success('Xóa món ăn thành công!');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa món ăn!');
      console.error('Lỗi xóa sản phẩm:', error);
    }
  };

  // ================= HÀM KHI BẤM NÚT "SỬA" =================
  const handleEditClick = (product) => {
    setIsEditMode(true);
    setEditingProductId(product._id);
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category?._id || '', // Lấy ID của danh mục
    });
    setSizes(Array.isArray(product.sizes) ? product.sizes.map(s => ({ name: s.name, priceOffset: s.priceOffset || 0 })) : []);
    setToppings(Array.isArray(product.toppings) ? product.toppings.map(t => ({ name: t.name, price: t.price || 0 })) : []);
    setImageFile(null); // Reset file đang chọn
    setImagePreview(`${getImageUrl(product.image)}`); // Hiển thị ảnh hiện tại của sản phẩm
    // Cuộn lên đầu form để người dùng thấy
    window.scrollTo({ top: formRef.current.offsetTop - 100, behavior: 'smooth' });
  };

  // ================= HÀM GHIM/BỎ GHIM MÓN ĂN =================
  const handlePin = async (productId, isPinned) => {
    try {
      // Cập nhật giao diện ngay lập tức
      setProducts(products.map(p => 
        p._id === productId ? { ...p, isPinned: !isPinned } : p
      ));

      await axios.put(`/products/${productId}/pin`);
      
      toast.success(`Đã ${!isPinned ? 'ghim' : 'bỏ ghim'} món ăn!`);
      // Không cần fetch lại vì đã cập nhật UI trước
    } catch (error) {
      // Nếu lỗi, revert lại thay đổi trên UI
      setProducts(products.map(p => 
        p._id === productId ? { ...p, isPinned: isPinned } : p
      ));
      toast.error('Lỗi khi ghim món ăn!');
      console.error('Lỗi ghim sản phẩm:', error);
    }
  };

  // ================= HÀM CHUYỂN TRANG =================
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  }
  return (
    <div className="font-sans container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-black text-sky-500 mb-8 border-b border-sky-100 pb-4">
        ⚙️ BẢNG ĐIỀU KHIỂN QUẢN TRỊ (ADMIN)
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* ================= CỘT TRÁI: FORM THÊM MÓN ĂN ================= */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50 sticky top-24">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {isEditMode ? '✍️ Chỉnh Sửa Món Ăn' : '➕ Thêm Món Ăn Mới'}
              </h2>
              {isEditMode && (
                <button onClick={resetForm} className="text-sm font-bold text-gray-500 hover:text-red-500">Hủy</button>
              )}
            </div>
            
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" id="product-form">
              <div>
                <label className="block text-gray-600 font-semibold mb-2 text-sm">Tên món ăn *</label>
                <input type="text" required placeholder="VD: Burger Bò Phô Mai..." 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-2 text-sm">Giá tiền (VNĐ) *</label>
                <input type="number" required placeholder="VD: 45000" min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-2 text-sm">Danh mục *</label>
                <select required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="" disabled>-- Chọn một danh mục --</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-2 text-sm">Mô tả ngắn</label>
                <textarea rows="3" placeholder="Mô tả thành phần món ăn..." 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
                ></textarea>
              </div>

              {/* --- CẤU HÌNH KÍCH THƯỚC (SIZES) --- */}
              <div className="border border-sky-100 rounded-xl p-3 bg-sky-50/30">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-700 font-bold text-xs uppercase tracking-wider">
                    📏 Kích cỡ món ăn ({sizes.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSize}
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 bg-white border border-sky-200 px-2 py-1 rounded-lg hover:bg-sky-50 transition shadow-xs"
                  >
                    <FaPlus size={10} /> Thêm size
                  </button>
                </div>
                {sizes.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">Chưa có size tùy chọn (Mặc định 1 size).</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {sizes.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-gray-200 text-xs">
                        <input
                          type="text"
                          placeholder="Tên size (VD: Lớn)"
                          value={s.name}
                          onChange={(e) => handleSizeChange(idx, 'name', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-200 rounded outline-none focus:border-sky-500"
                        />
                        <input
                          type="number"
                          placeholder="+ Giá (VNĐ)"
                          value={s.priceOffset}
                          onChange={(e) => handleSizeChange(idx, 'priceOffset', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-200 rounded outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition"
                          title="Xóa size"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* --- CẤU HÌNH TOPPING BÁN KÈM --- */}
              <div className="border border-emerald-100 rounded-xl p-3 bg-emerald-50/30">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-700 font-bold text-xs uppercase tracking-wider">
                    🧀 Topping bán kèm ({toppings.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTopping}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-white border border-emerald-200 px-2 py-1 rounded-lg hover:bg-emerald-50 transition shadow-xs"
                  >
                    <FaPlus size={10} /> Thêm topping
                  </button>
                </div>
                {toppings.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">Chưa có topping đi kèm.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {toppings.map((t, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-gray-200 text-xs">
                        <input
                          type="text"
                          placeholder="Tên topping (VD: Phô mai)"
                          value={t.name}
                          onChange={(e) => handleToppingChange(idx, 'name', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-200 rounded outline-none focus:border-emerald-500"
                        />
                        <input
                          type="number"
                          placeholder="Giá (VNĐ)"
                          value={t.price}
                          onChange={(e) => handleToppingChange(idx, 'price', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-200 rounded outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTopping(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition"
                          title="Xóa topping"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-2 text-sm">Hình ảnh minh họa *</label>
                {/* Hiển thị ảnh preview */}
                {imagePreview && (
                  <div className="mb-2">
                    <img src={imagePreview} alt="Xem trước" className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                  </div>
                )}
                <input type="file" required={!isEditMode} accept="image/*"
                  onChange={handleFileChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                />
                {isEditMode && <p className="text-xs text-gray-400 mt-1">Để trống nếu không muốn thay đổi ảnh.</p>}
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl transition duration-300 mt-4 disabled:bg-gray-400 shadow-md"
              >
                {loading ? 'Đang lưu...' 
                  : isEditMode ? '💾 LƯU THAY ĐỔI' : '➕ TẠO MÓN ĂN'}
              </button>
            </form>
          </div>
        </div>

        {/* ================= CỘT PHẢI: DANH SÁCH MÓN ĂN ================= */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex justify-between items-center">
              <span>Danh Sách Thực Đơn</span>
              <span className="text-sm bg-sky-100 text-sky-600 py-1 px-3 rounded-full">{products.length} món</span>
            </h2>

            {products.length === 0 ? (
              <p className="text-gray-500 text-center py-10">Chưa có dữ liệu. Hãy thêm món ăn đầu tiên của bạn!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map(product => (
                  <div key={product._id} className="relative flex gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-md transition bg-gray-50">
                    {/* NÚT GHIM MÓN ĂN */}
                    <button 
                      onClick={() => handlePin(product._id, product.isPinned)}
                      className={`absolute top-2 right-2 p-2 rounded-full transition-colors
                        ${product.isPinned ? 'text-yellow-400 bg-yellow-100' : 'text-gray-400 hover:bg-gray-200'}`}
                        title={product.isPinned ? 'Bỏ ghim khỏi trang chủ' : 'Ghim lên trang chủ'}
                    >
                      <FaMapPin size={16} />
                    </button>
                    <div className="w-24 h-24 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                      <img src={`${getImageUrl(product.image)}`} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center flex-1 min-w-0">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{product.category?.name || 'Chưa phân loại'}</p>
                      <h3 className="font-bold text-gray-800 line-clamp-1 pr-8 mt-1">{product.name}</h3>
                      <p className="text-sky-500 font-black mt-1">
                        {(product.price || 0).toLocaleString('vi-VN')}đ
                      </p>
                      {/* Hiển thị badge số lượng Size và Topping */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.sizes?.length > 0 && (
                          <span className="text-[10px] font-bold bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">
                            {product.sizes.length} size
                          </span>
                        )}
                        {product.toppings?.length > 0 && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                            {product.toppings.length} topping
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <button onClick={() => handleEditClick(product)} className="text-sky-500 text-sm font-semibold hover:text-sky-700 w-fit">Sửa</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => handleDelete(product._id)} className="text-red-400 text-sm font-semibold hover:text-red-600 w-fit">Xóa</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* === KHU VỰC PHÂN TRANG SẢN PHẨM === */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 pt-4 flex justify-between items-center border-t border-gray-100">
                <button 
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trang trước
                </button>
                <span className="text-sm font-bold text-gray-600">
                  Trang {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button 
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Admin;