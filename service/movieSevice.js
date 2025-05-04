const { Op } = require("sequelize");
const {
  Movie,
  MovieGenre,
  Genre,
  Director,
  MovieActor,
  Actor,
  MovieProducer,
  Producer,
  Showtime,
  Room,
  Cinema,
  Review,
  sequelize
} = require("../models");
const { createMovieActor, deleteMovieActor } = require("./movieActorService");
const { createMovieGenre, deleteMovieGenre } = require("./movieGenreService");
const { createMovieProducer, deleteMovieProducer } = require("./movieProducerService");
const moment = require('moment-timezone');

const getMovie = async (id) => {
  try {
    return await Movie.findOne({
      where: { id },
      include: [
        {
          model: MovieGenre,
          include: [{ model: Genre }],
        },
        { model: Director },
        {
          model: MovieActor,
          include: [{ model: Actor }],
        },
        {
          model: MovieProducer,
          include: [{ model: Producer }],
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching movie:", error.message);
    throw error;
  }
};

const getAllMovies = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      sort_order = 'desc',
    } = options;

    // Đảm bảo các tham số được chuyển đổi sang số
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Điều kiện lọc
    const whereClause = {};

    if (search) {
      whereClause.name = {
        [Op.like]: `%${search}%`,
      };
    }


    // Chuẩn hóa thứ tự sắp xếp
    const sortOrder = ['asc', 'desc'].includes(sort_order.toLowerCase())
      ? sort_order.toUpperCase()
      : 'DESC';

    // Tìm và đếm tổng số phim + lấy danh sách
    const { count, rows: movies } = await Movie.findAndCountAll({
      where: whereClause,
      limit: limitNum,
      offset: offset,
      order: [['release_date', sortOrder]],
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM Showtimes AS st
              WHERE st.movie_id = Movie.id
                AND TIMESTAMP(st.show_date, st.start_time) > NOW()
            )`),
            'total_showtimes'
          ]
        ]
      },
      include: [
        {
          model: MovieGenre,
          include: [{ model: Genre }],
          required: false,
        },
        {
          model: Director,
          required: false,
        },
        {
          model: MovieActor,
          include: [{ model: Actor }],
          required: false,
        },
        {
          model: MovieProducer,
          include: [{ model: Producer }],
          required: false,
        },
      ],
      distinct: true,
    });
    

    const totalPages = Math.ceil(count / limitNum);

    return {
      movies,
      pagination: {
        total: count,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
      },
    };
  } catch (error) {
    console.error("Error fetching movies (admin):", error.message, error.stack);
    throw new Error("Lỗi khi lấy danh sách phim cho admin: " + error.message);
  }
};


const getAllMoviesByUsers = async () => {
  try {
    const now = moment().tz('Asia/Ho_Chi_Minh');
    const sevenDaysFromNow = moment().tz('Asia/Ho_Chi_Minh').add(7, 'days');
    const currentDateTime = now.format('YYYY-MM-DD HH:mm:ss');

    const movies = await Movie.findAll({
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM Showtimes AS st
              WHERE st.movie_id = Movie.id
                AND TIMESTAMP(st.show_date, st.start_time) > STR_TO_DATE('${currentDateTime}', '%Y-%m-%d %H:%i:%s')
            )`),
            'total_showtimes'
          ],
          [
            sequelize.literal(`(
              SELECT AVG(rating)
              FROM reviews AS r
              WHERE r.movie_id = Movie.id
            )`),
            'average_rating'
          ]
        ]
      },
      include: [
        {
          model: MovieGenre,
          include: [{ model: Genre }],
        },
        { model: Director },
        {
          model: MovieActor,
          include: [{ model: Actor }],
        },
        {
          model: MovieProducer,
          include: [{ model: Producer }],
        },
        {
          model: Review, // optional nếu bạn cần lấy dữ liệu từng đánh giá
          attributes: [],
        }
      ],
    });

    const filteredMovies = movies.filter(movie => {
      const releaseDate = moment(movie.release_date).tz('Asia/Ho_Chi_Minh');
      const totalShowtimes = parseInt(movie.getDataValue('total_showtimes')) || 0;

      if (releaseDate.isAfter(sevenDaysFromNow)) {
        return true;
      }

      if (releaseDate.isSameOrBefore(sevenDaysFromNow) && totalShowtimes > 0) {
        return true;
      }

      return false;
    });

    return {
      status: 200,
      success: true,
      message: "Lấy danh sách phim thành công",
      error: false,
      data: filteredMovies,
    };
  } catch (error) {
    console.error("Error fetching movies:", error.message);
    throw error;
  }
};


