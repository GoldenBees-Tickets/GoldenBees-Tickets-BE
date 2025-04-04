const {
  Movie,
  MovieGenre,
  Genre,
  Director,
  MovieActor,
  Actor,
  MovieProducer,
  Producer,
} = require("../models");
const { createMovieActor, deleteMovieActor } = require("./movieActorService");
const { createMovieGenre, deleteMovieGenre } = require("./movieGenreService");
const { createMovieProducer, deleteMovieProducer } = require("./movieProducerService");

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

const getAllMovies = async () => {
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

const createMovieWithRelations = async ({
  name,
  description,
  trailer,
  poster,
  ageRating,
  duration,
  directorId,
  year,
  country,
  actorIds = [],
  producerIds = [],
  genreIds = [],
}) => {
  try {
    const movie = await Movie.create({
      name,
      description,
      trailer,
      poster,
      ageRating,
      duration,
      directorId,
      year,
      country,
    });

    const movieId = Number(movie.id);

    await Promise.all([
      ...actorIds.map((actorId) => createMovieActor({ movieId, actorId: Number(actorId) })),
      ...producerIds.map((producerId) => createMovieProducer({ movieId, producerId: Number(producerId) })),
      ...genreIds.map((genreId) => createMovieGenre({ movieId, genreId: Number(genreId) })),
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
      { name, description, trailer, poster, age_rating, duration, director_id, year, country },
      { where: { id } }
    );

    if (!updatedRows) {
      throw new Error("Failed to update movie.");
    }

    let movie_id = Number(id); // Đảm bảo kiểu dữ liệu là số nguyên

    // Xóa dữ liệu cũ trước khi cập nhật mới
    await Promise.all([
      deleteMovieActor(movie_id),
      deleteMovieProducer(movie_id),
      deleteMovieGenre(movie_id),
    ]);

    // 3Chạy các liên kết song song để tối ưu
    if (actor_id.length) {
      await Promise.all(actor_id.map((actor) => createMovieActor({ movie_id, actor_id: Number(actor) })));
    }

    if (producer_id.length) {
      await Promise.all(producer_id.map((producer) => createMovieProducer({ movie_id, producer_id: Number(producer) })));
    }

    if (genre_id.length) {
      await Promise.all(genre_id.map((genre) => createMovieGenre({ movie_id, genre_id: Number(genre) })));
    }
    const movie = await Movie.findOne({ where: { id } });
    return {movie, status: 200, message: "Cập nhật phim thành công"};
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


module.exports = {
  getAllMovies,
  getMovie,
  createMovieWithRelations,
  updateMovieWithRelations,
  deleteMovieWithRelations,
};
