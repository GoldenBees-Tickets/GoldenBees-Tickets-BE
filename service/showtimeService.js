const { Op } = require("sequelize");
const { Showtime, Movie, Room, Cinema, Branch } = require("../models");
const moment = require("moment-timezone");
const { error } = require("console");

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
            switch (status) {
                case "upcoming":
                    whereCondition.show_date = {
                        [Op.gt]: now.format("YYYY-MM-DD")
                    };
                    break;
                case "showing":
                    whereCondition.show_date = now.format("YYYY-MM-DD");
                    break;
                case "past":
                    whereCondition.show_date = {
                        [Op.lt]: now.format("YYYY-MM-DD")
                    };
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
            switch (status) {
                case "upcoming":
                    whereCondition.show_date = {
                        [Op.gt]: now.format("YYYY-MM-DD")
                    };
                    break;
                case "showing":
                    whereCondition.show_date = now.format("YYYY-MM-DD");
                    break;
                case "past":
                    whereCondition.show_date = {
                        [Op.lt]: now.format("YYYY-MM-DD")
                    };
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
        
        // Lấy thời gian hiện tại và cache
        const now = moment().tz('Asia/Ho_Chi_Minh'); // Sử dụng múi giờ Việt Nam
        const todayStr = now.format("YYYY-MM-DD");
        const currentTime = now.format("HH:mm:ss");
        
        console.log(`Lọc suất chiếu: Ngày hiện tại ${todayStr}, Giờ hiện tại ${currentTime}`);
        
        // Thêm điều kiện lọc theo thời gian hiện tại nếu được yêu cầu
        if (current_time) {
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
        
        // Thêm điều kiện lọc theo rạp và chi nhánh
        let cinemaWhereCondition = {};
        if (branch_id) {
            cinemaWhereCondition.branch_id = branch_id;
        }
        if (cinema_id) {
            cinemaWhereCondition.id = cinema_id;
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
                            where: Object.keys(cinemaWhereCondition).length > 0 ? cinemaWhereCondition : undefined,
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
        
        console.log(`Tìm thấy ${validShowtimes.length}/${showtimes.length} suất chiếu hợp lệ cho phim ID ${movie_id}`);
        
        return validShowtimes;
    } catch (error) {
        console.error("Error in getShowtimesByMovieId service:", error);
        throw error;
    }
};

const getShowtimesForUserByMovieId = async (data) => {
    try {     
        console.log("movie_id check", data.movie_id);
           
        let whereCondition = {
            movie_id: data.movie_id
        };
        
        // Lấy thời gian hiện tại và cache
        const now = moment().tz('Asia/Ho_Chi_Minh'); // Sử dụng múi giờ Việt Nam
        const todayStr = now.format("YYYY-MM-DD");
        const currentTime = now.format("HH:mm:ss");
        
        console.log(`Lọc suất chiếu: Ngày hiện tại ${todayStr}, Giờ hiện tại ${currentTime}`);
        
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
        
        // console.log(`Tìm thấy ${validShowtimes.length}/${showtimes.length} suất chiếu hợp lệ cho phim ID ${data.movie_id}`);
        
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
        
        console.log(`DEBUG: movie_id=${movie_id}, todayStr=${todayStr}, currentTime=${currentTime}`);
        
        // Trước tiên, kiểm tra xem có suất chiếu nào cho phim này không
        const allShowtimes = await Showtime.findAll({
            where: { movie_id },
            order: [["show_date", "ASC"], ["start_time", "ASC"]],
        });
        
        console.log(`DEBUG: Tổng số suất chiếu cho phim: ${allShowtimes.length}`);
        
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
        
        console.log(`DEBUG: Số suất chiếu hợp lệ (chưa diễn ra): ${showtimes.length}`);
        
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

module.exports = {
    getAllShowtime,
    getShowtimeById,
    getShowtimesByMovieId,
    check_Existing_Showtime,
    createShowtime,
    updateShowtime,
    getShowtimesByMovieIdForChat,
    getShowtimesForUserByMovieId
};
