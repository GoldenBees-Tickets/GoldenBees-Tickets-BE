const { resErrors } = require("../common/common");
const {
  getAllMovies,
  getMovie,
  createMovieWithRelations,
  updateMovieWithRelations,
  deleteMovieWithRelations,
} = require("../../service/movieSevice");

const { uploadToCloudinary, deleteFromCloudinary } = require("../../utils/cloudinary");

const uploadFolder = "movies";

class ApiMovieController {
  static async index(req, res) {
    try {
      const movies = await getAllMovies();
      res.json({ message: "Movies retrieved successfully", movies });
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
      const { name, description, trailer, age_rating, duration, director_id, year, country, actor_id, genre_id, producer_id } = req.body;
  
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
        age_rating,
        duration,
        director_id,
        year,
        country,
        actor_id: Array.isArray(actor_id) ? actor_id.map(Number) : [], // Chuyển đổi thành số
        genre_id: Array.isArray(genre_id) ? genre_id.map(Number) : [],
        producer_id: Array.isArray(producer_id) ? producer_id.map(Number) : [],
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
        selectedActors,
        selectedGenres,
        selectedProducers,
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
        actor_id: Array.isArray(selectedActors) ? selectedActors.map((actor) => Number(actor.id)) : [],
        genre_id: Array.isArray(selectedGenres) ? selectedGenres.map((genre) => Number(genre.id)) : [],
        producer_id: Array.isArray(selectedProducers) ? selectedProducers.map((producer) => Number(producer.id)) : [],
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
}

module.exports = ApiMovieController;
