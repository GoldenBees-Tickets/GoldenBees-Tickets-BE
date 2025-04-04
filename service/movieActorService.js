const { MovieActor } = require("../models");

const createMovieActor = async ({movie_id, actor_id}) => {
  try {
    const existingLink = await MovieActor.findOne({
      where: { movie_id, actor_id },
    });

    if (existingLink) {
      throw new Error("The actor is already linked to this movie.");
    }

    return await MovieActor.create({
      movie_id,
      actor_id,
    });
  } catch (error) {
    console.error("Error creating movie-actor link:", error.message);
    throw error;
  }
};

const deleteMovieActor = async (movie_id) => {
  try {
    const deleted = await MovieActor.destroy({
      where: { movie_id },
    });

    return deleted;
  } catch (error) {
    console.error("Error deleting movie-actor link:", error.message);
    throw error;
  }
};

module.exports = {
  createMovieActor,

  deleteMovieActor,
};
