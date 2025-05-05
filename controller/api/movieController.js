const { resErrors } = require("../common/common");
const {
  getAllMovies,
  getMovie,
  createMovieWithRelations,
  updateMovieWithRelations,
  deleteMovieWithRelations,
  getAllMoviesWithValidShowtimes,
  getAllMoviesByUsers,
  getAllMoviesByAdmin,
  getAllMoviesByAddShowtime,
} = require("../../service/movieSevice");

const { uploadToCloudinary, deleteFromCloudinary } = require("../../utils/cloudinary");

const uploadFolder = "movies";

class ApiMovieController {
  static async index(req, res) {
    try {
      // Lấy các tham số phân trang từ query params
      const { page, limit, search, sort_order, status } = req.query;
      
      // Truyền các tham số này vào hàm getAllMovies
      const movies = await getAllMovies({ 
        page, 
        limit, 
        search, 
        sort_order,
        status
      });
            
      // Trả về dữ liệu phim đã lọc
      res.json(movies);
    } catch (error) {
      console.error("Error fetching movies:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async getAll(req, res) {
    try {      
      const movies = await getAllMoviesByUsers();
      res.json(movies);
    } catch (error) {
      console.error("Error fetching movies:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async getAllByAdmin(req, res) {
    try {      
      const movies = await getAllMoviesByAdmin();
      res.json(movies);
    } catch (error) {
      console.error("Error fetching movies:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async show(req, res) {
    try {
      const { id } = req.params;
      const movie = await getMovie(id);
      if (movie) {
        res.json({ message: "Movie retrieved successfully", movie });
      } else {
        resErrors(res, 404, "Movie not found");
      }
    } catch (error) {
      console.error("Error fetching movie:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }


  static async create(req, res) {
    try {
      const { name, description, trailer, age_rating, duration, director_id, year, country, release_date, end_date, actor_id, genre_id, producer_id } = req.body;
      
      if (!name || !duration || !director_id) {
        return resErrors(res, 400, "Name, duration, and director_id are required.");
      }
  
      const file = req.file;
      const uploadFileName = file?.originalname?.split(".")[0]; // Lấy tên file không có đuôi
      const poster = file ? await uploadToCloudinary(file, uploadFolder, uploadFileName) : null;
  
      const newMovie = await createMovieWithRelations({
        name,
        description,
        trailer,
        poster,
        age_rating: Number(age_rating),
        duration,
        director_id,
        year,
        country,
        release_date,
        end_date,
        actorIds: Array.isArray(actor_id) ? actor_id.map(Number) : [], // Chuyển đổi thành số
        genreIds: Array.isArray(genre_id) ? genre_id.map(Number) : [],
        producerIds: Array.isArray(producer_id) ? producer_id.map(Number) : [],
      });
  
      res.json(newMovie);
    } catch (error) {
      console.error("Error creating movie:", error);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        trailer,
        age_rating,
        duration,
        director_id,
        year,
        country,
        release_date,
        end_date,
        actor_id,
        genre_id,
        producer_id,
      } = req.body;      
  
      const movie = await getMovie(id);
      if (!movie) {
        return resErrors(res, 404, "Movie not found.");
      }
  
      // Nếu có file mới, upload ảnh mới. Nếu không, giữ nguyên ảnh cũ
      const file = req.file;
      const poster = file ? await uploadToCloudinary(file, uploadFolder, movie.name) : movie.poster;
  
      // Sửa lỗi convert object → số
      const updatedMovie = await updateMovieWithRelations({
        id: Number(id),
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
        actor_id: Array.isArray(actor_id) ? actor_id.map((actor) => Number(actor)) : [],
        genre_id: Array.isArray(genre_id) ? genre_id.map((genre) => Number(genre)) : [],
        producer_id: Array.isArray(producer_id) ? producer_id.map((producer) => Number(producer)) : [],
      });
  
      res.json(updatedMovie);
    } catch (error) {
      console.error("Error updating movie:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }
  

  static async delete(req, res) {
    try {
      const { id } = req.params;
  
      const movie = await getMovie(id);
      if (!movie) {
        return resErrors(res, 404, "Movie not found");
      }
  
      // Xóa poster trên Cloudinary nếu có
      if (movie.poster) {
        await deleteFromCloudinary(movie.poster);
      }
  
      // Gọi service xóa phim và dữ liệu liên quan
      const result = await deleteMovieWithRelations(id);
      res.json(result);
    } catch (error) {
      console.error("Error deleting movie:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async getMoviesWithValidShowtimes(req, res) {
    try {
      // Lấy phim có xuất chiếu hợp lệ
      const movies = await getAllMoviesWithValidShowtimes();
      
      // Kiểm tra một lần nữa và lọc ra các phim có xuất chiếu hợp lệ
      const validMovies = movies.filter(movie => 
        movie.Showtimes && movie.Showtimes.length > 0
      );
          
      res.json({
        message: "Movies with valid showtimes retrieved successfully",
        movies: validMovies
      });
    } catch (error) {
      console.error("Error fetching movies with valid showtimes:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async getAllMovies(req, res) {
    try {
      // Sử dụng getAllMoviesWithValidShowtimes để lấy phim có xuất chiếu hợp lệ
      const movies = await getAllMoviesWithValidShowtimes();

      // Kiểm tra một lần nữa và lọc ra các phim có xuất chiếu hợp lệ
      const validMovies = movies.filter(movie => 
        movie.Showtimes && movie.Showtimes.length > 0
      );
            
      res.json({
        message: "Movies retrieved successfully",
        movies: validMovies
      });
    } catch (error) {
      console.error("Error fetching movies:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async getMoviesByAddShowtimeController(req, res) {
    try {
      const movies = await getAllMoviesByAddShowtime();
      res.json(movies);
    } catch (error) {
      console.error("Error fetching movies:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }
}

module.exports = ApiMovieController;
