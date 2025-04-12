const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getAllCinemasForBoxchat } = require("../service/cinemaService");
const { getAllMoviesForBoxchat } = require("../service/movieSevice");
const { getAllRoomForBoxchat } = require("../service/roomService");
const { getAllSeat } = require("../service/seatService");
const { getAllCombosForBoxchat } = require("../service/comboService");
const { getAllSeatTypeForBoxchat } = require("../service/seatTypeService");
const { getShowtimesByMovieIdForBoxchat, getShowtimeByIdForBoxchat } = require("../service/showtimeService");
require("dotenv").config();

// Lấy API key từ biến môi trường
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyDhlbIBRaC9ozX-dE1XI1gPAV5IXupzrcg";

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Lưu lịch sử cuộc trò chuyện cho mỗi người dùng
// Trong một ứng dụng thực tế, bạn sẽ muốn lưu trữ điều này trong cơ sở dữ liệu
const chatHistories = new Map();

// Cache cho seat types để tránh phải gọi lại nhiều lần
let seatTypeCache = null;
let seatTypeCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

// Lấy thông tin giá vé cơ bản cho một suất chiếu
const getShowtimePrice = async (showtimeId) => {
  try {
    // Lấy dữ liệu song song để tăng hiệu suất
    const [showtimeResult, seatTypes] = await Promise.all([
      getShowtimeByIdForBoxchat(showtimeId),
      getSeatTypes()
    ]);
    
    // Xử lý cấu trúc kết quả từ API
    if (!showtimeResult || showtimeResult.status !== 200) {
      return {
        success: false,
        message: showtimeResult?.message || "Không tìm thấy thông tin suất chiếu"
      };
    }
    
    const showtimeData = showtimeResult.showtime || {};
    const basePrice = Number(showtimeData.base_price) || 0;
      
    // Tạo thông tin về các loại ghế và giá
    const seatPrices = seatTypes.map(seatType => ({
      type: seatType.type,
      price: basePrice + Number(seatType.price_offset),
      color: seatType.color
    }));
    
    // Destructuring để lấy dữ liệu từ showtime
    const { id, start_time = {}, room = {}, movie = {} } = showtimeData;
    const cinema = room.cinema || {};
    
    return {
      success: true,
      base_price: String(basePrice),
      seat_prices: seatPrices,
      seat_types: seatTypes,
      showtime: {
        id,
        start_time: start_time || { dayOfWeek: "", date: "", time: "" },
        room: room.name || "Không xác định",
        cinema: cinema.name || "Không xác định",
        movie: movie.name || "Không xác định"
      }
    };
  } catch (error) {
    console.error(`Error fetching showtime price for ID ${showtimeId}:`, error.message);
    return {
      success: false,
      message: "Lỗi khi lấy thông tin giá vé: " + error.message
    };
  }
};

