const { GoogleGenerativeAI } = require("@google/generative-ai");
const Product = require('../models/Product');

// Khởi tạo Gemini AI với API Key từ môi trường
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Lấy ngữ cảnh (Context) từ Menu của nhà hàng
 */
const getRestaurantContext = async () => {
    try {
        // Lấy tất cả các món ăn (vì Product model chưa có trường isActive)
        const products = await Product.find({}).select('name description price category');

        let menuStr = "THỰC ĐƠN CỦA QUÁN (DUALEOFOOD):\n";
        if (products.length === 0) {
            menuStr += "Hiện tại quán chưa có món ăn nào.\n";
        } else {
            products.forEach(p => {
                menuStr += `- ${p.name} (${p.price.toLocaleString('vi-VN')} VNĐ). Mô tả: ${p.description || 'Không có mô tả'}.\n`;
            });
        }

        const systemInstruction = `
Bạn là "AI Trợ Lý", nhân viên chăm sóc khách hàng tự động của nhà hàng DualeoFood.
Nhiệm vụ của bạn là tư vấn món ăn, giải đáp thắc mắc về giá cả và thông tin món ăn dựa TRÊN THỰC ĐƠN được cung cấp.

Quy tắc bắt buộc:
1. LUÔN LUÔN thân thiện, xưng "Dạ", "Mình", gọi khách là "bạn" hoặc "Anh/Chị".
2. KHÔNG BAO GIỜ bịa ra món ăn không có trong thực đơn. Nếu khách hỏi món không có, hãy xin lỗi và giới thiệu món khác.
3. Câu trả lời phải NGẮN GỌN (dưới 50 từ), đi thẳng vào vấn đề vì đây là khung chat nhỏ.
4. Nếu khách hỏi về phí ship, giao hàng, thời gian mở cửa (mà không có trong dữ liệu), hãy nói: "Dạ phí ship và thời gian cụ thể sẽ được tính khi bạn đặt hàng ạ, bạn thông cảm giúp mình nhé!"
5. Dưới đây là thực đơn hiện tại của quán:
${menuStr}
`;
        return systemInstruction;
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu Menu cho AI:", error);
        return "Bạn là trợ lý ảo của DualeoFood. Rất tiếc hiện tại tôi không thể truy cập thực đơn.";
    }
};

/**
 * Hàm tạo câu trả lời tự động bằng Gemini
 * @param {string} userMessage Tin nhắn cuối cùng của khách hàng
 * @param {Array} history Lịch sử các tin nhắn trước đó (nếu có)
 */
const generateAutoReply = async (userMessage, history = []) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
        console.warn("[AI Service] GEMINI_API_KEY chưa được cấu hình trong .env!");
        return "Xin lỗi, hiện tại nhân viên đang bận. Vui lòng để lại lời nhắn hoặc quay lại sau ạ!";
    }

    const systemInstruction = await getRestaurantContext();
    const prompt = `
[HƯỚNG DẪN HỆ THỐNG]
${systemInstruction}
[/HƯỚNG DẪN HỆ THỐNG]

Khách hàng nhắn: "${userMessage}"
Bạn (AI Trợ Lý) trả lời:`;

    // Danh sách các model thử nghiệm theo thứ tự ưu tiên (Gemini API 2026 khuyến nghị gemini-3.6-flash)
    const candidateModels = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash"];
    let lastError = null;

    for (const modelName of candidateModels) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            if (text && text.trim()) {
                console.log(`[AI Service] Trả lời thành công bằng model: ${modelName}`);
                return text.trim();
            }
        } catch (error) {
            console.error(`[AI Service] Lỗi khi gọi model ${modelName}:`, error.message || error);
            lastError = error;
        }
    }

    console.error("[AI Service] Tất cả các model Gemini đều thất bại. Chi tiết lỗi cuối:", lastError);
    return "Dạ hiện tại hệ thống AI đang gặp chút sự cố, bạn vui lòng chờ nhân viên một chút nhé!";
};

module.exports = {
    generateAutoReply
};
