const { resErrors, resData } = require("../common/common");
const { getAllCinemas } = require("../../service/cinemaService");
const { getAllMovies } = require("../../service/movieSevice");
const { getAllRoom } = require("../../service/roomService");
const { getAllSeat } = require("../../service/seatService");
const { getAllCombos } = require("../../service/comboService");
const { getAllSeatType } = require("../../service/seatTypeService");
const { getAllPriceSettingByBranchId } = require("../../service/priceSettingService");
const { getAllShowtime, getShowtimeById, getShowtimesByMovieId } = require("../../service/showtimeService");
const { Cinema } = require("../../models");

// Khai báo biến toàn cục để lưu cache dữ liệu loại ghế
let seatTypesCache = null;
// Cache cho dữ liệu giá vé
let priceSettingsCache = {};

// Hàm lấy dữ liệu giá vé dựa trên branch_id
async function getPriceSettingByBranchId(branch_id) {
  try {
    // Nếu đã có cache thì sử dụng cache
    if (priceSettingsCache[branch_id]) {
      return priceSettingsCache[branch_id];
    }
    
    // Nếu chưa có cache thì lấy từ DB và lưu vào cache
    const priceSetting = await getAllPriceSettingByBranchId(branch_id);
    
    if (!priceSetting) {
      return {
        base_ticket_price: 90000,
        weekend_ticket_price: 110000,
        holiday_ticket_price: 130000
      };
    }
    
    // Lưu vào cache
    priceSettingsCache[branch_id] = {
      base_ticket_price: Number(priceSetting.base_ticket_price) || 90000,
      weekend_ticket_price: Number(priceSetting.weekend_ticket_price) || 110000,
      holiday_ticket_price: Number(priceSetting.holiday_ticket_price) || 130000
    };
    
    return priceSettingsCache[branch_id];
  } catch (error) {
    console.error(`Error fetching price setting for branch ${branch_id}:`, error.message);
    // Trả về giá mặc định nếu có lỗi
    return {
      base_ticket_price: 90000,
      weekend_ticket_price: 110000,
      holiday_ticket_price: 130000
    };
  }
}

// Hàm helper để lấy thông tin loại ghế
async function getSeatTypesData() {
  try {
    // Nếu đã có cache thì sử dụng cache
    if (seatTypesCache) {
      return seatTypesCache;
    }
    
    // Nếu chưa có cache thì lấy từ DB và lưu vào cache
    const seatTypes = await getAllSeatType();
    
    // Chuyển đổi dữ liệu và lưu cache
    seatTypesCache = seatTypes.map(type => ({
      id: type.id,
      type: type.type,
      color: type.color,
      price_offset: Number(type.price_offset) || 0,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
      deletedAt: type.deletedAt
    }));
    
    return seatTypesCache;
  } catch (error) {
    console.error("Error fetching seat types data:", error.message);
    throw error;
  }
}

// Hàm tính toán giá cơ bản dựa trên price_offset và branch_id
async function calculateBasePrice(priceOffset, room_id) {
  try {
    // Tìm cinema_id từ room_id để lấy branch_id
    const room = await getAllRoom(room_id);
    if (!room || !room.rooms || room.rooms.length === 0) {
      throw new Error(`Room with ID ${room_id} not found`);
    }
    
    const cinema_id = room.rooms[0].cinema_id;
    
    // Lấy cinema để tìm branch_id
    const cinema = await Cinema.findByPk(cinema_id);
    if (!cinema) {
      throw new Error(`Cinema with ID ${cinema_id} not found`);
    }
    
    const branch_id = cinema.branch_id;
    
    // Lấy cài đặt giá từ branch_id
    const priceSetting = await getPriceSettingByBranchId(branch_id);
    
    // Kiểm tra xem ngày hiện tại có phải là cuối tuần hay không
    const today = new Date();
    const isWeekend = today.getDay() === 0 || today.getDay() === 6; // 0 là Chủ nhật, 6 là Thứ 7
    
    // Tính toán giá vé dựa trên ngày và thiết lập giá
    let basePrice;
    if (isWeekend) {
      basePrice = {
        min: priceSetting.weekend_ticket_price,
        max: priceSetting.weekend_ticket_price + 30000
      };
    } else {
      basePrice = {
        min: priceSetting.base_ticket_price,
        max: priceSetting.base_ticket_price + 30000
      };
    }
    
    // Áp dụng price_offset của loại ghế
    return {
      min: basePrice.min + priceOffset,
      max: basePrice.max + priceOffset
    };
  } catch (error) {
    console.error("Error calculating base price:", error.message);
    // Trả về giá mặc định nếu có lỗi
    return {
      min: 90000 + priceOffset,
      max: 120000 + priceOffset
    };
  }
}