// Hàm helper để lấy và cache thông tin seat types
const getSeatTypes = async () => {
  // Sử dụng cache nếu còn hạn
  const now = Date.now();
  if (seatTypeCache && seatTypeCacheTime && (now - seatTypeCacheTime < CACHE_DURATION)) {
    return seatTypeCache;
  }
  
  // Lấy thông tin mới nếu cache hết hạn hoặc chưa có cache
  try {
    const seatTypes = await getAllSeatTypeForBoxchat();
    const formattedSeatTypes = seatTypes.map(type => ({
      id: type.id,
      type: type.type,
      color: type.color,
      price_offset: Number(type.price_offset)
    }));
    
    // Cập nhật cache
    seatTypeCache = formattedSeatTypes;
    seatTypeCacheTime = now;
    
    return formattedSeatTypes;
  } catch (error) {
    console.error("Error fetching seat types:", error.message);
    // Trả về mảng rỗng nếu có lỗi
    return [];
  }
};

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
    const cinemas = await getAllCinemasForBoxchat();

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
    const movies = await getAllMoviesForBoxchat();

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
    const rooms = await getAllRoomForBoxchat();

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
    // Cấu trúc sẽ là { roomId: { roomName: string, seats: [] } }
    const seatsByRoom = {};
    
    // Lấy thông tin loại ghế từ database
    const seatTypes = await getAllSeatTypeForBoxchat();
   
    
    const seatTypesList = seatTypes.map(type => ({
      id: type.id,
      type: type.type,
      color: type.color,
      price_offset: Number(type.price_offset)
    }));
    
    // Tạo map để truy cập nhanh thông tin loại ghế
    const seatTypeMap = {};
    seatTypesList.forEach(type => {
      seatTypeMap[type.id] = type;
    });
    
    // Chỉ lấy ghế từ tối đa 5 phòng đầu tiên để tránh quá nhiều dữ liệu
    if (roomData && roomData.length > 0) {
      for (let i = 0; i < Math.min(5, roomData.length); i++) {
        try {
          const room = roomData[i];
          const seats = await getAllSeat(room.id);

          const seatList = seats.map((seat) => {
            // Lấy thông tin loại ghế
            const seatType = seatTypeMap[seat.type_id] || {
              type: 'Không xác định',
              color: '#CCCCCC',
              price_offset: 0
            };
            
            return {
              id: seat.id,
              roomId: seat.room_id,
              seatNumber: seat.seat_number,
              seatRow: seat.seat_row,
              isEnabled: seat.is_enabled,
              typeId: seat.type_id,
              type: seatType.type,
              color: seatType.color,
              price_offset: seatType.price_offset
            };
          });
          
          // Lưu thông tin ghế theo phòng
          seatsByRoom[room.id] = {
            roomName: room.name,
            cinemaName: room.cinema ? room.cinema.name : "Không có thông tin",
            totalSeats: seatList.length,
            seats: seatList,
            seatTypes: seatTypesList
          };
        } catch (error) {
          console.error(
            `Error fetching seats for room at index ${i}:`,
            error.message
          );
        }
      }
    }

    // Lấy dữ liệu combo từ database
    const combos = await getAllCombosForBoxchat();
    
    // Chuyển đổi dữ liệu combo vào định dạng phù hợp
    const comboData = combos.map(combo => {
      const items = combo.ComboItems ? combo.ComboItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        product: item.FoodAndDrink ? {
          id: item.FoodAndDrink.id,
          name: item.FoodAndDrink.name,
          description: item.FoodAndDrink.description,
          price: item.FoodAndDrink.price,
          type: item.FoodAndDrink.type,
          image: item.FoodAndDrink.image
        } : null
      })) : [];
      
      return {
        id: combo.id,
        name: combo.name,
        price: combo.price,
        profilePicture: combo.profile_picture,
        items: items
      };
    });

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

    // Tạo thông tin giá vé
    const ticketPriceInfo = await createTicketPriceInfo(movieData);

    // Xây dựng prompt với thông tin suất chiếu
    const prompt = await buildPrompt(
      message,
      conversation || [],
      cinemaData,
      movieData,
      roomData,
      seatsByRoom,
      comboData,
      seatTypesList
    );

    // Lấy phản hồi
    const result = await chat.sendMessage(prompt);
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

// API endpoint để lấy thông tin giá vé từ chatbot
exports.getTicketPrice = async (req, res) => {
  try {
    const { showtime_id } = req.params;
    
    if (!showtime_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ID suất chiếu"
      });
    }
    
    const priceInfo = await getShowtimePrice(showtime_id);
    
    if (!priceInfo.success) {
      return res.status(404).json({
        success: false,
        message: priceInfo.message || "Không tìm thấy thông tin giá vé"
      });
    }
    
    // Format dữ liệu trả về
    const formattedData = {
      base_price: priceInfo.base_price,
      formatted_price: Number(priceInfo.base_price).toLocaleString('vi-VN') + " đồng",
      seat_prices: priceInfo.seat_prices.map(sp => ({
        ...sp,
        formatted_price: Number(sp.price).toLocaleString('vi-VN') + " đồng"
      })),
      seat_types: priceInfo.seat_types,
      showtime: priceInfo.showtime
    };
    
    return res.status(200).json({
      success: true,
      message: "Lấy thông tin giá vé thành công",
      data: formattedData
    });
  } catch (error) {
    return handleApiError(res, error, "Có lỗi xảy ra khi lấy thông tin giá vé");
  }
};

// API endpoint để lấy thông tin về tất cả các loại ghế
exports.getAllSeatTypes = async (req, res) => {
  try {
    const seatTypes = await getSeatTypes();
    
    return res.json({
      success: true,
      message: "Get seat types successfully",
      seatTypes
    });
  } catch (error) {
    return handleApiError(res, error, "Có lỗi xảy ra khi lấy thông tin loại ghế");
  }
};

