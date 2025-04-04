const { Director } = require("../models");

// Lấy tất cả đạo diễn
const getAllDirectors = async () => {
    try {
        return await Director.findAll();
    } catch (error) {
        console.error("Error fetching directors:", error.message);
        throw error;
    }
};

// Lấy đạo diễn theo ID
const getDirector = async (id) => {
    try {
        return await Director.findOne({ where: { id } });
    } catch (error) {
        console.error("Error fetching director:", error.message);
        throw error;
    }
};

// Tạo đạo diễn mới
const createDirector = async ({ name, dob, bio, gender, profile_picture }) => {
    try {
        return await Director.create({ name, dob, bio, gender, profile_picture });
    } catch (error) {
        console.error("Error creating director:", error.message);
        throw error;
    }
};

// Cập nhật thông tin đạo diễn
const updateDirector = async ({ id, name, dob, bio, gender, profile_picture }) => {
    try {
        return await Director.update(
            { name, dob, bio, gender, profile_picture },
            { where: { id } }
        );
    } catch (error) {
        console.error("Error updating director:", error.message);
        throw error;
    }
};

// Xoá đạo diễn
const deleteDirector = async (id) => {
    try {
        return await Director.destroy({ where: { id } });
    } catch (error) {
        console.error("Error deleting director:", error.message);
        throw error;
    }
};

module.exports = {
    getAllDirectors,
    getDirector,
    createDirector,
    updateDirector,
    deleteDirector,
};
