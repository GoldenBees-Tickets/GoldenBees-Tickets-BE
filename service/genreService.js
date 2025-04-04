const { Genre } = require("../models");

// Lấy tất cả thể loại phim
const getAllGenres = async () => {
    try {
        return await Genre.findAll();
    } catch (error) {
        console.error("Error fetching genres:", error.message);
        throw error;
    }
};

// Lấy thể loại phim theo ID
const getGenre = async (id) => {
    try {
        return await Genre.findOne({ where: { id } });
    } catch (error) {
        console.error("Error fetching genre:", error.message);
        throw error;
    }
};

// Tạo thể loại phim mới
const createGenre = async ({ name }) => {
    try {
        return await Genre.create({ name });
    } catch (error) {
        console.error("Error creating genre:", error.message);
        throw error;
    }
};

// Cập nhật thể loại phim
const updateGenre = async ({ id, name }) => {
    try {
        return await Genre.update({ name }, { where: { id } });
    } catch (error) {
        console.error("Error updating genre:", error.message);
        throw error;
    }
};

// Xoá thể loại phim
const deleteGenre = async (id) => {
    try {
        return await Genre.destroy({ where: { id } });
    } catch (error) {
        console.error("Error deleting genre:", error.message);
        throw error;
    }
};

module.exports = {
    getAllGenres,
    getGenre,
    createGenre,
    updateGenre,
    deleteGenre,
};