// Hàm helper để lấy thông tin về loại ghế theo ID
async function getSeatTypeById(typeId) {
  const seatTypes = await getSeatTypesData();
  const seatType = seatTypes.find(type => type.id === typeId);
  
  if (seatType) {
    return {
      id: seatType.id,
      type: seatType.type,
      color: seatType.color,
      price_offset: seatType.price_offset,
      createdAt: seatType.createdAt,
      updatedAt: seatType.updatedAt,
      deletedAt: seatType.deletedAt
    };
  }
  
  throw new Error(`Seat type with ID ${typeId} not found`);
}

// Hàm tạo mô tả cho loại ghế
async function getSeatTypeDescription(typeId, typeName = '', room_id) {
  try {
    const seatTypes = await getSeatTypesData();
    const seatType = seatTypes.find(type => type.id === typeId || type.type === typeName);
    
    if (seatType) {
      // Lấy giá cơ bản dựa trên room_id
      const basePrice = await calculateBasePrice(seatType.price_offset, room_id);
      return `${seatType.type} - Giá từ ${basePrice.min.toLocaleString('vi-VN')}đ đến ${basePrice.max.toLocaleString('vi-VN')}đ`;
    }
    
    return 'Loại ghế không xác định';
  } catch (error) {
    console.error("Error generating seat type description:", error.message);
    return 'Không thể lấy thông tin loại ghế';
  }
}

