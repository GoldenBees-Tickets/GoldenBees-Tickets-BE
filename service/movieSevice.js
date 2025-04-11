const { Op, where } = require("sequelize");
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
  Cinema
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
    const { page = 1, limit = 5, search = '', sort_order = 'desc' } = options;
    
    // Tính toán offset cho phân trang
    const offset = (page - 1) * limit;

    // Xây dựng điều kiện tìm kiếm
    let whereClause = {};

    // Tìm kiếm theo tên phim
    if (search) {
      whereClause.name = {
        [Op.like]: `%${search}%`,
      };
    }

    // // Lọc theo trạng thái
    // if (status) {
    //   whereClause.status = status;
    // }

    // Đếm tổng số phim thỏa mãn điều kiện (không sử dụng include)
    const { count } = await Movie.findAndCountAll({
      where: whereClause,
      distinct: true,
    });

    // Lấy dữ liệu phim với phân trang, sắp xếp và các mối quan hệ
    const movies = await Movie.findAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [["release_date", sort_order.toUpperCase()]],
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

    // Tính toán thông tin phân trang
    const totalPages = Math.ceil(count / limit);

    return {
      movies,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  } catch (error) {
    console.error("Error fetching movies:", error.message);
    throw error;
  }
};

const getAllMoviesByUsers = async () => {
  try {
    const data = await Movie.findAll({
      where: {
        status: {
          [Op.ne]: 'ended'
        }
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
    // Nếu có lịch chiếu hôm nay hoặc sắp tới: đánh dấu là đang chiếu (chiếu sớm)
    if (hasUpcomingShowtime) {
      const hasImmediateShowtime = showtimes.some((s) => {
        const showtimeDate = new Date(s.show_date);
        showtimeDate.setHours(0, 0, 0, 0);
        // Lịch chiếu trong vòng 3 ngày tới
        return (
          showtimeDate >= today &&
          Math.round((showtimeDate - today) / (1000 * 60 * 60 * 24)) <= 3
        );
      });

      if (hasImmediateShowtime) {
        return "now_showing"; // Có lịch chiếu trong 3 ngày tới = đang chiếu
      }
    }
    return "opening_soon";
  }

  // Phim gần ngày phát hành (8-14 ngày)
  if (daysUntilRelease <= 14) {
    // Nếu có lịch chiếu: sắp chiếu, ngược lại: sắp ra mắt
    return hasUpcomingShowtime ? "opening_soon" : "coming_soon";
  }

  // Phim còn xa ngày chiếu (>14 ngày)
  return "coming_soon";
}

async function updateStatuses() {
  try {
    // Thay đổi cách query để đảm bảo showtime được lấy đúng
    const movies = await Movie.findAll({
      include: [
        {
          model: Showtime,
          required: false, // Lấy cả phim không có showtime
        },
      ],
    });

    for (const movie of movies) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const releaseDate = new Date(movie.release_date);
      releaseDate.setHours(0, 0, 0, 0);

      const showtimes = movie.Showtimes || [];

      // Gọi hàm getMovieStatus với các thông số đã chuẩn hóa
      const status = await getMovieStatus(movie, showtimes);

      if (movie.status !== status) {
        await movie.update({ status });
      }
    }
    return {
      status: 200,
      message: "Đã cập nhật trạng thái phim!",
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error updating movie statuses:", error.message);
    return {
      status: 500,
      message: "Lỗi khi cập nhật trạng thái phim!",
      success: false,
      error: error.message,
    };
  }
}

const getAllMoviesWithValidShowtimes = async () => {
  try {
    // Lấy thời gian hiện tại
    const now = moment().tz('Asia/Ho_Chi_Minh');
    const todayStr = now.format("YYYY-MM-DD");
    const currentTime = now.format("HH:mm:ss");
    
    console.log(`Lọc phim có xuất chiếu hợp lệ - Ngày hiện tại: ${todayStr}, Giờ hiện tại: ${currentTime}`);
    
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
    
    console.log(`Tìm thấy ${filteredMovies.length} phim có xuất chiếu hợp lệ từ tổng số ${movies.length} phim`);
    
    return filteredMovies;
  } catch (error) {
    console.error("Error fetching movies with valid showtimes:", error.message);
    throw error;
  }
};

module.exports = {
  getAllMovies,
  getMovie,
  createMovieWithRelations,
  updateMovieWithRelations,
  deleteMovieWithRelations,
  updateStatuses,
  getAllMoviesWithValidShowtimes,
  getAllMoviesByUsers
};
