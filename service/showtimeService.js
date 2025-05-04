const { Op, Sequelize } = require("sequelize");
const { Showtime, Movie, Room, Cinema, Branch } = require("../models");
const moment = require("moment-timezone");

// Hàm lấy showtime theo branch_id
const getShowtimeByBranchId = async (options) => {
    try {
        const { page, limit, search, status, sort_order, branch_id } = options;
        
        // Tính offset cho phân trang
        const offset = (page - 1) * limit;
        
        // Xây dựng điều kiện where
        let whereCondition = {
            "$Room.Cinema.branch_id$": branch_id
        };
        let movieWhereCondition = {};
        
        // Thêm điều kiện search theo tên phim
        if (search) {
            movieWhereCondition.name = {
                [Op.like]: `%${search}%`
            };
        }
        
        // Thêm điều kiện lọc theo trạng thái
        if (status && status !== "all") {
            const now = moment();
            const currentDate = now.format("YYYY-MM-DD");
            const currentTime = now.format("HH:mm:ss");
            
            switch (status) {
                case "upcoming":
                    // Sắp chiếu: ngày lớn hơn hoặc bằng hôm nay nhưng chưa tới giờ chiếu
                    whereCondition[Op.or] = [
                        { show_date: { [Op.gt]: currentDate } },
                        {
                            [Op.and]: [
                                { show_date: currentDate },
                                { start_time: { [Op.gt]: currentTime } }
                            ]
                        }
                    ];
                    break;
                case "showing":
                    // Đang chiếu: cùng ngày và thời gian hiện tại nằm trong khoảng start_time và end_time
                    whereCondition[Op.and] = [
                        { show_date: currentDate },
                        { start_time: { [Op.lte]: currentTime } },
                        { end_time: { [Op.gte]: currentTime } }
                    ];
                    break;
                case "past":
                    // Đã chiếu: ngày nhỏ hơn hôm nay hoặc ngày hôm nay nhưng đã qua giờ kết thúc
                    whereCondition[Op.or] = [
                        { show_date: { [Op.lt]: currentDate } },
                        {
                            [Op.and]: [
                                { show_date: currentDate },
                                { end_time: { [Op.lt]: currentTime } }
                            ]
                        }
                    ];
                    break;
            }
        }
        
        // Thực hiện truy vấn với phân trang và lọc
        const { count, rows } = await Showtime.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: Movie,
                    where: movieWhereCondition,
                    attributes: ["id", "name", "poster", "duration"]
                },
                {
                    model: Room,
                    include: [
                        {
                            model: Cinema,
                            include: [
                                {
                                    model: Branch,
                                    attributes: ["id", "name", "city"]
                                }
                            ],
                            attributes: ["id", "name", "city", "branch_id"]
                        }
                    ],
                    attributes: ["id", "name", "cinema_id"]
                }
            ],
            order: [["show_date", sort_order.toUpperCase()], ["start_time", sort_order.toUpperCase()]],
            offset,
            limit,
            distinct: true
        });
        
        // Tính toán thông tin phân trang
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        return {
            showtimes: rows,
            pagination: {
                total: count,
                totalPages,
                currentPage: page,
                hasNextPage,
                hasPrevPage,
                limit
            }
        };
    } catch (error) {
        console.error("Error in getShowtimeByBranchId service:", error);
        throw error;
    }
};