class chatbotTestController {
  static async index(req, res) {
    try {
      const cinemas = await getAllCinemas();

      const cinemaList = cinemas.map((cinema) => ({
        id: cinema.dataValues.id,
        name: cinema.dataValues.name,
        city: cinema.dataValues.city,
        district: cinema.dataValues.district,
        address: `${cinema.dataValues.street}, ${cinema.dataValues.ward}, ${cinema.dataValues.district}, ${cinema.dataValues.city}`,
        branchId: cinema.dataValues.branch_id,
      }));

      res.json({ message: "Get cinemas successfully", cinemas: cinemaList });
    } catch (error) {
      console.error("Error fetching cinemas:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async index2(req, res) {
    try {
      const movies = await getAllMovies();

      const movieList = movies.map((movie) => ({
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
          ? movie.MovieGenres.map((g) => ({ id: g.Genre.id, name: g.Genre.name }))
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

      res.json({ message: "Movies retrieved successfully", movies: movieList });
    } catch (error) {
      console.error("Error fetching movies:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async index3(req, res) {
    try {
      const rooms = await getAllRoom();

      const roomList = rooms.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        cinemaId: room.cinema_id,
        rowsCount: room.rows_count,
        columnsCount: room.columns_count,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        deletedAt: room.deletedAt,
        cinema: room.Cinema ? { name: room.Cinema.name } : null,
      }));

      res.json({ message: "Get all rooms successfully", data: roomList });
    } catch (error) {
      console.error("Error fetching rooms:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async index4(req, res) {
    try {
      const room_id = req.params.id;
      const seats = await getAllSeat(room_id);
      
      // Lấy thông tin loại ghế từ DB
      const seatTypes = await getSeatTypesData();
      
      // Tạo map để truy cập nhanh thông tin loại ghế
      const seatTypeMap = {};
      seatTypes.forEach(type => {
        seatTypeMap[type.id] = type;
      });

      const seatList = await Promise.all(seats.map(async (seat) => {
        // Lấy thông tin loại ghế chi tiết
        const typeInfo = await getSeatTypeById(seat.type_id);
        
        // Tính toán giá dựa trên loại ghế và phòng
        const basePrice = await calculateBasePrice(typeInfo.price_offset, room_id);
        
        return {
          id: seat.id,
          roomId: seat.room_id,
          seatNumber: seat.seat_number,
          seatRow: seat.seat_row,
          isEnabled: seat.is_enabled,
          typeId: seat.type_id,
          status: seat.status || 'Available',
          type: {
            ...typeInfo,
            price: {
              min: basePrice.min,
              max: basePrice.max,
              description: `Giá từ ${basePrice.min.toLocaleString('vi-VN')}đ đến ${basePrice.max.toLocaleString('vi-VN')}đ`
            }
          },
          createdAt: seat.createdAt,
          updatedAt: seat.updatedAt,
          deletedAt: seat.deletedAt,
        };
      }));

      // Tạo thông tin tổng hợp về ghế
      const seatSummary = {
        totalSeats: seatList.length,
        availableSeats: seatList.filter(seat => seat.status === 'Available').length,
        reservedSeats: seatList.filter(seat => seat.status === 'Reserved').length,
        bookedSeats: seatList.filter(seat => seat.status === 'Booked').length,
        unavailableSeats: seatList.filter(seat => seat.status === 'Unavailable').length,
        seatTypes: {}
      };
      
      // Đếm số lượng và tính giá cho mỗi loại ghế
      for (const type of seatTypes) {
        const seatsOfType = seatList.filter(seat => seat.typeId === type.id);
        const basePrice = await calculateBasePrice(type.price_offset, room_id);
        
        seatSummary.seatTypes[type.type] = {
          count: seatsOfType.length,
          price: {
            min: basePrice.min,
            max: basePrice.max,
            description: `Giá từ ${basePrice.min.toLocaleString('vi-VN')}đ đến ${basePrice.max.toLocaleString('vi-VN')}đ`
          }
        };
      }

      res.json({ 
        message: "Get seats successfully", 
        seats: seatList,
        summary: seatSummary
      });
    } catch (error) {
      console.error("Error fetching seats:", error);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async getCombos(req, res) {
    try {
      const combos = await getAllCombos();
      
      const comboList = combos.map(combo => {
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
        
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        
        return {
          id: combo.id,
          name: combo.name,
          price: combo.price,
          profilePicture: combo.profile_picture,
          totalItems: totalItems,
          items: items,
          savings: calculateSavings(combo.price, items),
          createdAt: combo.createdAt,
          updatedAt: combo.updatedAt
        };
      });
      
      res.json({ 
        message: "Get combos successfully", 
        combos: comboList 
      });
    } catch (error) {
      console.error("Error fetching combos:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }
  
  static async getComboDetail(req, res) {
    try {
      const combo_id = req.params.id;
      const combos = await getAllCombos();
      
      const combo = combos.find(c => c.id == combo_id);
      
      if (!combo) {
        return resErrors(res, 404, "Combo not found");
      }
      
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
      
      const comboDetail = {
        id: combo.id,
        name: combo.name,
        price: combo.price,
        profilePicture: combo.profile_picture,
        items: items,
        savings: calculateSavings(combo.price, items),
        createdAt: combo.createdAt,
        updatedAt: combo.updatedAt
      };
      
      res.json({ 
        message: "Get combo detail successfully", 
        combo: comboDetail 
      });
    } catch (error) {
      console.error("Error fetching combo detail:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async getSeatTypes(req, res) {
    try {
      // Lấy dữ liệu loại ghế từ database
      const seatTypes = await getSeatTypesData();
      
      // Chỉ lấy các trường cần thiết
      const seatTypesList = seatTypes.map(type => {
        return {
          id: type.id,
          type: type.type,
          color: type.color,
          price_offset: Number(type.price_offset)
        };
      });

      res.json({
        message: "Get seat types successfully",
        seatTypes: seatTypesList
      });
    } catch (error) {
      console.error("Error fetching seat types:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async getPriceSettings(req, res) {
    try {
      const branch_id = req.params.id;
      
      // Lấy thông tin giá vé từ database
      const priceSetting = await getAllPriceSettingByBranchId(branch_id);
      
      if (!priceSetting) {
        return resErrors(res, 404, "Price settings not found for this branch");
      }

      // Format dữ liệu trả về
      const priceSettings = {
        id: priceSetting.id,
        branch_id: priceSetting.branch_id,
        prices: {
          base: {
            amount: Number(priceSetting.base_ticket_price),
            formatted: priceSetting.base_ticket_price.toLocaleString('vi-VN') + 'đ',
            description: 'Giá vé ngày thường'
          },
          weekend: {
            amount: Number(priceSetting.weekend_ticket_price),
            formatted: priceSetting.weekend_ticket_price.toLocaleString('vi-VN') + 'đ',
            description: 'Giá vé cuối tuần'
          },
          holiday: {
            amount: Number(priceSetting.holiday_ticket_price),
            formatted: priceSetting.holiday_ticket_price.toLocaleString('vi-VN') + 'đ',
            description: 'Giá vé ngày lễ'
          }
        },
        createdAt: priceSetting.createdAt,
        updatedAt: priceSetting.updatedAt,
        deletedAt: priceSetting.deletedAt
      };

      res.json({
        message: "Get price settings successfully",
        priceSettings: priceSettings
      });
    } catch (error) {
      console.error("Error fetching price settings:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async getShowtimes(req, res) {
    try {
      const branch_id = req.query.branch_id; // Có thể lọc theo branch_id hoặc không
      
      let result;
      if (branch_id) {
        // Nếu có branch_id, gọi API lấy showtime theo branch
        result = await getAllShowtime(branch_id);
      } else {
        // Nếu không có branch_id, lấy tất cả showtime
        result = await getAllShowtime();
      }
      
      if (!result.success) {
        return resErrors(res, result.status, result.message);
      }
      
      // Định dạng lại dữ liệu trả về cho dễ đọc
      const formattedShowtimes = result.showtimes.map(showtime => {
        const startTime = new Date(showtime.start_time);
        const endTime = new Date(showtime.end_time);
        
        return {
          id: showtime.id,
          movie: showtime.Movie ? {
            id: showtime.Movie.id,
            name: showtime.Movie.name,
            poster: showtime.Movie.poster,
            duration: showtime.Movie.duration,
            ageRating: showtime.Movie.age_rating
          } : null,
          room: showtime.Room ? {
            id: showtime.Room.id,
            name: showtime.Room.name,
            cinema: showtime.Room.Cinema ? {
              id: showtime.Room.Cinema.id,
              name: showtime.Room.Cinema.name
            } : null
          } : null,
          dateTime: {
            date: startTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            dayOfWeek: startTime.toLocaleDateString('vi-VN', { weekday: 'long' }),
            startTime: startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            endTime: endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          },
          basePrice: Number(showtime.base_price),
          status: showtime.status
        };
      });
      
      res.json({
        message: "Get showtimes successfully",
        showtimes: formattedShowtimes
      });
    } catch (error) {
      console.error("Error fetching showtimes:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }
  
  static async getShowtimeDetail(req, res) {
    try {
      const showtime_id = req.params.id;
      
      const result = await getShowtimeById(showtime_id);
      
      if (result.status !== 200) {
        return resErrors(res, result.status, result.message);
      }
      
      res.json({
        message: "Get showtime detail successfully",
        showtime: result.showtime
      });
    } catch (error) {
      console.error("Error fetching showtime detail:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async getShowtimesByMovie(req, res) {
    try {
      const movie_id = req.params.id;
      
      if (!movie_id) {
        return resErrors(res, 400, "Movie ID is required");
      }
      
      const result = await getShowtimesByMovieId(movie_id);
      
      if (result.status !== 200) {
        return resErrors(res, result.status, result.message);
      }
      
      res.json({
        message: "Get showtimes for movie successfully",
        data: result.data
      });
    } catch (error) {
      console.error("Error fetching showtimes for movie:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }
}

function calculateSavings(comboPrice, items) {
  const totalIndividualPrice = items.reduce((sum, item) => {
    const itemPrice = item.product ? item.product.price * item.quantity : 0;
    return sum + itemPrice;
  }, 0);
  
  const savings = totalIndividualPrice - comboPrice;
  
  return {
    individualTotal: totalIndividualPrice,
    savings: savings,
    savingsPercent: totalIndividualPrice > 0 ? Math.round((savings / totalIndividualPrice) * 100) : 0
  };
}

module.exports = chatbotTestController;