const getAllMoviesByAdmin = async () => {
  try {
    const data = await Movie.findAll({
      include: [
        {
          model: MovieGenre,
          include: [{ model: Genre }],
        },
        { model: Director },
        {
          model: MovieActor,
          include: [{ model: Actor }],
        },
        {
          model: MovieProducer,
          include: [{ model: Producer }],
        },
      ],
    });

    return {
      status: 200,
      success: true,
      message: "Lấy danh sách phim thành công",
      error: false,
      data
    };
  } catch (error) {
    console.error("Error fetching movies:", error.message);
    throw error;
  }
};

const getAllMoviesByAddShowtime = async () => {
  try {
    const now = moment().tz('Asia/Ho_Chi_Minh');
    const currentDate = now.format('YYYY-MM-DD');

    const movies = await Movie.findAll({
      where: {
        end_date: {
          [Op.gte]: currentDate, // Chỉ lấy phim có ngày kết thúc >= hôm nay
        },
      },
    });

    return {
      status: 200,
      success: true,
      message: "Lấy danh sách phim thành công",
      error: false,
      data: movies,
    };
  } catch (error) {
    console.error("Error fetching movies:", error.message);
    throw error;
  }
};


const createMovieWithRelations = async ({
  name,
  description,
  trailer,
  poster,
  age_rating,
  duration,
  director_id,
  year,
  country,
  release_date,
  end_date,
  actorIds = [],
  genreIds = [],
  producerIds = [],
}) => {
  try {
    const movie = await Movie.create({
      name,
      description,
      trailer,
      poster,
      age_rating,
      duration,
      director_id,
      year,
      country,
      release_date,
      end_date
    });

    const movie_id = Number(movie.id);

    await Promise.all([
      ...actorIds.map((actor_id) =>
        createMovieActor({ movie_id, actor_id: Number(actor_id) })
      ),
      ...producerIds.map((producer_id) =>
        createMovieProducer({ movie_id, producer_id: Number(producer_id) })
      ),
      ...genreIds.map((genre_id) =>
        createMovieGenre({ movie_id, genre_id: Number(genre_id) })
      ),
    ]);

    return { movie, status: 200, message: "Movie created successfully" };
  } catch (error) {
    throw error;
  }
};

const updateMovieWithRelations = async ({
  id,
  name,
  description,
  trailer,
  poster,
  age_rating,
  duration,
  director_id,
  year,
  country,
  release_date,
  end_date,
  actor_id = [],
  producer_id = [],
  genre_id = [],
}) => {
  try {
    // Cập nhật thông tin movie
    const [updatedRows] = await Movie.update(
      {
        name,
        description,
        trailer,
        poster,
        age_rating,
        duration,
        director_id,
        year,
        country,
        release_date,
        end_date,
      },
      { where: { id } }
    );

    if (!updatedRows) {
      throw new Error("Failed to update movie.");
    }

    let movie_id = Number(id); // Đảm bảo kiểu dữ liệu là số nguyên

    // Xóa dữ liệu cũ trước khi cập nhật mới
    await Promise.all([
      actor_id.length ? deleteMovieActor(movie_id) : Promise.resolve(),
      producer_id.length ? deleteMovieProducer(movie_id) : Promise.resolve(),
      genre_id.length ? deleteMovieGenre(movie_id) : Promise.resolve(),
    ]);

    // 3Chạy các liên kết song song để tối ưu
    if (actor_id.length) {
      await Promise.all(
        actor_id.map((actor) =>
          createMovieActor({ movie_id, actor_id: Number(actor) })
        )
      );
    }

    if (producer_id.length) {
      await Promise.all(
        producer_id.map((producer) =>
          createMovieProducer({ movie_id, producer_id: Number(producer) })
        )
      );
    }    

    if (genre_id.length) {      
      await Promise.all(
        genre_id.map((genre) =>
          createMovieGenre({ movie_id, genre_id: Number(genre) })
        )
      );
    }
    const movie = await Movie.findOne({ where: { id } });
    return { movie, status: 200, message: "Cập nhật phim thành công" };
  } catch (error) {
    console.error("Error updating movie:", error.message);
    throw error;
  }
};

