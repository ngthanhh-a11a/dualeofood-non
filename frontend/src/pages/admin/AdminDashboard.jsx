import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { FiCalendar, FiStar, FiMessageSquare, FiAward, FiDownload, FiX, FiCheckSquare, FiSquare } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale';
import axios from '../../utils/axiosConfig';
import { Link } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { SERVER_URL , getImageUrl } from '../../utils/axiosConfig';

// CSS cho DatePicker và đăng ký ngôn ngữ Tiếng Việt
import "react-datepicker/dist/react-datepicker.css";
import '../../styles/datepicker.css';
registerLocale('vi', vi);

const AdminDashboard = () => {
  // Mặc định là 30 ngày gần nhất
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(new Date());

  // const [timeFilter, setTimeFilter] = useState('month'); 
  const [chartType, setChartType] = useState('line'); 
  const socket = useSocket();

  // State cho việc xuất PDF
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [sectionsToExport, setSectionsToExport] = useState({
    summary: true,
    revenueChart: true,
    recentOrders: true,
    bestSelling: true,
    reviews: true,
  });

  const formattedStartDate = startDate.toISOString().split('T')[0];
  const formattedEndDate = endDate.toISOString().split('T')[0];

  const { data: dashboardStats, isLoading: loading, refetch: refetchDashboard } = useQuery({
    queryKey: ['dashboardStats', formattedStartDate, formattedEndDate],
    queryFn: async () => {
      const response = await axios.get(`/orders/stats/dashboard?startDate=${formattedStartDate}&endDate=${formattedEndDate}`);
      return response.data;
    },
    enabled: !!startDate && !!endDate
  });

  const stats = dashboardStats ? {
    totalRevenue: dashboardStats.totalRevenue,
    totalOrders: dashboardStats.totalOrders,
    couponsUsed: dashboardStats.couponsUsed
  } : { totalRevenue: 0, totalOrders: 0, couponsUsed: 0 };
  const revenueData = dashboardStats?.revenueData || [];
  const bestSellingProducts = dashboardStats?.bestSellingProducts || [];

  const { data: recentOrdersData, isLoading: isOrdersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['recentOrders'],
    queryFn: async () => {
      const response = await axios.get('/orders?page=1&limit=5');
      return response.data.orders;
    }
  });
  const recentOrders = recentOrdersData || [];

  const { data: reviewStatsData, isLoading: reviewLoading } = useQuery({
    queryKey: ['reviewStats'],
    queryFn: async () => {
      const response = await axios.get('/products/stats/reviews');
      return response.data;
    }
  });
  const reviewStats = reviewStatsData || null;

  // Lắng nghe sự kiện real-time từ server
  useEffect(() => {
    if (!socket) return;

    socket.on('dashboard_updated', () => {
      toast.success('Dữ liệu dashboard vừa được cập nhật!');
      refetchDashboard();
      refetchOrders();
    });

    // Dọn dẹp
    return () => {
      socket.off('dashboard_updated');
    };
  }, [socket, refetchDashboard, refetchOrders]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    const pdf = new jsPDF('p', 'mm', 'a4'); // A4 size, portrait, millimeters
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    let yPos = margin; // Current Y position on the PDF page

    // --- PDF Header ---
    // Để hiển thị tiếng Việt, cần font hỗ trợ. Tạm dùng font mặc định.
    // pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    // pdf.setFont('Roboto');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor('#0EA5E9'); // Sky-500 color
    pdf.text('BAO CAO KINH DOANH - DUALEOFOOD', pageWidth / 2, yPos + 5, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor('#334155'); // Slate-700
    const dateRange = `Tu ${startDate.toLocaleDateString('vi-VN')} den ${endDate.toLocaleDateString('vi-VN')}`;
    pdf.text(dateRange, pageWidth / 2, yPos + 12, { align: 'center' });
    yPos += 25;

    // Helper function to add a section
    const addSectionToPdf = async (elementId, title) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Add a title for the section in the PDF
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor('#334155');
        pdf.text(title, margin, yPos);
        yPos += 8;

        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        
        let pdfImgWidth = pageWidth - margin * 2;
        let pdfImgHeight = pdfImgWidth / ratio;

        // Check if it fits on the current page
        if (yPos + pdfImgHeight > pageHeight - margin) {
            pdf.addPage();
            yPos = margin;
        }

        pdf.addImage(imgData, 'PNG', margin, yPos, pdfImgWidth, pdfImgHeight);
        yPos += pdfImgHeight + 10; // Add some space after the image
    };

    // --- Export selected sections ---
    const exportQueue = [
        { id: 'summary-stats', title: '1. Thong Ke Tong Quan', enabled: sectionsToExport.summary },
        { id: 'revenue-chart', title: '2. Bieu Do Doanh Thu', enabled: sectionsToExport.revenueChart },
        { id: 'bestselling-products', title: '3. Top Mon An Ban Chay', enabled: sectionsToExport.bestSelling },
        { id: 'recent-orders', title: '4. Don Hang Gan Day', enabled: sectionsToExport.recentOrders },
        { id: 'review-stats', title: '5. Thong Ke Danh Gia', enabled: sectionsToExport.reviews },
    ];

    for (const section of exportQueue) {
        if (section.enabled) {
            await addSectionToPdf(section.id, section.title);
        }
    }
    
    // --- PDF Footer (Page numbers) ---
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor('#94a3b8'); // Slate-400
        const footerText = `Trang ${i} / ${pageCount} | Bao cao duoc tao ngay ${new Date().toLocaleDateString('vi-VN')}`;
        pdf.text(footerText, pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

    pdf.save(`BaoCao_DualeoFood_${new Date().toISOString().split('T')[0]}.pdf`);
    setIsExporting(false);
    setIsExportModalOpen(false);
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const toastId = toast.loading("Đang tổng hợp dữ liệu, vui lòng đợi...");

      // Lấy toàn bộ danh sách đơn hàng trong khoảng thời gian (cộng thêm 23:59:59 để bao gồm cả ngày cuối)
      const response = await axios.get(`/orders?limit=10000&startDate=${formattedStartDate}&endDate=${formattedEndDate}T23:59:59.999Z`);
      const allOrdersInRange = response.data.orders || [];

      // Khởi tạo Workbook bằng exceljs
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'DualeoFood';
      workbook.lastModifiedBy = 'Admin';
      workbook.created = new Date();

      // Hàm Helper để style Header (Màu nền xanh nhạt, chữ đậm)
      const styleHeader = (worksheet) => {
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FF000000' } };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9EAF7' } // Xanh dương nhạt (sky-100)
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      };

      // 1. Sheet Tổng Quan
      const wsOverview = workbook.addWorksheet('Tổng Quan');
      wsOverview.columns = [
        { header: 'Thời Gian Lọc', key: 'time', width: 30 },
        { header: 'Tổng Doanh Thu (VNĐ)', key: 'revenue', width: 25 },
        { header: 'Tổng Đơn Hàng', key: 'orders', width: 20 },
        { header: 'Lượt Khuyến Mãi Đã Dùng', key: 'coupons', width: 25 }
      ];
      wsOverview.addRow({
        time: `${new Date(startDate).toLocaleDateString('vi-VN')} - ${new Date(endDate).toLocaleDateString('vi-VN')}`,
        revenue: stats.totalRevenue,
        orders: stats.totalOrders,
        coupons: stats.couponsUsed
      });
      styleHeader(wsOverview);

      // 2. Sheet Doanh Thu
      if (revenueData && revenueData.length > 0) {
        const wsRevenue = workbook.addWorksheet('Doanh Thu');
        wsRevenue.columns = [
          { header: 'Ngày', key: 'date', width: 15 },
          { header: 'Tổng Doanh Thu (VNĐ)', key: 'revenue', width: 25 }
        ];
        revenueData.forEach(item => {
          wsRevenue.addRow({ date: item.name, revenue: item.doanhThu });
        });
        styleHeader(wsRevenue);
      }

      // 3. Sheet Đơn Hàng Chi Tiết
      if (allOrdersInRange.length > 0) {
        const wsOrders = workbook.addWorksheet('Chi Tiết Đơn Hàng');
        wsOrders.columns = [
          { header: 'Mã Đơn Hàng', key: 'id', width: 26 },
          { header: 'Ngày Đặt', key: 'date', width: 20 },
          { header: 'Khách Hàng', key: 'customer', width: 25 },
          { header: 'Số Điện Thoại', key: 'phone', width: 15 },
          { header: 'Tổng Tiền (VNĐ)', key: 'total', width: 15 },
          { header: 'Trạng Thái', key: 'status', width: 15 },
          { header: 'Thanh Toán', key: 'payment', width: 18 },
          { header: 'Địa Chỉ', key: 'address', width: 60 }
        ];

        allOrdersInRange.forEach(order => {
          let statusText = order.status;
          if (order.status === 'COMPLETED') statusText = 'Hoàn thành';
          else if (order.status === 'PENDING') statusText = 'Chờ duyệt';
          else if (order.status === 'CANCELLED') statusText = 'Đã hủy';

          const row = wsOrders.addRow({
            id: order._id.toString(),
            date: new Date(order.createdAt).toLocaleString('vi-VN'),
            customer: order.user ? order.user.name : (order.guestInfo ? order.guestInfo.name : 'Khách vãng lai'),
            phone: order.user ? order.user.phone : (order.guestInfo ? order.guestInfo.phone : ''),
            total: order.totalPrice,
            status: statusText,
            payment: order.paymentMethod === 'cod' ? 'Tiền mặt' : 'Chuyển khoản QR',
            address: order.deliveryAddress ? `${order.deliveryAddress.street}, ${order.deliveryAddress.ward}, ${order.deliveryAddress.district}, ${order.deliveryAddress.city}` : 'Không có'
          });

          // Tô màu chữ cho cột Trạng Thái
          const statusCell = row.getCell('status');
          if (order.status === 'COMPLETED') {
            statusCell.font = { color: { argb: 'FF16A34A' }, bold: true }; // Màu xanh lá (green-600)
          } else if (order.status === 'CANCELLED') {
            statusCell.font = { color: { argb: 'FFDC2626' }, bold: true }; // Màu đỏ (red-600)
          } else if (order.status === 'PENDING') {
            statusCell.font = { color: { argb: 'FFD97706' }, bold: true }; // Màu vàng cam (amber-600)
          }
        });
        styleHeader(wsOrders);
      }

      // Tạo Buffer và Tải file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `BaoCao_DualeoFood_${formattedStartDate}_${formattedEndDate}.xlsx`);

      toast.dismiss(toastId);
      toast.success("Xuất báo cáo Excel thành công!");
    } catch (error) {
      console.error("Lỗi khi xuất excel:", error);
      toast.error("Có lỗi xảy ra khi xuất Excel. Vui lòng thử lại!");
    } finally {
      setIsExporting(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  // --- LOGIC TỪ REVIEWSTATS.JSX ---
  const PIE_COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#8884d8'].reverse();

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      if (percent < 0.05) return null;
      return (
          <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="font-bold">
              {`${(percent * 100).toFixed(0)}%`}
          </text>
      );
  };
  // --- KẾT THÚC LOGIC TỪ REVIEWSTATS.JSX ---
  const statusConfig = {
    PENDING: { text: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' },
    COMPLETED: { text: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
    // Thêm các trạng thái khác nếu cần
  };
  return (
    <>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-800">Thống Kê Tổng Quan</h1>

        <div className="flex items-center gap-2">
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiCalendar className="text-gray-400" />
                </span>
                <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    maxDate={new Date()}
                    locale="vi"
                    dateFormat="dd/MM/yyyy"
                    className="w-full" // Class sẽ được kế thừa từ file css
                />
            </div>
            <span className="font-bold text-gray-400">-</span>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                    <FiCalendar className="text-gray-400" />
                </span>
                <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    maxDate={new Date()}
                    locale="vi"
                    dateFormat="dd/MM/yyyy"
                    className="w-full" // Class sẽ được kế thừa từ file css
                />
            </div>
            <button
                onClick={() => setIsExportModalOpen(true)}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 px-5 rounded-xl flex items-center shadow-md hover:shadow-lg transition-all"
            >
                <FiDownload className="mr-2" />
                Xuất PDF
            </button>
            <button
                onClick={handleExportExcel}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center shadow-md hover:shadow-lg transition-all"
            >
                <FiDownload className="mr-2" />
                Xuất Excel
            </button>
        </div>
      </div>

      {/* Các thẻ chỉ số đã được đưa về 0 */}
      <div id="summary-stats" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-sky-500">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Tổng Doanh Thu</p>
          <h3 className="text-3xl font-black text-slate-800 mt-2">{stats.totalRevenue.toLocaleString('vi-VN')}đ</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Tổng Đơn Hàng</p>
          <h3 className="text-3xl font-black text-slate-800 mt-2">{stats.totalOrders}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-orange-500">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Mã Giảm Giá Đã Dùng</p>
          <h3 className="text-3xl font-black text-slate-800 mt-2">{stats.couponsUsed}</h3>
        </div>
      </div>

      {/* Chia layout thành 2 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Biểu đồ */}
        <div id="revenue-chart" className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Biểu Đồ Doanh Thu</h2>
            
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setChartType('line')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${chartType === 'line' ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Biểu đồ Đường
              </button>
              <button 
                onClick={() => setChartType('pie')}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${chartType === 'pie' ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Biểu đồ Tròn
              </button>
            </div>
          </div>

          <div className="h-80 w-full bg-sky-50/50 rounded-xl border border-dashed border-gray-200 p-4">
            {/* Xử lý giao diện khi không có dữ liệu biểu đồ */}
            {loading ? (
              <div className="w-full h-full flex items-center justify-center"><p className="text-gray-400 font-semibold">Đang tải dữ liệu...</p></div>
            ) : revenueData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-400 font-semibold">Chưa có dữ liệu thống kê cho thời gian này.</p>
              </div>
            ) : chartType === 'line' ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                  <RechartsTooltip formatter={(value) => new Intl.NumberFormat('vi-VN').format(value) + 'đ'} />
                  <Legend />
                  <Line type="monotone" dataKey="doanhThu" name="Doanh Thu" stroke="#0EA5E9" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={revenueData} dataKey="doanhThu" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => new Intl.NumberFormat('vi-VN').format(value) + 'đ'} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Cột phải: Hoạt động gần đây */}
        <div id="recent-orders" className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Đơn Hàng Gần Đây</h2>
          <div className="space-y-4">
            {isOrdersLoading ? (
              <p className="text-gray-400 text-sm">Đang tải...</p>
            ) : recentOrders.length === 0 ? (
              <p className="text-gray-400 text-sm">Không có đơn hàng nào gần đây.</p>
            ) : (
              recentOrders.map(order => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-bold text-sm text-gray-800">{order.customerInfo?.name}</p>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-sky-600">{order.finalAmount.toLocaleString('vi-VN')}đ</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block ${statusConfig[order.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                      {statusConfig[order.status]?.text || order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link to="/admin/orders" className="mt-6 block w-full text-center bg-sky-50 text-sky-600 font-bold py-2 rounded-lg hover:bg-sky-100 transition">
            Xem tất cả đơn hàng
          </Link>
        </div>
      </div>

      {/* === PHẦN BIỂU ĐỒ MÓN ĂN BÁN CHẠY === */}
      <div id="bestselling-products" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Top 5 Món Ăn Bán Chạy Nhất</h2>
        <div className="h-80 w-full bg-sky-50/50 rounded-xl border border-dashed border-gray-200 p-4">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center"><p className="text-gray-400 font-semibold">Đang tải dữ liệu...</p></div>
          ) : !bestSellingProducts || bestSellingProducts.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-400 font-semibold">Chưa có đủ dữ liệu để hiển thị.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={bestSellingProducts}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }} 
                  interval={0} 
                  angle={-15}
                  textAnchor="end"
                  height={50}
                />
                <YAxis allowDecimals={false} />
                <RechartsTooltip 
                  formatter={(value) => [`${value} lượt`, 'Số lượng bán']}
                  cursor={{ fill: 'rgba(0, 136, 254, 0.1)' }}
                />
                <Legend />
                <Bar dataKey="totalSold" name="Số Lượng Bán" fill="#FFBB28" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* === PHẦN THỐNG KÊ ĐÁNH GIÁ MỚI === */}
      <div id="review-stats" className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Thống Kê Đánh Giá</h2>
          {reviewLoading ? (
            <div className="text-center p-10 bg-white rounded-2xl shadow-sm border border-gray-100">Đang tải dữ liệu thống kê đánh giá...</div>
          ) : !reviewStats || (reviewStats.topRatedProducts.length === 0 && reviewStats.mostReviewedProducts.length === 0) ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500">Chưa có dữ liệu đánh giá để thống kê.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cột 1: Phân bổ đánh giá (Biểu đồ tròn) */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FiStar className="text-yellow-500" /> Phân Bổ Đánh Giá
                    </h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={reviewStats.ratingDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={110}
                                    fill="#8884d8"
                                    dataKey="count"
                                    nameKey="name"
                                >
                                    {reviewStats.ratingDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name.charAt(0) - 1 || 0]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value, name) => [`${value} lượt`, name]} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cột 2 & 3: Top sản phẩm */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Top đánh giá cao */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiAward className="text-green-500" /> Top 5 Đánh Giá Cao
                        </h3>
                        <ul className="space-y-3">
                            {reviewStats.topRatedProducts.map((p, i) => (
                                <li key={i} className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-gray-700 truncate pr-2">{i + 1}. {p.name}</span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            {p.averageRating.toFixed(1)} <FiStar size={12} />
                                        </span>
                                        <span className="text-xs text-gray-400">({p.numReviews} reviews)</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Top nhiều review */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiMessageSquare className="text-blue-500" /> Top 5 Nhiều Review
                        </h3>
                        <ul className="space-y-3">
                            {reviewStats.mostReviewedProducts.map((p, i) => (
                                <li key={i} className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-gray-700 truncate pr-2">{i + 1}. {p.name}</span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                            {p.numReviews} reviews
                                        </span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">({p.averageRating.toFixed(1)} <FiStar size={12} />)</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
          )}
      </div>
    </div>
    {isExportModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md m-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Tùy Chọn Xuất Báo Cáo</h2>
            <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
              <FiX size={24} />
            </button>
          </div>
          <p className="text-gray-600 mb-6">Chọn các mục bạn muốn đưa vào file PDF.</p>
          <div className="space-y-4">
            {Object.entries({
              summary: 'Thống Kê Tổng Quan',
              revenueChart: 'Biểu Đồ Doanh Thu',
              bestSelling: 'Top Món Ăn Bán Chạy',
              recentOrders: 'Đơn Hàng Gần Đây',
              reviews: 'Thống Kê Đánh Giá',
            }).map(([key, label]) => (
              <label key={key} className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                <input
                  type="checkbox"
                  className="hidden"
                  checked={sectionsToExport[key]}
                  onChange={() => setSectionsToExport(prev => ({ ...prev, [key]: !prev[key] }))}
                />
                {sectionsToExport[key] ? (
                  <FiCheckSquare className="text-sky-500 text-2xl mr-3" />
                ) : (
                  <FiSquare className="text-gray-400 text-2xl mr-3" />
                )}
                <span className="font-semibold text-gray-700">{label}</span>
              </label>
            ))}
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="px-6 py-2.5 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition"
            >
              Hủy
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {isExporting ? (
                <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang xuất...</>
              ) : 'Bắt đầu xuất PDF'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default AdminDashboard;