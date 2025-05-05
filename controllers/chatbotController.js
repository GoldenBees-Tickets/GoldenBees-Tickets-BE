const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getAllCinemasForBoxchat } = require("../service/cinemaService");
const { getAllMoviesWithValidShowtimes } = require("../service/movieSevice");
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

    // Lấy dữ liệu phim từ database - sử dụng getAllMoviesWithValidShowtimes thay vì getAllMoviesForBoxchat
    const movies = await getAllMoviesWithValidShowtimes();

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
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash"
    });

    // Tạo chat từ lịch sử
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.95,
        topK: 40,
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
    let response = result.response.text();
    
    // Làm sạch định dạng Markdown từ phản hồi
    response = cleanMarkdownFormatting(response);

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

// Hàm trích xuất danh sách thể loại phim từ movieData
const extractGenres = (movieData) => {
  // Sử dụng Set để lưu trữ thể loại phim không trùng lặp
  const genreSet = new Set();
  
  // Lặp qua từng bộ phim để lấy thể loại
  movieData.forEach(movie => {
    if (movie.genres && movie.genres.length > 0) {
      movie.genres.forEach(genre => {
        if (genre.name) {
          genreSet.add(genre.name);
        }
      });
    }
  });
  
  // Chuyển Set thành mảng và sắp xếp theo alphabet
  return Array.from(genreSet).sort();
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

  // Trích xuất danh sách thể loại phim
  const genresList = extractGenres(movieData);
  const genresInfo = genresList.length > 0 
    ? `DANH SÁCH THỂ LOẠI PHIM HIỆN CÓ:\n${genresList.map(genre => `- ${genre}`).join('\n')}\n\n` 
    : "";

  // Tạo thông tin giá vé
  const ticketPriceInfo = await createTicketPriceInfo(movieData);

  // Tạo mảng promises để lấy thông tin suất chiếu cho từng phim
  const movieInfoPromises = movieData.map(async (movie) => {
    const genres = movie.genres.map((g) => g.name).join(", ");
    const actors = movie.actors.map((a) => a.name).join(", ");
    
    // Lấy thông tin suất chiếu cho phim này
    let showtimeInfo = "";
    let bookingLinks = "";
    try {
      const showtimeResult = await getShowtimesByMovieIdForBoxchat(movie.id);
      console.log(showtimeResult);  
      if (showtimeResult && showtimeResult.status === 200 && showtimeResult.data && showtimeResult.data.length > 0) {
        showtimeInfo = "\nLịch chiếu:\n";
        bookingLinks = "\nĐường link đặt vé:\n";
        
        showtimeResult.data.forEach(dateGroup => {
          showtimeInfo += `- Ngày ${dateGroup.date} (${dateGroup.day}):\n`;
          
          dateGroup.cinemas.forEach(cinema => {
            showtimeInfo += `  + ${cinema.cinema_name}:\n`;
            
            cinema.showtimes.forEach(showtime => {
              // Chuyển đổi thời gian từ "hh:mm" sang "hh giờ mm"
              const timeParts = showtime.time.split(':');
              const formattedTime = `${timeParts[0]} giờ ${timeParts[1]}`;
              showtimeInfo += `    * ${formattedTime} - ${showtime.room_name}\n`;
              
              // Tạo link đặt vé cụ thể
              const bookingLink = `http://localhost:5173/booking/${showtime.id}?room_id=${showtime.room_id}`;
              bookingLinks += `- Đặt vé ${movie.name} - ${cinema.cinema_name} - ${showtime.room_name} - ${dateGroup.date} ${showtime.time}: ${bookingLink}\n`;
            });
          });
        });
        
        // Thêm bookingLinks vào showtimeInfo
        showtimeInfo += bookingLinks;
      } else {
        // Phim không có suất chiếu sẽ bị bỏ qua trong danh sách phim
        return null;
      }
    } catch (error) {
      console.error(`Error fetching showtimes for movie ${movie.id}:`, error.message);
      // Phim có lỗi lấy suất chiếu sẽ bị bỏ qua
      return null;
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

  // Chờ tất cả các promise hoàn thành và lọc bỏ các phim null (không có suất chiếu)
  const resolvedMovieInfo = await Promise.all(movieInfoPromises);
  const validMovieInfo = resolvedMovieInfo.filter(info => info !== null);
  const movieInfo = validMovieInfo.join("\n");

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

  // Thêm thông tin về link đặt vé
  const bookingLinkInfo = `
QUY TRÌNH ĐẶT VÉ TRỰC TIẾP:
- Khi người dùng muốn đặt vé, hãy hỏi họ muốn xem phim gì, ngày nào, và tại rạp nào
- Sau khi có đủ thông tin, cung cấp link đặt vé trực tiếp để họ nhấp vào (ví dụ: http://localhost:5173/booking/73?room_id=2)
- Không cần hướng dẫn chi tiết về quy trình đặt vé theo từng bước, chỉ cần cung cấp link đặt vé phù hợp
- Khi người dùng đã cung cấp thông tin phim, rạp, hoặc ngày xem, hãy đề xuất các suất chiếu phù hợp từ danh sách có sẵn
  `;

  return `${conversationContext}Bạn là Minh, trợ lý AI của trang web đặt vé xem phim B Cinemas. 

${genresInfo}THÔNG TIN PHIM ĐANG CHIẾU:
${movieInfo}

THÔNG TIN RẠP CHIẾU PHIM:
${cinemaInfo}

${roomInfo}

${seatInfo}

${comboInfo}

${ticketPriceInfo}

${ticketPolicies}

${bookingLinkInfo}

HƯỚNG DẪN ĐẶT VÉ:
1. Truy cập trang chủ B Cinemas
2. Xem danh sách phim đang chiếu 
3. Chọn phim và suất chiếu phù hợp
4. Chọn ghế và thanh toán
5. Nhận mã QR hoặc vé điện tử qua email

HƯỚNG DẪN VỀ CÁCH NÓI CHUYỆN:
1. Xưng "mình" hoặc "tôi" và gọi người dùng là "bạn".
2. Giọng điệu tự nhiên, thân thiện như người bạn.
3. Trả lời ngắn gọn, súc tích, thông tin chính xác.
4. Sử dụng tiếng Việt thuần túy, không từ ngữ tiếng Anh không cần thiết.
5. Khi nói về giá cả, luôn sử dụng "đồng" thay vì "đ" hoặc các ký hiệu.
6. TUYỆT ĐỐI KHÔNG dùng ký tự đặc biệt để định dạng (**, ##, ==).
7. Khi chia sẻ URL, chỉ đưa URL đơn thuần, không đặt trong ngoặc.
8. Khi liệt kê, chỉ dùng dấu gạch đầu dòng (-) hoặc số (1., 2.).
9. Viết đầy đủ tiền tệ (50.000 đồng), không viết tắt (50K).
10. Đặt câu hỏi mở ngắn gọn ở cuối trả lời.

QUY TRÌNH TƯ VẤN ĐẶT VÉ:
1. Hỏi phim: "Bạn muốn xem phim gì?"
2. Hỏi ngày: "Bạn muốn xem vào ngày nào?"
3. Hỏi rạp: "Bạn muốn xem tại rạp nào?"
4. Cung cấp 1-3 link đặt vé phù hợp

NGUYÊN TẮC TRẢ LỜI:
- Trả lời ngắn gọn, chỉ 2-3 câu nếu có thể
- Tập trung vào thông tin cần thiết, bỏ phần thừa
- Không giới thiệu, không tóm tắt, không giải thích lại câu hỏi
- Không sử dụng kí tự đặc biệt để định dạng
- Câu hỏi mở ở cuối nên ngắn gọn (1 câu)

Người dùng: ${currentMessage}`;
};

// Hàm tạo thông tin giá vé cho prompt
const createTicketPriceInfo = async (movieData) => {
  let ticketPriceInfo = "THÔNG TIN GIÁ VÉ:\n";
  
  try {
    // Chỉ sử dụng tối đa 3 phim đã lọc (lúc này chắc chắn có xuất chiếu hợp lệ)
    const moviesForSamples = movieData.slice(0, 3);
    
    // Lấy mẫu showtime từ phim
    const showTimeSamples = await getShowtimeSamplesFromMovies(moviesForSamples);
    
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

  // Chỉ lấy tối đa 3 phim để lấy mẫu
  const sampleSize = Math.min(3, movies.length);
  for (let i = 0; i < sampleSize; i++) {
    const movie = movies[i];
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
      // Bỏ qua phim này nếu có lỗi và tiếp tục với phim khác
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

// Hàm loại bỏ định dạng Markdown khỏi phản hồi
const cleanMarkdownFormatting = (text) => {
  if (!text) return "";
  
  // Loại bỏ các dấu ** (bold) - bao gồm cả khi có dấu : theo sau
  let cleaned = text.replace(/\*\*(.*?)\*\*(:)?/g, "$1$2");
  
  // Loại bỏ các dấu ** ở cuối câu
  cleaned = cleaned.replace(/\*\*(.*?)\*\*([\.,:;\?!])/g, "$1$2");
  
  // Loại bỏ các dấu ** còn lại
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, "$1");
  
  // Loại bỏ các dấu * (italic)
  cleaned = cleaned.replace(/\*(.*?)\*/g, "$1");
  
  // Loại bỏ các dấu # (heading)
  cleaned = cleaned.replace(/^#+\s+/gm, "");
  
  // Loại bỏ các dấu ` (code)
  cleaned = cleaned.replace(/`(.*?)`/g, "$1");
  
  // Loại bỏ dấu gạch chân __ hoặc _ (underscore)
  cleaned = cleaned.replace(/__(.*?)__/g, "$1");
  cleaned = cleaned.replace(/_(.*?)_/g, "$1");
  
  // Loại bỏ dấu ~~ (strikethrough)
  cleaned = cleaned.replace(/~~(.*?)~~/g, "$1");
  
  // Các định dạng khác cần loại bỏ
  cleaned = cleaned.replace(/==(.*?)==/g, "$1"); // Highlight
  
  // Kiểm tra lại nếu còn sót dấu **
  cleaned = cleaned.replace(/\*\*/g, "");
  
  return cleaned;
};