const deleteMovieWithRelations = async (movieId) => {
  try {
    // Delete related entities first to avoid foreign key constraint errors
    await Promise.all([
      deleteMovieActor(movieId),
      deleteMovieGenre(movieId),
      deleteMovieProducer(movieId),
    ]);
    
    // After deleting related data, delete the movie
    await Movie.destroy({ where: { id: movieId } });
    return { status: 200, message: "Movie deleted successfully" };
  } catch (error) {
    console.error("Error deleting movie:", error.message);
    throw error;
  }
};

async function getMovieStatus(movie, showtimes) {
  // Thiết lập thời gian về 00:00:00 cho cả hai ngày để tính chính xác
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const releaseDate = new Date(movie.release_date);
  releaseDate.setHours(0, 0, 0, 0);
  
  const daysUntilRelease = Math.round(
    (releaseDate - today) / (1000 * 60 * 60 * 24)
  );
  const hasUpcomingShowtime = showtimes.some((s) => {
    const showtimeDate = new Date(s.show_date);
    showtimeDate.setHours(0, 0, 0, 0);
    return showtimeDate >= today;
  });
  
  // Đặc biệt: Nếu phim có lịch chiếu trong ngày hôm nay, đánh dấu là "đang chiếu" 
  // bất kể ngày phát hành là khi nào (trường hợp chiếu sớm)
  const hasTodayShowtime = showtimes.some((s) => {
    const showtimeDate = new Date(s.show_date);
    showtimeDate.setHours(0, 0, 0, 0);
    return showtimeDate.getTime() === today.getTime();
  });
  
  if (hasTodayShowtime) {
    return "now_showing";
  }
  
  // Phim đã qua ngày phát hành (ngày phát hành trước ngày hiện tại)
  if (daysUntilRelease <= 0) {
    // Nếu có lịch chiếu tương lai: đang chiếu, ngược lại: đã kết thúc
    return hasUpcomingShowtime ? "now_showing" : "ended";
  }
  
  // Phim rất gần ngày phát hành (0-7 ngày tới)
  if (daysUntilRelease <= 7) {
    if (hasUpcomingShowtime) {
      const hasImmediateShowtime = showtimes.some((s) => {
        const showtimeDate = new Date(s.show_date);
        showtimeDate.setHours(0, 0, 0, 0);
        const diff = Math.floor((showtimeDate - today) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 3;
      });
  
      return hasImmediateShowtime ? "opening_soon" : "coming_soon";
    }
    return "coming_soon";
  }

  return "coming_soon";
}

const getAllMoviesWithValidShowtimes = async () => {
  try {
    // Lấy thời gian hiện tại
    const now = moment().tz('Asia/Ho_Chi_Minh');
    const todayStr = now.format("YYYY-MM-DD");
    const currentTime = now.format("HH:mm:ss");
        
    // Lấy tất cả phim cùng với các xuất chiếu hợp lệ của chúng
    const movies = await Movie.findAll({
      include: [
        {
          model: MovieGenre,
          include: [{ model: Genre }],
          required: false
        },
        { 
          model: Director,
          required: false
        },
        {
          model: MovieActor,
          include: [{ model: Actor }],
          required: false
        },
        {
          model: MovieProducer,
          include: [{ model: Producer }],
          required: false
        },
        {
          model: Showtime,
          where: {
            [Op.or]: [
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
            ]
          },
          include: [
            {
              model: Room,
              include: [{ model: Cinema }],
              required: true
            }
          ],
          required: true // Bắt buộc phải có ít nhất một xuất chiếu hợp lệ
        }
      ],
      distinct: true // Đảm bảo không trùng lặp phim
    });
    
    // Thêm một lần kiểm tra để chắc chắn phim có xuất chiếu hợp lệ
    const filteredMovies = movies.filter(movie => {
      return movie.Showtimes && movie.Showtimes.length > 0;
    });
        
    return filteredMovies;
  } catch (error) {
    console.error("Error fetching movies with valid showtimes:", error.message);
    throw error;
  }
};

const getAllMoviesForBoxchat = async () => {
  try {
    return await Movie.findAll({
      include: [
        {
          model: MovieGenre,
          include: [{ model: Genre }],
        },
        { model: Director },
        {
          model: MovieActor,
          include: [{ model: Actor }],
        },
        {
          model: MovieProducer,
          include: [{ model: Producer }],
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching movies:", error.message);
    throw error;
  }
};

module.exports = {
  getAllMovies,
  getMovie,
  createMovieWithRelations,
  updateMovieWithRelations,
  deleteMovieWithRelations,
  getAllMoviesWithValidShowtimes,
  getAllMoviesByUsers,
  getAllMoviesForBoxchat,
  getAllMoviesByAdmin,
  getAllMoviesByAddShowtime
};