// Hàm lấy tất cả showtime không lọc theo branch
const getAllShowtimes = async (options) => {
    try {
        const { page, limit, search, status, sort_order } = options;
        
        // Tính offset cho phân trang
        const offset = (page - 1) * limit;
        
        // Xây dựng điều kiện where
        let whereCondition = {};
        let movieWhereCondition = {};
        
        // Thêm điều kiện search theo tên phim
        if (search) {
            movieWhereCondition.name = {
                [Op.like]: `%${search}%`
            };
        }
        
        // Thêm điều kiện lọc theo trạng thái
        if (status && status !== "all") {
            const now = moment();
            const currentDate = now.format("YYYY-MM-DD");
            const currentTime = now.format("HH:mm:ss");
            
            switch (status) {
                case "upcoming":
                    // Sắp chiếu: ngày lớn hơn hoặc bằng hôm nay nhưng chưa tới giờ chiếu
                    whereCondition[Op.or] = [
                        { show_date: { [Op.gt]: currentDate } },
                        {
                            [Op.and]: [
                                { show_date: currentDate },
                                { start_time: { [Op.gt]: currentTime } }
                            ]
                        }
                    ];
                    break;
                case "showing":
                    // Đang chiếu: cùng ngày và thời gian hiện tại nằm trong khoảng start_time và end_time
                    whereCondition[Op.and] = [
                        { show_date: currentDate },
                        { start_time: { [Op.lte]: currentTime } },
                        { end_time: { [Op.gte]: currentTime } }
                    ];
                    break;
                case "past":
                    // Đã chiếu: ngày nhỏ hơn hôm nay hoặc ngày hôm nay nhưng đã qua giờ kết thúc
                    whereCondition[Op.or] = [
                        { show_date: { [Op.lt]: currentDate } },
                        {
                            [Op.and]: [
                                { show_date: currentDate },
                                { end_time: { [Op.lt]: currentTime } }
                            ]
                        }
                    ];
                    break;
            }
        }
        
        // Thực hiện truy vấn với phân trang và lọc
        const { count, rows } = await Showtime.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: Movie,
                    where: movieWhereCondition,
                    attributes: ["id", "name", "poster", "duration"]
                },
                {
                    model: Room,
                    include: [
                        {
                            model: Cinema,
                            include: [
                                {
                                    model: Branch,
                                    attributes: ["id", "name", "city"]
                                }
                            ],
                            attributes: ["id", "name", "city", "branch_id"]
                        }
                    ],
                    attributes: ["id", "name", "cinema_id"]
                }
            ],
            order: [["show_date", sort_order.toUpperCase()], ["start_time", sort_order.toUpperCase()]],
            offset,
            limit,
            distinct: true
        });
        
        // Tính toán thông tin phân trang
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        return {
            showtimes: rows,
            pagination: {
                total: count,
                totalPages,
                currentPage: page,
                hasNextPage,
                hasPrevPage,
                limit
            }
        };
    } catch (error) {
        console.error("Error in getAllShowtimes service:", error);
        throw error;
    }
};

// Hàm cũ để tương thích ngược (gọi đến một trong hai hàm mới tùy thuộc vào tham số)
const getAllShowtime = async (options) => {
    if (options.branch_id && options.branch_id !== "undefined" && options.branch_id !== "null") {    
        return getShowtimeByBranchId(options);
    } else {    
        return getAllShowtimes(options);
    }
};

const getShowtimesByMovieId = async (movie_id, options) => {
    try {
        const { branch_id, cinema_id, current_time } = options;

        let whereCondition = {
            movie_id
        };

        // Thời gian hiện tại chuẩn (theo múi giờ VN)
        const now = moment().tz('Asia/Ho_Chi_Minh');
        const currentDateTime = now.format("YYYY-MM-DD HH:mm:ss");

        if (current_time) {
            // So sánh TIMESTAMP(show_date, start_time) > currentDateTime
            whereCondition = {
                ...whereCondition,
                [Op.and]: Sequelize.literal(`TIMESTAMP(show_date, start_time) > '${currentDateTime}'`)
            };
        }

        // Lọc theo branch/cinema nếu có
        let cinemaWhereCondition = {};
        if (branch_id) cinemaWhereCondition.branch_id = branch_id;
        if (cinema_id) cinemaWhereCondition.id = cinema_id;

        const showtimes = await Showtime.findAll({
            where: whereCondition,
            include: [
                {
                    model: Movie,
                    attributes: ["id", "name", "poster", "duration"]
                },
                {
                    model: Room,
                    include: [
                        {
                            model: Cinema,
                            where: Object.keys(cinemaWhereCondition).length ? cinemaWhereCondition : undefined,
                            include: [
                                {
                                    model: Branch,
                                    attributes: ["id", "name", "city"]
                                }
                            ],
                            attributes: ["id", "name", "city", "branch_id"]
                        }
                    ],
                    attributes: ["id", "name", "cinema_id"]
                }
            ],
            order: [["show_date", "ASC"], ["start_time", "ASC"]]
        });

        // Lọc showtime hợp lệ
        const validShowtimes = showtimes.filter(showtime =>
            showtime.Movie && showtime.Room && showtime.Room.Cinema
        );

        return validShowtimes;
    } catch (error) {
        console.error("Error in getShowtimesByMovieId service:", error);
        throw error;
    }
};

