const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getAllCinemas } = require("../service/cinemaService");
const { getAllMovies } = require("../service/movieSevice");
const { getAllRoom } = require("../service/roomService");
const { getAllSeat } = require("../service/seatService");
require("dotenv").config();

// Lấy API key từ biến môi trường
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyDhlbIBRaC9ozX-dE1XI1gPAV5IXupzrcg";

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Lưu lịch sử cuộc trò chuyện cho mỗi người dùng
// Trong một ứng dụng thực tế, bạn sẽ muốn lưu trữ điều này trong cơ sở dữ liệu
const chatHistories = new Map();

// Controller xử lý chat với Gemini
exports.generateResponse = async (req, res) => {
  try {
    const { message, conversation } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Thiếu nội dung tin nhắn",
      });
    }

    // Lấy dữ liệu rạp từ database
    const cinemas = await getAllCinemas();

    // Chuyển đổi dữ liệu cinema vào định dạng phù hợp
    const cinemaData = cinemas.map((cinema) => ({
      id: cinema.dataValues.id,
      name: cinema.dataValues.name,
      city: cinema.dataValues.city,
      district: cinema.dataValues.district,
      address: `${cinema.dataValues.street}, ${cinema.dataValues.ward}, ${cinema.dataValues.district}, ${cinema.dataValues.city}`,
      branchId: cinema.dataValues.branch_id,
    }));

    // Lấy dữ liệu phim từ database
    const movies = await getAllMovies();

    // Chuyển đổi dữ liệu movie vào định dạng phù hợp
    const movieData = movies.map((movie) => ({
      id: movie.id,
      name: movie.name,
      description: movie.description,
      trailer: movie.trailer,
      year: movie.year,
      poster: movie.poster,
      ageRating: movie.age_rating,
      duration: movie.duration,
      country: movie.country,
      director: movie.Director
        ? {
            id: movie.Director.id,
            name: movie.Director.name,
            dob: movie.Director.dob,
            bio: movie.Director.bio,
            profilePicture: movie.Director.profile_picture,
          }
        : null,
      genres: movie.MovieGenres
        ? movie.MovieGenres.map((g) => ({
            id: g.Genre.id,
            name: g.Genre.name,
          }))
        : [],
      actors: movie.MovieActors
        ? movie.MovieActors.map((a) => ({
            id: a.Actor.id,
            name: a.Actor.name,
            dob: a.Actor.dob,
            bio: a.Actor.bio,
            profilePicture: a.Actor.profile_picture,
          }))
        : [],
    }));

    // Lấy dữ liệu phòng từ database
    const rooms = await getAllRoom();

    // Chuyển đổi dữ liệu phòng vào định dạng phù hợp
    let roomData = [];
    roomData = rooms.rooms.map((room) => ({
      id: room.id,
      name: room.name,
      cinemaId: room.cinema_id,
      rowsCount: room.rows_count,
      columnsCount: room.columns_count,
      cinema: room.Cinema ? { name: room.Cinema.name } : null,
    }));

    // Lấy dữ liệu ghế từ database
    const allSeats = [];
    // Lấy ghế từ một số phòng đầu tiên để minh họa
    if (Array.isArray(rooms) && rooms.length > 0) {
      // Chỉ lấy ghế từ tối đa 3 phòng đầu tiên để tránh quá nhiều dữ liệu
      for (let i = 0; i < Math.min(3, rooms.length); i++) {
        try {
          const room = rooms[i];
          const seats = await getAllSeat(room.id);

          const seatList = seats.map((seat) => ({
            id: seat.id,
            roomId: seat.room_id,
            seatNumber: seat.seat_number,
            seatRow: seat.seat_row,
            isEnabled: seat.is_enabled,
            typeId: seat.type_id,
          }));
          allSeats = seatList;
        } catch (error) {
          console.error(
            `Error fetching seats for room at index ${i}:`,
            error.message
          );
        }
      }
    }

    // Trong một ứng dụng thực tế, bạn sẽ muốn dùng session hoặc user ID
    // Tạm thời dùng IP
    const userId = req.ip;

    // Lấy hoặc tạo mới lịch sử trò chuyện cho người dùng
    if (!chatHistories.has(userId)) {
      // Nếu đã có conversation từ client, sử dụng nó
      if (conversation && conversation.length > 0) {
        const formattedHistory = conversation.map((msg) => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        }));
        chatHistories.set(userId, formattedHistory);
      } else {
        chatHistories.set(userId, []);
      }
    }

    const chatHistory = chatHistories.get(userId);

    // Thêm tin nhắn từ người dùng vào lịch sử
    chatHistory.push({ role: "user", parts: [{ text: message }] });

    // Tạo model chat từ Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Tạo chat từ lịch sử
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    // Lấy phản hồi
    const result = await chat.sendMessage(
      buildPrompt(
        message,
        conversation || [],
        cinemaData,
        movieData,
        roomData,
        allSeats
      )
    );
    const response = result.response.text();

    // Thêm phản hồi từ AI vào lịch sử
    chatHistory.push({ role: "model", parts: [{ text: response }] });

    // Giới hạn kích thước lịch sử (để tránh sử dụng quá nhiều bộ nhớ)
    if (chatHistory.length > 20) {
      chatHistories.set(userId, chatHistory.slice(-20));
    }

    // Trả về kết quả
    return res.status(200).json({
      success: true,
      response: response,
    });
  } catch (error) {
    console.error("Error in chatbot controller:", error);

    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xử lý yêu cầu của bạn",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Xây dựng prompt thông minh với ngữ cảnh
const buildPrompt = (
  currentMessage,
  messageHistory = [],
  cinemaData = [],
  movieData = [],
  roomData = [],
  seatData = []
) => {
  let conversationContext = "";

  // Add previous messages for context (limit to last 6 messages)
  const recentMessages = messageHistory.slice(-6);
  if (recentMessages.length > 0) {
    conversationContext = "Đây là cuộc trò chuyện trước đó:\n";

    recentMessages.forEach((msg) => {
      const role = msg.sender === "user" ? "Người dùng" : "Bạn";
      conversationContext += `${role}: ${msg.text}\n`;
    });

    conversationContext += "\n";
  }

  // Tạo chuỗi thông tin về rạp chiếu phim
  const cinemaInfo = cinemaData
    .map((cinema) => {
      return `
Rạp: ${cinema.name}
Địa chỉ: ${cinema.address}
Quận/Huyện: ${cinema.district}
Thành phố: ${cinema.city}
    `;
    })
    .join("\n");

  // Tạo chuỗi thông tin về phim
  const movieInfo = movieData
    .map((movie) => {
      const genres = movie.genres.map((g) => g.name).join(", ");
      const actors = movie.actors.map((a) => a.name).join(", ");

      return `
Phim: ${movie.name}
Mô tả: ${movie.description || "Không có mô tả"}
Thể loại: ${genres || "Không có thông tin"}
Độ tuổi: ${movie.ageRating || "Chưa phân loại"}
Thời lượng: ${movie.duration ? `${movie.duration} phút` : "Chưa cập nhật"}
Quốc gia: ${movie.country || "Chưa cập nhật"}
Đạo diễn: ${movie.director ? movie.director.name : "Chưa cập nhật"}
Diễn viên: ${actors || "Chưa cập nhật"}
Năm sản xuất: ${movie.year || "Chưa cập nhật"}
    `;
    })
    .join("\n");

  // Tạo chuỗi thông tin về phòng chiếu
  let roomInfo = "THÔNG TIN PHÒNG CHIẾU:\n";
  if (roomData && roomData.length > 0) {
    // Chỉ lấy tối đa 10 phòng để không làm prompt quá dài
    roomData.slice(0, 10).forEach((room) => {
      roomInfo += `
Phòng: ${room.name}
Rạp: ${room.cinema ? room.cinema.name : "Không có thông tin"}
Số hàng: ${room.rowsCount}
Số cột: ${room.columnsCount}
      `;
    });

    roomInfo += `\n(Tổng cộng ${roomData.length} phòng chiếu trong hệ thống)\n`;
  } else {
    roomInfo += "Hiện chưa có thông tin chi tiết về phòng chiếu.";
  }

  // Tạo chuỗi thông tin về loại ghế
  let seatInfo = "THÔNG TIN GHẾ:\n";
  if (seatData && seatData.length > 0) {
    // Nhóm các ghế theo phòng và hiển thị một số ví dụ
    const seatByRoom = {};
    seatData.forEach((seat) => {
      if (!seatByRoom[seat.roomId]) {
        seatByRoom[seat.roomId] = [];
      }
      seatByRoom[seat.roomId].push(seat);
    });

    Object.keys(seatByRoom)
      .slice(0, 3)
      .forEach((roomId) => {
        // Chỉ hiển thị ghế của 3 phòng
        const seats = seatByRoom[roomId].slice(0, 5); // Chỉ hiển thị 5 ghế mỗi phòng
        seatInfo += `Phòng ID ${roomId}: Có ${seatByRoom[roomId].length} ghế\n`;
        seatInfo += `Ví dụ: ${seats
          .map((s) => `${s.seatRow}${s.seatNumber}`)
          .join(", ")}\n\n`;
      });

    // Thêm thông tin về tình trạng ghế
    seatInfo += `
Các loại ghế:
- Ghế thường: Ghế tiêu chuẩn với giá cơ bản
- Ghế VIP: Ghế cao cấp với vị trí tốt, tầm nhìn đẹp
- Ghế đôi: Ghế dành cho cặp đôi, rộng rãi và thoải mái hơn
- Ghế Deluxe: Ghế cao cấp với không gian rộng và dịch vụ đặc biệt

Trạng thái ghế:
- Available: Ghế trống, có thể đặt
- Reserved: Ghế đã được giữ chỗ
- Booked: Ghế đã được đặt, không thể chọn
- Unavailable: Ghế không khả dụng (bảo trì, hỏng)
    `;
  } else {
    seatInfo += "Hiện chưa có thông tin chi tiết về ghế.";
  }

  // Thông tin về chính sách vé và hỗ trợ
  const ticketPolicies = `
CHÍNH SÁCH VÉ VÀ HỖ TRỢ:
- Vé đã mua KHÔNG ĐƯỢC ĐỔI hoặc TRẢ trong mọi trường hợp
- Vé chỉ có giá trị sử dụng cho đúng suất chiếu đã đặt
- Nếu có vấn đề hoặc khiếu nại, vui lòng liên hệ đường dây nóng: 0828477808
- Thời gian hỗ trợ: 8:00 - 22:00 tất cả các ngày trong tuần
- Email hỗ trợ: support@movies-tickets.vn
  `;

  return `${conversationContext}Bạn là Minh, trợ lý AI thân thiện và gần gũi của trang web đặt vé xem phim Movies-Tickets. 

THÔNG TIN PHIM ĐANG CHIẾU:
${movieInfo}

THÔNG TIN RẠP CHIẾU PHIM:
${cinemaInfo}

${roomInfo}

${seatInfo}

${ticketPolicies}

HƯỚNG DẪN ĐẶT VÉ:
1. Truy cập trang web Movies-Tickets hoặc ứng dụng di động
2. Chọn phim muốn xem từ danh sách phim đang chiếu
3. Chọn ngày và suất chiếu phù hợp
4. Chọn rạp và chi nhánh bạn muốn xem
5. Chọn loại ghế và vị trí ghế mong muốn
6. Tùy chọn thêm bắp nước và đồ ăn
7. Nhập mã khuyến mãi nếu có
8. Chọn phương thức thanh toán và hoàn tất đặt vé
9. Nhận mã QR hoặc vé điện tử qua email/SMS

THÔNG TIN VỀ LOẠI GHẾ VÀ GIÁ VÉ:
- Ghế Thường: 90.000đ - 120.000đ (tùy suất chiếu)
- Ghế VIP: 140.000đ - 180.000đ (tùy suất chiếu)
- Ghế Đôi: 240.000đ - 280.000đ (tùy suất chiếu)
- Ghế Deluxe: 200.000đ - 250.000đ (tùy suất chiếu)

THÔNG TIN VỀ ĐỒ ĂN VÀ NƯỚC UỐNG:
- Combo Đơn: 1 bắp lớn + 1 nước lớn (75.000đ)
- Combo Đôi: 1 bắp lớn + 2 nước lớn (99.000đ)
- Combo Gia đình: 2 bắp lớn + 4 nước lớn + 1 snack (189.000đ)

PHƯƠNG THỨC THANH TOÁN:
- Thẻ tín dụng/ghi nợ
- Ví điện tử (MoMo, ZaloPay, VNPay)
- Tiền mặt tại quầy

HƯỚNG DẪN VỀ CÁCH NÓI CHUYỆN:
1. Hãy nói chuyện giống như một người bạn thân thiện, thân mật, và trẻ trung. Sử dụng cách xưng hô "mình" và "bạn" thay vì "tôi" và "quý khách".
2. Thêm vào các từ ngữ cảm thán tự nhiên như "Ồ", "Woa", "Hmm", "Haha", khi phù hợp.
3. Không viết câu trả lời quá dài và chính thức. Hãy viết ngắn gọn, trẻ trung và tự nhiên.
4. Thỉnh thoảng sử dụng emoji như 😊, 🍿, 🎬, 🎉 khi phù hợp để tạo không khí vui vẻ.
5. Thêm vào một chút hài hước nhẹ nhàng và thân thiện trong câu trả lời.
6. Sử dụng ngôn ngữ đời thường, tránh ngôn ngữ quá chính thức hay máy móc.
7. Đôi khi hỏi lại người dùng một câu ngắn để tiếp tục cuộc trò chuyện một cách tự nhiên.
8. Thỉnh thoảng sử dụng các từ lóng phổ biến trong giới trẻ Việt Nam như "chill", "xịn sò", "căng", "đỉnh" khi nói về phim hay trải nghiệm.

QUAN TRỌNG: KHÔNG ĐƯỢC ĐỀ XUẤT PHIM CỤ THỂ HOẶC SUẤT CHIẾU CỤ THỂ!
- KHÔNG ĐƯỢC tư vấn kiểu "Bạn muốn xem phim nào vào ngày nào và giờ nào vậy?"
- KHÔNG ĐƯỢC đề xuất suất chiếu cụ thể
- Khi người dùng hỏi về phim hoặc lịch chiếu, chỉ hướng dẫn họ cách tìm thông tin và đặt vé trên hệ thống

Khi trả lời về phim:
- Được phép cung cấp thông tin về nội dung, thể loại, đạo diễn, diễn viên của một phim cụ thể nếu người dùng hỏi
- KHÔNG được đề xuất phim cụ thể nếu người dùng chưa hỏi, chỉ nên gợi ý tìm theo thể loại
- Khi người dùng hỏi về diễn viên hoặc đạo diễn của một phim, cung cấp thông tin đúng từ dữ liệu

Khi trả lời về rạp chiếu phim:
- Chỉ cung cấp thông tin chung về các rạp có trong hệ thống
- KHÔNG đưa ra đề xuất rạp cụ thể trừ khi người dùng hỏi về khu vực/địa điểm cụ thể

Khi hướng dẫn đặt ghế:
- Giải thích quy trình đặt ghế một cách chung chung
- Hướng dẫn cách chọn và nhìn sơ đồ ghế
- KHÔNG đề xuất vị trí ghế cụ thể
- Giải thích các loại ghế khác nhau và đặc điểm của từng loại
- Giải thích các trạng thái ghế khác nhau (Available, Reserved, Booked, Unavailable)

Khi được hỏi về chính sách vé:
- Luôn nhấn mạnh rằng vé ĐÃ MUA KHÔNG THỂ đổi hoặc trả lại trong mọi trường hợp
- Hướng dẫn khách hàng kiểm tra kỹ thông tin trước khi thanh toán
- Nếu khách hàng có khiếu nại hoặc vấn đề, hướng dẫn họ liên hệ qua số hotline: 0828477808
- Thông báo rõ ràng về thời gian hỗ trợ (8:00 - 22:00 tất cả các ngày trong tuần)
- Nhấn mạnh rằng vé chỉ có giá trị cho đúng suất chiếu đã đặt

Hãy trả lời ngắn gọn, thân thiện và hữu ích dựa trên thông tin đã cung cấp ở trên.
Nếu được hỏi về nội dung không liên quan đến phim hoặc rạp, hãy nhẹ nhàng hướng người dùng quay lại chủ đề.
Trả lời bằng tiếng Việt, trừ khi người dùng hỏi bằng tiếng Anh.
  
Người dùng: ${currentMessage}`;
};
