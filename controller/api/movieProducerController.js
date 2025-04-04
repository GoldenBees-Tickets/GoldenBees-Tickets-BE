const { resErrors } = require("../common/common");
const {
  createMovieProducer,
  deleteMovieProducer,
} = require("../../service/movieProducerService");

class ApiMovieProducerController {
  static async create(req, res) {

    try {
      const { movie_id, producer_id } = req.body;

      const newLink = await createMovieProducer({ movie_id, producer_id });

      res.json({ message: "Movie-producer link created successfully", data: newLink });
    } catch (error) {
      console.error("Error creating movie-producer link:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async delete(req, res) {
    try {
      const { movie_id, producer_id } = req.params;

      if (!movie_id || !producer_id) {
        return resErrors(res, 400, "Both movie_id and producer_id are required.");
      }

      const deleted = await deleteMovieProducer(movie_id, producer_id);

      if (deleted === 0) {
        return resErrors(res, 404, "Movie-producer link not found.");
      }


      res.json({ message: "Movie-producer link deleted successfully" });
    } catch (error) {
      console.error("Error deleting movie-producer link:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }
}

module.exports = ApiMovieProducerController;
