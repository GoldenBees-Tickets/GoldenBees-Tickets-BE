const { resErrors } = require("../common/common");
const {
  createMovieActor,

  deleteMovieActor,
} = require("../../service/movieActorService");

class ApiMovieActorController {
  static async create(req, res) {
    try {
      const { movie_id, actor_id } = req.body;

      if (!movie_id || !actor_id) {
        return resErrors(res, 400, "Both movie_id and actor_id are required.");
      }

      const newLink = await createMovieActor(movie_id, actor_id);

      res.json({
        message: "Movie-actor link created successfully",
        link: newLink,
      });
    } catch (error) {
      console.error("Error creating movie-actor link:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const movie_id = id;
      const deleted = await deleteMovieActor(movie_id);

      if (deleted === 0) {
        return resErrors(res, 404, "Movie-actor link not found.");
      }

      res.json({ message: "Movie-actor link deleted successfully" });
    } catch (error) {
      console.error("Error deleting movie-actor link:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }
}

module.exports = ApiMovieActorController;
