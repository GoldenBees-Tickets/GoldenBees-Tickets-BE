const { resErrors, resData } = require("../common/common");
const {
  getAllMovieGenres,
  getMovieGenre,
  createMovieGenre,
  updateMovieGenre,
  deleteMovieGenre
} = require("../../service/movieGenreService");

class ApiMovieGenreController {
  static async index(req, res) {
    try {
      const movieGenres = await getAllMovieGenres();
      res.json({ message: "Get movie genres successfully", movieGenres });
    } catch (error) {
      console.error("Error fetching movie genres:", error);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async show(req, res) {
    try {
      const { id } = req.params;
      const movieGenre = await getMovieGenre(id);
      if (movieGenre) {
        res.json({ message: "Get movie genre successfully", movieGenre });
      } else {
        resErrors(res, 404, "Movie Genre not found");
      }
    } catch (error) {
      console.error("Error fetching movie genre:", error);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async create(req, res) {
    try {
      const { movie_id, genre_id } = req.body;


      const movieGenre = await createMovieGenre({ movie_id, genre_id });
      return res.json({
        message: "Movie Genre created successfully",
        movieGenre
      });
    } catch (error) {
      console.error("Error creating movie genre:", error);
      return res.status(500).json({
        message: error.message || "Internal Server Error"
      });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { movie_id, genre_id } = req.body;
      const updated = await updateMovieGenre({ id, movie_id, genre_id });

      if (updated[0] === 0) {
        resErrors(res, 404, "Movie Genre not found or no changes made");
      } else {
        res.json({ message: "Movie Genre updated successfully" });
      }
    } catch (error) {
      console.error("Error updating movie genre:", error);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await deleteMovieGenre(id);

      if (deleted === 0) {
        resErrors(res, 404, "Movie Genre not found");
      } else {
        res.json({ message: "Movie Genre deleted successfully" });
      }
    } catch (error) {
      console.error("Error deleting movie genre:", error);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }
}

module.exports = ApiMovieGenreController;