const getShowtimesForUserByMovieId = async (data) => {
    try {                
        let whereCondition = {
            movie_id: data.movie_id
        };
        
        // Lấy thời gian hiện tại và cache
        const now = moment().tz('Asia/Ho_Chi_Minh'); // Sử dụng múi giờ Việt Nam
        const todayStr = now.format("YYYY-MM-DD");
        const currentTime = now.format("HH:mm:ss");
                
        // Thêm điều kiện lọc theo thời gian hiện tại nếu được yêu cầu
        if (now) {
            // Nếu là ngày hiện tại, chỉ lấy các xuất chiếu có thời gian sau giờ hiện tại
            whereCondition[Op.or] = [
                {
                    // Các ngày trong tương lai
                    show_date: {
                        [Op.gt]: todayStr
                    }
                },
                {
                    // Ngày hiện tại nhưng giờ chiếu phải lớn hơn giờ hiện tại
                    [Op.and]: [
                        { show_date: todayStr },
                        { start_time: { [Op.gt]: currentTime } }
                    ]
                }
            ];
        }
                
        const showtimes = await Showtime.findAll({
            where: whereCondition,
            include: [
                {
                    model: Movie,
                    attributes: ["id", "name", "poster", "duration"]
                },
                {
                    model: Room,
                    include: [
                        {
                            model: Cinema,
                            include: [
                                {
                                    model: Branch,
                                    attributes: ["id", "name", "city"]
                                }
                            ],
                            attributes: ["id", "name", "city", "branch_id"]
                        }
                    ],
                    attributes: ["id", "name", "cinema_id"]
                }
            ],
            order: [["show_date", "ASC"], ["start_time", "ASC"]]
        });
        
        // Lọc bỏ các mục không hợp lệ và sắp xếp theo ngày, giờ
        const validShowtimes = showtimes.filter(showtime => 
            showtime.Movie && showtime.Room && showtime.Room.Cinema
        );
                
        // return validShowtimes;
        return {
            status: 200,
            success: true,
            message: "Lấy lịch chiếu thành công",
            data: validShowtimes, // mảng flat các suất chiếu
          };
    } catch (error) {
        console.error("Error in getShowtimesByMovieId service:", error);
        throw error;
    }
};

const getShowtimesByMovieIdForChat = async (movie_id) => {
    try {
        const now = moment().tz("Asia/Ho_Chi_Minh");
        const todayStr = now.format("YYYY-MM-DD");
        const currentTime = now.format("HH:mm:ss");
                
        // Trước tiên, kiểm tra xem có suất chiếu nào cho phim này không
        const allShowtimes = await Showtime.findAll({
            where: { movie_id },
            order: [["show_date", "ASC"], ["start_time", "ASC"]],
        });
                
        // Sau đó mới áp dụng bộ lọc thời gian
        const showtimes = await Showtime.findAll({
            where: {
                movie_id,
                [Op.or]: [
                    {
                        show_date: {
                            [Op.gt]: todayStr,
                        },
                    },
                    {
                        [Op.and]: [
                            { show_date: todayStr },
                            {
                                start_time: {
                                    [Op.gt]: currentTime,
                                },
                            },
                        ],
                    },
                ],
            },
            include: [
                {
                    model: Movie,
                    attributes: ["id", "name", "poster", "duration"],
                },
                {
                    model: Room,
                    include: [
                        {
                            model: Cinema,
                            include: [
                                {
                                    model: Branch,
                                    attributes: ["id", "name", "city"],
                                },
                            ],
                            attributes: ["id", "name", "city", "branch_id"],
                        },
                    ],
                    attributes: ["id", "name", "cinema_id"],
                },
            ],
            order: [["show_date", "ASC"], ["start_time", "ASC"]],
        });
                
        return showtimes;
    } catch (error) {
        console.error("Error in getShowtimesByMovieIdForChat service:", error);
        throw error;
    }
};

