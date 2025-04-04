const { MovieProducer } = require("../models");

const createMovieProducer = async ({movie_id, producer_id}) => {
  try {
    const existingLink = await MovieProducer.findOne({
      where: { movie_id, producer_id },
    });

    if (existingLink) {
      throw new Error("The producer is already linked to this movie.");
    }

    return await MovieProducer.create({
      movie_id,
      producer_id,
    });
  } catch (error) {
    console.error("Error creating movie-producer link:", error.message);
    throw error;
  }
};

const deleteMovieProducer = async (movie_id) => {
  try {
    const deleted = await MovieProducer.destroy({
      where: { movie_id },
    });

    if (deleted === 0) {
      throw new Error("No link found to delete.");
    }

    return deleted;
  } catch (error) {
    console.error("Error deleting movie-producer link:", error.message);
    throw error;
  }
};

module.exports = {
  createMovieProducer,
  deleteMovieProducer,
};