// Helper function để xử lý lỗi API một cách nhất quán
const handleApiError = (res, error, message) => {
  console.error(message + ":", error);
  
  return res.status(500).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === "development" ? error.message : undefined
  });
};

// Xây dựng prompt thông minh với ngữ cảnh
const buildPrompt = async (
  currentMessage,
  messageHistory = [],
  cinemaData = [],
  movieData = [],
  roomData = [],
  seatsByRoom = {},
  comboData = [],
  seatTypesList = []
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

  // Tạo thông tin giá vé
  const ticketPriceInfo = await createTicketPriceInfo(movieData);

  // Tạo mảng promises để lấy thông tin suất chiếu cho từng phim
  const movieInfoPromises = movieData.map(async (movie) => {
    const genres = movie.genres.map((g) => g.name).join(", ");
    const actors = movie.actors.map((a) => a.name).join(", ");
    
    // Lấy thông tin suất chiếu cho phim này
    let showtimeInfo = "";
    try {
      const showtimeResult = await getShowtimesByMovieIdForBoxchat(movie.id);
      console.log("showtimeResult:", showtimeResult);
      
      
      if (showtimeResult && showtimeResult.status === 200 && showtimeResult.data && showtimeResult.data.length > 0) {
        showtimeInfo = "\nLịch chiếu:\n";
        showtimeResult.data.forEach(dateGroup => {
          showtimeInfo += `- Ngày ${dateGroup.date} (${dateGroup.day}):\n`;
          dateGroup.cinemas.forEach(cinema => {
            showtimeInfo += `  + ${cinema.cinema_name}:\n`;
            cinema.showtimes.forEach(showtime => {
              // Chuyển đổi thời gian từ "hh:mm" sang "hh giờ mm"
              const timeParts = showtime.time.split(':');
              const formattedTime = `${timeParts[0]} giờ ${timeParts[1]}`;
              showtimeInfo += `    * ${formattedTime} - ${showtime.room_name}\n`;
            });
          });
        });
      } else {
        showtimeInfo = "\nHiện chưa có thông tin lịch chiếu cho phim này.\n";
      }
    } catch (error) {
      console.error(`Error fetching showtimes for movie ${movie.id}:`, error.message);
      showtimeInfo = "\nHiện chưa có thông tin lịch chiếu.\n";
    }

    return `
Phim: ${movie.name}
Mô tả: ${movie.description || "Không có mô tả"}
Thể loại: ${genres || "Không có thông tin"}
Độ tuổi: ${movie.ageRating || "Chưa phân loại"}
Thời lượng: ${movie.duration ? `${movie.duration} phút` : "Chưa cập nhật"}
Quốc gia: ${movie.country || "Chưa cập nhật"}
Đạo diễn: ${movie.director ? movie.director.name : "Chưa cập nhật"}
Diễn viên: ${actors || "Chưa cập nhật"}
Năm sản xuất: ${movie.year || "Chưa cập nhật"}${showtimeInfo}
    `;
  });

  // Chờ tất cả các promise hoàn thành
  const resolvedMovieInfo = await Promise.all(movieInfoPromises);
  const movieInfo = resolvedMovieInfo.join("\n");

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
  if (Object.keys(seatsByRoom).length > 0) {
    // Hiển thị thông tin ghế theo từng phòng
    Object.keys(seatsByRoom).forEach(roomId => {
      const roomData = seatsByRoom[roomId];
      seatInfo += `Phòng "${roomData.roomName}" tại rạp "${roomData.cinemaName}": Có ${roomData.totalSeats} ghế\n`;
      
      // Hiển thị một số ghế mẫu
      if (roomData.seats && roomData.seats.length > 0) {
        const sampleSeats = roomData.seats.slice(0, 5);
        seatInfo += `Ví dụ: ${sampleSeats.map(s => `${s.seatRow}${s.seatNumber}`).join(", ")}\n\n`;
      }
    });

    // Thông tin về trạng thái ghế (loại bỏ thông tin về loại ghế)
    seatInfo += `
Trạng thái ghế:
- Còn trống: Ghế trống, có thể đặt
- Đã giữ chỗ: Ghế đã được giữ chỗ
- Đã đặt: Ghế đã được đặt, không thể chọn
- Không khả dụng: Ghế không khả dụng (bảo trì, hỏng)
    `;
  } else {
    seatInfo += "Hiện chưa có thông tin chi tiết về ghế.";
  }

  // Tạo chuỗi thông tin về combo đồ ăn
  let comboInfo = "THÔNG TIN VỀ ĐỒ ĂN VÀ NƯỚC UỐNG:\n";
  if (comboData && comboData.length > 0) {
    comboData.forEach((combo) => {
      const itemsDescription = combo.items.map(item => 
        `${item.quantity} x ${item.product ? item.product.name : 'Sản phẩm không xác định'}`
      ).join(", ");
      
      comboInfo += `- ${combo.name}: ${itemsDescription} (${combo.price.toLocaleString('vi-VN')} đồng)\n`;
    });
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

  return `${conversationContext}Bạn là Minh, trợ lý AI của trang web đặt vé xem phim B Cinemas. 

THÔNG TIN PHIM ĐANG CHIẾU:
${movieInfo}

THÔNG TIN RẠP CHIẾU PHIM:
${cinemaInfo}

${roomInfo}

${seatInfo}

${comboInfo}

${ticketPriceInfo}

${ticketPolicies}

HƯỚNG DẪN ĐẶT VÉ:
1. Truy cập trang chủ B Cinemas hoặc ứng dụng di động
2. Xem danh sách phim đang chiếu 
3. Nhấp vào phim bạn muốn xem để xem chi tiết phim
4. Ở phần dưới trang chi tiết phim, chọn suất chiếu (ngày và giờ) phù hợp
5. Sau khi chọn suất chiếu, hệ thống sẽ chuyển bạn đến trang chọn ghế
6. Chọn vị trí ghế bạn muốn ngồi
7. Tiếp theo, hệ thống sẽ chuyển bạn đến trang chọn combo đồ ăn/nước uống hoặc nhập mã giảm giá (nếu có)
8. Kiểm tra lại thông tin đặt vé
9. Chọn phương thức thanh toán và hoàn tất đặt vé
10. Nhận mã QR hoặc vé điện tử qua email/

THÔNG TIN LIÊN KẾT QUAN TRỌNG:
- Trang danh sách phim: Truy cập trang web chính thức của B Cinemas và vào mục "Phim"
- Trang chủ: Truy cập trang web chính thức của B Cinemas
- Liên hệ hỗ trợ: Truy cập trang web chính thức của B Cinemas và vào mục "Liên hệ"

PHƯƠNG THỨC THANH TOÁN:
- Thẻ tín dụng/ghi nợ
- Ví điện tử (MoMo, ZaloPay, VNPay)
- Tiền mặt tại quầy

HƯỚNG DẪN VỀ CÁCH NÓI CHUYỆN:
1. Nói chuyện cởi mở, thân thiện và gần gũi. Xưng "mình" hoặc "tôi" và gọi người dùng là "bạn".
2. Giọng điệu tự nhiên, dễ gần như đang nói chuyện với người quen.
3. Trả lời ngắn gọn, dễ hiểu và hữu ích, không quá dài dòng.
4. Sử dụng tiếng Việt thuần túy, tránh từ ngữ tiếng Anh không cần thiết.
5. Cung cấp thông tin chính xác, đầy đủ nhưng dễ tiếp cận.
6. Khi nói về giá cả, luôn sử dụng "đồng" thay vì "đ" hoặc các ký hiệu khác.
7. Tạo không khí thoải mái, cởi mở nhưng vẫn chuyên nghiệp.
8. Không quá khách sáo hoặc quá trang trọng, nhưng luôn giữ sự tôn trọng.
9. Khi chia sẻ URL, chỉ chia sẻ URL đơn thuần, TUYỆT ĐỐI KHÔNG đặt trong dấu ngoặc vuông, ngoặc tròn hoặc thêm dấu chấm sau URL. Một URL hợp lệ phải có dạng http://localhost:5173/product (KHÔNG có dấu chấm ở cuối). LUÔN đảm bảo có khoảng trống giữa URL và từ tiếp theo, KHÔNG viết liền URL với từ tiếp theo như "http://localhost:5173/product.Bạn" hoặc "http://localhost:5173/productBạn".
10. Khi liệt kê danh sách các mục (như combo, phim, v.v.), không sử dụng dấu * hoặc các ký hiệu đánh dấu khác, chỉ sử dụng dấu gạch đầu dòng (-) hoặc liệt kê theo số (1., 2., v.v.).
11. Không bao giờ viết tắt đơn vị tiền tệ thành "K" hay "k", luôn viết đầy đủ "000 đồng" hoặc ".000 đồng".
12. Luôn chủ động tư vấn cho khách hàng bằng cách đặt các câu hỏi thân thiện như:
   - "Bạn thích xem phim thể loại nào?"
   - "Bạn đã từng đến rạp B Cinemas bao giờ chưa?"
   - "Bạn có muốn biết thêm về các ưu đãi khi đặt vé không?"
   - "Bạn có thắc mắc gì về cách đặt vé không?"
13. Kết thúc mỗi câu trả lời với một câu hỏi mở để khách hàng có thể tiếp tục cuộc trò chuyện.
14. Tỏ ra quan tâm đến trải nghiệm của khách hàng, như "Bạn thấy trải nghiệm đặt vé của chúng tôi thế nào?"

QUAN TRỌNG: KHÔNG ĐƯỢC ĐỀ XUẤT PHIM CỤ THỂ HOẶC SUẤT CHIẾU CỤ THỂ!
- KHÔNG ĐƯỢC tư vấn kiểu "Bạn muốn xem phim nào vào ngày nào và giờ nào vậy?"
- KHÔNG ĐƯỢC đề xuất suất chiếu cụ thể
- Khi người dùng hỏi về phim hoặc lịch chiếu, chỉ hướng dẫn họ cách tìm thông tin và đặt vé trên hệ thống
- TUYỆT ĐỐI KHÔNG hỏi người dùng muốn xem ở rạp nào hoặc chọn loại ghế nào
- Khi người dùng đề cập một phim cụ thể để đặt vé, KHÔNG tiếp tục đề cập tên phim đó, mà chỉ hướng dẫn quy trình đặt vé chung
- Nếu người dùng hỏi "Tôi muốn đặt vé xem phim X", KHÔNG được trả lời "Để đặt vé xem phim X, bạn...", mà phải trả lời "Để đặt vé xem phim, bạn cần làm theo các bước sau..."
- Khi chia sẻ URL, luôn hướng dẫn truy cập trang web chính thức của B Cinemas. LUÔN đảm bảo có khoảng trống giữa URL và từ tiếp theo nếu phải đề cập URL.

Khi trả lời về giá vé:
- Cung cấp thông tin chung về giá vé cơ bản, không cam kết giá cụ thể
- Luôn nhấn mạnh rằng giá vé tùy thuộc vào nhiều yếu tố: thời gian, rạp, loại ghế, v.v.
- Dẫn ra ví dụ giá vé từ dữ liệu có sẵn nếu được hỏi
- Nhấn mạnh rằng giá có thể thay đổi và khuyến khích người dùng kiểm tra trang web chính thức
- KHÔNG đưa ra mức giá chính xác cho các suất chiếu mà không có trong dữ liệu
- Khi người dùng hỏi "Vé phim X giá bao nhiêu?", trả lời theo mẫu: "Giá vé xem phim thường dao động từ... đến... đồng tùy theo rạp và thời gian. Bạn có thể kiểm tra giá chính xác trên trang web chính thức của B Cinemas."

Khi trả lời về phim:
- Được phép cung cấp thông tin về nội dung, thể loại, đạo diễn, diễn viên của một phim cụ thể nếu người dùng hỏi
- KHÔNG được đề xuất phim cụ thể nếu người dùng chưa hỏi, chỉ nên gợi ý tìm theo thể loại
- Khi người dùng hỏi về diễn viên hoặc đạo diễn của một phim, cung cấp thông tin đúng từ dữ liệu
- Để xem danh sách phim đang chiếu, hướng dẫn người dùng truy cập trang web chính thức của B Cinemas
- Luôn hỏi về sở thích của người dùng một cách thân thiện, như: "Bạn thích xem phim thể loại nào?", "Bạn có yêu thích bộ phim nào gần đây không?"
- Sau khi cung cấp thông tin về thể loại phim, hỏi thêm: "Bạn thích xem phim thuộc thể loại nào trong số các thể loại mình vừa kể?"

Khi trả lời về rạp chiếu phim:
- Chỉ cung cấp thông tin chung về các rạp có trong hệ thống
- KHÔNG đưa ra đề xuất rạp cụ thể trừ khi người dùng hỏi về khu vực/địa điểm cụ thể
- Đặt câu hỏi như: "Bạn muốn tìm rạp chiếu phim ở khu vực nào?" hoặc "Bạn đã từng đến rạp nào của chúng tôi chưa?"
- Hỏi về tiêu chí lựa chọn rạp: "Bạn quan tâm đến vị trí rạp hay các tiện ích đi kèm?"

Khi hướng dẫn đặt ghế:
- Giải thích quy trình đặt ghế một cách chung chung
- Hướng dẫn cách chọn và nhìn sơ đồ ghế
- KHÔNG đề xuất vị trí ghế cụ thể
- Giải thích các trạng thái ghế khác nhau (Còn trống, Đã giữ chỗ, Đã đặt, Không khả dụng)
- Đặt câu hỏi thân thiện: "Bạn thích ngồi ở vị trí nào trong rạp?" hoặc "Bạn thích ghế loại nào khi xem phim?"
- Hỏi thêm: "Bạn thường đi xem phim một mình hay với bạn bè/gia đình?" để gợi ý số lượng ghế phù hợp

Khi được hỏi về cách đặt vé:
- TUYỆT ĐỐI KHÔNG đề xuất phim cụ thể khi hướng dẫn đặt vé, ngay cả khi người dùng đã đề cập đến phim
- Trả lời trực tiếp về quy trình đặt vé theo các bước rõ ràng và ngắn gọn
- KHÔNG hỏi người dùng muốn xem phim nào, ở rạp nào hay chọn loại ghế nào
- KHÔNG đặt câu hỏi thêm sau khi hướng dẫn đặt vé
- Hướng dẫn người dùng truy cập trang web chính thức của B Cinemas để bắt đầu đặt vé
- Giải thích rõ các bước: Vào trang chủ, xem danh sách phim, chọn chi tiết phim, chọn suất chiếu ở phần dưới trang chi tiết, chọn ghế, chọn combo/mã giảm giá, thanh toán
- Không kết thúc hướng dẫn đặt vé bằng câu hỏi

Khi được hỏi về chính sách vé:
- Luôn nhấn mạnh rằng vé ĐÃ MUA KHÔNG THỂ đổi hoặc trả lại trong mọi trường hợp
- Hướng dẫn khách hàng kiểm tra kỹ thông tin trước khi thanh toán
- Nếu khách hàng có khiếu nại hoặc vấn đề, hướng dẫn họ liên hệ qua số hotline: 0828477808
- Thông báo rõ ràng về thời gian hỗ trợ (8:00 - 22:00 tất cả các ngày trong tuần)
- Nhấn mạnh rằng vé chỉ có giá trị cho đúng suất chiếu đã đặt
- Trả lời ngắn gọn, rõ ràng và không đặt câu hỏi thêm khi giải thích về chính sách vé

Hãy trả lời ngắn gọn, cởi mở và hữu ích dựa trên thông tin đã cung cấp ở trên.
Nếu được hỏi về nội dung không liên quan đến phim hoặc rạp, hãy nhẹ nhàng hướng người dùng quay lại chủ đề.
Trả lời bằng tiếng Việt thuần túy, tránh sử dụng từ ngữ tiếng Anh không cần thiết.
Khi người dùng hỏi về cách đặt vé, trả lời trực tiếp chỉ với các bước cần thực hiện, không đặt câu hỏi thêm.
Trong các trường hợp khác, kết thúc câu trả lời với một câu hỏi thăm dò nhu cầu của khách hàng để thể hiện sự nhiệt tình và sẵn sàng tư vấn.
QUAN TRỌNG NHẤT: Khi hướng dẫn đặt vé, chỉ liệt kê các bước cần thực hiện. Trong các chủ đề khác, đặt câu hỏi thân thiện để tư vấn khách hàng nhiệt tình.
  
Người dùng: ${currentMessage}`;
};

// Hàm tạo thông tin giá vé cho prompt
const createTicketPriceInfo = async (movieData) => {
  let ticketPriceInfo = "THÔNG TIN GIÁ VÉ:\n";
  
  try {
    // Lấy mẫu showtime từ 3 phim đầu tiên
    const showTimeSamples = await getShowtimeSamplesFromMovies(movieData.slice(0, 3));
    
    // Nếu có mẫu, hiển thị thông tin chi tiết
    if (showTimeSamples.length > 0) {
      ticketPriceInfo += "Giá vé phụ thuộc vào nhiều yếu tố như rạp chiếu, thời gian, loại ghế. Dưới đây là một số ví dụ về giá vé:\n\n";
      
      // Lấy giá vé cho từng mẫu suất chiếu
      for (const sample of showTimeSamples) {
        const priceInfo = await getShowtimePrice(sample.id);
        if (!priceInfo.success) continue;
        
        // Format thời gian hiển thị
        const timeDisplay = formatShowtimeTime(sample, priceInfo);
        
        // Thêm thông tin chi tiết về giá vé
        ticketPriceInfo += `- ${priceInfo.showtime.movie} tại ${priceInfo.showtime.cinema} (${priceInfo.showtime.room}), ${timeDisplay}:\n`;
        
        // Hiển thị giá vé theo từng loại ghế
        if (priceInfo.seat_prices && priceInfo.seat_prices.length > 0) {
          priceInfo.seat_prices.forEach(seatPrice => {
            const formattedPrice = Number(seatPrice.price).toLocaleString('vi-VN');
            ticketPriceInfo += `  + ${seatPrice.type}: ${formattedPrice} đồng\n`;
          });
        } else {
          const formattedBasePrice = Number(priceInfo.base_price).toLocaleString('vi-VN');
          ticketPriceInfo += `  + Giá cơ bản: ${formattedBasePrice} đồng\n`;
        }
        
        ticketPriceInfo += "\n";
      }
    } else {
      // Thông tin tổng quát nếu không có mẫu cụ thể
      ticketPriceInfo += "Giá vé phụ thuộc vào rạp chiếu, thời gian, và loại ghế. Hiện tại chưa có thông tin chi tiết về giá vé cho các suất chiếu cụ thể.\n";
      ticketPriceInfo += "Thông thường, giá vé dao động từ 50.000 đồng đến 150.000 đồng tùy theo suất chiếu và rạp.\n";
    }
    
    // Thêm lưu ý chung về giá vé
    ticketPriceInfo += "\nLưu ý: Giá vé có thể thay đổi theo thời gian và chương trình khuyến mãi hiện hành. Vui lòng kiểm tra trên website chính thức để biết giá chính xác nhất.\n";
  } catch (error) {
    console.error("Error creating ticket price info:", error);
    ticketPriceInfo += "Giá vé phụ thuộc vào rạp chiếu, thời gian, và loại ghế. Vui lòng kiểm tra trên website chính thức để biết giá chính xác nhất.\n";
  }
  
  return ticketPriceInfo;
};

// Lấy mẫu suất chiếu từ danh sách phim
const getShowtimeSamplesFromMovies = async (movies) => {
  const showTimeSamples = [];

  for (const movie of movies) {
    try {
      const showtimeResult = await getShowtimesByMovieIdForBoxchat(movie.id);

      if (showtimeResult?.status === 200 && showtimeResult.data?.length > 0) {
        const dateGroup = showtimeResult.data[0]; // Ngày sớm nhất
        const { date, day, cinemas } = dateGroup;

        if (cinemas?.length > 0) {
          const cinema = cinemas[0]; // Rạp đầu tiên
          const showtimes = cinema.showtimes;

          if (showtimes?.length > 0) {
            const showtime = showtimes[0]; // Suất chiếu đầu tiên

            showTimeSamples.push({
              id: showtime.id,
              movie: movie.name,
              cinema: cinema.cinema_name,
              date: date,
              day: day,
              time: showtime.time,
              room: showtime.room_name,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error sampling showtimes for movie ${movie.id}:`, error.message);
    }
  }

  return showTimeSamples;
};


// Format thời gian hiển thị cho suất chiếu
const formatShowtimeTime = (sample, priceInfo) => {
  let timeDisplay = sample.time; // Mặc định sử dụng thời gian từ sample
  
  // Nếu có dữ liệu start_time từ API, sử dụng nó thay thế
  if (priceInfo.showtime?.start_time) {
    const startTime = priceInfo.showtime.start_time;
    if (startTime.dayOfWeek && startTime.date && startTime.time) {
      timeDisplay = `${startTime.date} (${startTime.dayOfWeek}), ${startTime.time}`;
    }
  }
  
  return timeDisplay;
};