const getShowtimeById = async (id) => {
    try {
        const showtime = await Showtime.findOne({
            where: { id },
            include: [
                {
                    model: Movie,
                    attributes: ["id", "name", "poster", "duration", "age_rating"]
                },
                {
                    model: Room,
                    include: [
                        {
                            model: Cinema,
                            include: [
                                {
                                    model: Branch,
                                    attributes: ["id", "name", "city"]
                                }
                            ],
                            attributes: ["id", "name", "city", "branch_id"]
                        }
                    ],
                    attributes: ["id", "name", "cinema_id"]
                }
            ]
        });
        return showtime;
    } catch (error) {
        console.error("Error in getShowtimeById service:", error);
        throw error;
    }
};

const check_Existing_Showtime = async ({ room_id, show_date, start_time, end_time }) => {
    try {
        const existingShowtime = await Showtime.findOne({
            where: {
                room_id,
                show_date,
                [Op.or]: [
                    {
                        start_time: {
                            [Op.between]: [start_time, end_time]
                        }
                    },
                    {
                        end_time: {
                            [Op.between]: [start_time, end_time]
                        }
                    },
                    {
                        [Op.and]: [
                            {
                                start_time: {
                                    [Op.lte]: start_time
                                }
                            },
                            {
                                end_time: {
                                    [Op.gte]: end_time
                                }
                            }
                        ]
                    }
                ]
            },
            include: [
                {
                    model: Movie,
                    attributes: ["id", "name"]
                },
                {
                    model: Room,
                    attributes: ["id", "name"]
                }
            ]
        });
        
        return existingShowtime;
    } catch (error) {
        console.error("Error in check_Existing_Showtime service:", error);
        throw error;
    }
};

const createShowtime = async (datas) => {
    try {
        const createdShowtimes = await Promise.all(
            datas.map(async (data) => {
                const showtime = await Showtime.create(data);
                return showtime;
            })
        );
        return createdShowtimes;
    } catch (error) {
        console.error("Error in createShowtime service:", error);
        throw error;
    }
};

const updateShowtime = async (id, updateData) => {
    try {
        const showtime = await Showtime.findByPk(id);
        if (!showtime) {
            throw new Error("Không tìm thấy suất chiếu");
        }
        
        await showtime.update(updateData);
        return showtime;
    } catch (error) {
        console.error("Error in updateShowtime service:", error);
        throw error;
    }
};


