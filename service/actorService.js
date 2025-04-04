const { Actor } = require("../models");

// Lấy tất cả diễn viên
const getAllActors = async () => {
    try {
        return await Actor.findAll();
    } catch (error) {
        console.error("Error fetching actors:", error.message);
        throw error;
    }
};

// Lấy diễn viên theo ID
const getActor = async (id) => {
    try {
        return await Actor.findOne({ where: { id } });
    } catch (error) {
        console.error("Error fetching actor:", error.message);
        throw error;
    }
};

// Tạo diễn viên mới
const createActor = async ({ name, dob, bio, gender, profile_picture }) => {
    try {
        return await Actor.create({ name, dob, bio, gender, profile_picture });
    } catch (error) {
        console.error("Error creating actor:", error.message);
        throw error;
    }
};

// Cập nhật thông tin diễn viên
const updateActor = async ({id, name, dob, bio, gender, profile_picture}) => {
    try {
        
        return await Actor.update(
            { name, dob, bio, gender, profile_picture},
            { where: { id } }
        );
    } catch (error) {
        console.error("Error updating actor:", error.message);
        throw error;
    }
};

// Xoá diễn viên
const deleteActor = async (id) => {
    try {
        return await Actor.destroy({ where: { id } });
    } catch (error) {
        console.error("Error deleting actor:", error.message);
        throw error;
    }
};

module.exports = {
    getAllActors,
    getActor,
    createActor,
    updateActor,
    deleteActor,
};
