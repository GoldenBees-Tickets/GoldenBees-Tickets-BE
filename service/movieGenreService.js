const { MovieGenre } = require("../models");

// Lấy tất cả movie genres
const getAllMovieGenres = async () => {
  try {
    return await MovieGenre.findAll();
  } catch (error) {
    console.error("Error fetching movie genres:", error.message);
    throw error;
  }
};

// Lấy một movie genre theo ID
const getMovieGenre = async (id) => {
  try {
    return await MovieGenre.findOne({ where: { id } });
  } catch (error) {
    console.error("Error fetching movie genre:", error.message);
    throw error;
  }
};

// Tạo movie genre mới
const createMovieGenre = async ({ movie_id, genre_id }) => {
  try {
    return await MovieGenre.create({
      movie_id,
      genre_id,
    });
  } catch (error) {
    throw error;
  }
};

// Cập nhật movie genre
const updateMovieGenre = async ({ id, movie_id, genre_id }) => {
  try {
    return await MovieGenre.update(
      { movie_id, genre_id: Number(genre_id) },
      { where: { id } }
    );
  } catch (error) {
    console.error("Error updating movie genre:", error.message);
    throw error;
  }
};

// Xóa movie genre theo movie_id
const deleteMovieGenre = async (movie_id) => {
  try {
    const deleted = await MovieGenre.destroy({ where: { movie_id } });
    return deleted;
  } catch (error) {
    console.error("Error deleting movie genre:", error.message);
    throw error;
  }
};

module.exports = {
  getAllMovieGenres,
  getMovieGenre,
  createMovieGenre,
  updateMovieGenre,
  deleteMovieGenre,
};