const getShowtimeByBranchIdForBoxchat = async (branch_id) => {  
    try {
      const showtimes = await Showtime.findAll({
        include: [
          {
            model: Movie,
          },
          {
            model: Room,
            attributes: ["name"],
            required: true,
            include: [
              {
                model: Cinema,
                attributes: ["name"],
                required: true,
                where: { branch_id },
              },
            ],
          },
        ],
      });
      return { success: true, status: 200, message: "Get showtimes successfully", error: null ,showtimes };
    } catch (error) {
      console.error("Error fetching list of showtimes by branch:", error.message);
      throw error;
    }
  };
  
  // Hàm lấy tất cả showtime không lọc theo branch
  const getAllShowtimesForBoxchat = async () => {
    try {
      const showtimes = await Showtime.findAll({
        include: [
          {
            model: Movie,
          },
          {
            model: Room,
            attributes: ["name"],
            required: true,
            include: [
              {
                model: Cinema,
                attributes: ["name"],
              },
            ],
          },
        ],
      });
      return  { success: true, status: 200, message: "Get showtimes successfully", error: null ,showtimes };
    } catch (error) {
      console.error("Error fetching all showtimes:", error.message);
      throw error;
    }
  };
  
  // Hàm cũ để tương thích ngược (gọi đến một trong hai hàm mới tùy thuộc vào tham số)
  const getAllShowtimeForBoxchat = async (branch_id) => {
    if (branch_id && branch_id !== "undefined" && branch_id !== "null") {    
      return getShowtimeByBranchId(branch_id);
    } else {    
      return getAllShowtimes();
    }
  };

  const getShowtimesByMovieIdForBoxchat = async (movie_id) => {
    try {
      const showtimes = await Showtime.findAll({
        where: { movie_id },
        include: [
          {
            model: Room,
            attributes: ["id", "name", "cinema_id"],
            include: [
              {
                model: Cinema,
                attributes: ["id", "name"], // Lấy thông tin rạp chiếu
              },
            ],
          },
        ],
      });
  
      const groupedByDate = showtimes.reduce((dateAcc, showtime) => {
        const cinema = showtime.Room.Cinema;
        if (!cinema) return dateAcc;
  
        const showDate = new Date(showtime.show_date);
        const formattedDate = `${String(showDate.getDate()).padStart(2, "0")}-${String(
          showDate.getMonth() + 1
        ).padStart(2, "0")}`; // DD-MM
  
        const showDay = showDate.toLocaleDateString("vi-VN", { weekday: "long" });
  
        if (!dateAcc[formattedDate]) {
          dateAcc[formattedDate] = { date: formattedDate, day: showDay, cinemas: {} };
        }
  
        if (!dateAcc[formattedDate].cinemas[cinema.id]) {
          dateAcc[formattedDate].cinemas[cinema.id] = {
            cinema_id: cinema.id,
            cinema_name: cinema.name,
            showtimes: [],
          };
        }
  
        // Format giờ bắt đầu từ trường start_time (kiểu time string, ví dụ: '14:30:00')
        const timeParts = showtime.start_time.split(":");
        const showTime = `${timeParts[0].padStart(2, "0")}:${timeParts[1].padStart(2, "0")}`;
  
        dateAcc[formattedDate].cinemas[cinema.id].showtimes.push({
          id: showtime.id,
          time: showTime,
          room_id: showtime.Room.id,
          room_name: showtime.Room.name,
        });
  
        // Sắp xếp theo giờ chiếu tăng dần
        dateAcc[formattedDate].cinemas[cinema.id].showtimes.sort((a, b) =>
          a.time.localeCompare(b.time)
        );
  
        return dateAcc;
      }, {});
  
      // Chuyển object sang mảng và sắp xếp theo ngày tăng dần
      let result = Object.entries(groupedByDate)
        .map(([_, { date, day, cinemas }]) => ({
          date,
          day,
          cinemas: Object.values(cinemas),
        }))
        .sort((a, b) => {
          const [dayA, monthA] = a.date.split("-").map(Number);
          const [dayB, monthB] = b.date.split("-").map(Number);
          const dateA = new Date(2025, monthA - 1, dayA);
          const dateB = new Date(2025, monthB - 1, dayB);
          return dateA - dateB;
        });
    
      return { status: 200, message: "Get showtimes successfully", data: result };
    } catch (error) {
      console.error("Error fetching showtimes:", error.message);
      throw error;
    }
  };
  
  
  const getShowtimeByIdForBoxchat = async (id) => {
    try {
      const showtime = await Showtime.findOne({
        where: { id },
        include: [
          {
            model: Room,
            attributes: ["id", "name", "cinema_id"], // Chỉ lấy cần thiết
            include: [
              {
                model: Cinema,
                attributes: ["id", "name"], // Lấy tên rạp
              },
            ],
          },
          {
            model: Movie,
            attributes: ["id", "name", "duration", "poster", "age_rating"], // Lấy thông tin phim
          },
        ],
      });    
  
      if (!showtime) {
        return { status: 404, message: "Showtime not found" };
      }
  
      // Tách thời gian
      const startTime = new Date(showtime.start_time);
      const formattedStartTime = {
        dayOfWeek: startTime.toLocaleDateString("vi-VN", { weekday: "long" }), // "Thứ Ba"
        date: startTime.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }), // "11/03/2025"
        time: startTime.toTimeString().slice(0, 5), // "16:12"
      };
      
  
      // Chuẩn bị kết quả
      const response = {
        status: 200,
        message: "Get showtime success",
        showtime: {
          id: showtime.id,
          start_time: formattedStartTime,
          base_price: showtime.base_price,
          room: {
            id: showtime.Room?.id,
            name: showtime.Room?.name,
            cinema: {
              id: showtime.Room?.Cinema?.id,
              name: showtime.Room?.Cinema?.name,
            },
          },
          movie: showtime.Movie,
        },
      };
  
      return response;
    } catch (error) {
      console.error("Error fetching showtime:", error.message);
      throw error;
    }
  };

module.exports = {
    getAllShowtime,
    getShowtimeById,
    getShowtimesByMovieId,
    check_Existing_Showtime,
    createShowtime,
    updateShowtime,
    getShowtimesByMovieIdForChat,
    getShowtimesForUserByMovieId,

    getShowtimeByBranchIdForBoxchat,
    getAllShowtimesForBoxchat,
    getAllShowtimeForBoxchat,
    getShowtimesByMovieIdForBoxchat,
    getShowtimeByIdForBoxchat
};
