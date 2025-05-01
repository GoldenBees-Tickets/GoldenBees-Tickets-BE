const { Director } = require("../models");
const { Op } = require('sequelize');

// Lấy tất cả đạo diễn
const getAllDirectors = async (options = {}) => {
    try {
        const { page = 1, limit = 5, search = '', gender = '', sort_order = 'desc' } = options;
        
        // Tính toán offset cho phân trang
        const offset = (page - 1) * limit;
        
        // Xây dựng điều kiện tìm kiếm
        let whereClause = {};
        
        // Tìm kiếm theo tên đạo diễn
        if (search) {
            whereClause.name = {
                [Op.like]: `%${search}%`
            };
        }
        
        // Lọc theo giới tính
        if (gender) {
            whereClause.gender = gender;
        }
        
        // Đếm tổng số đạo diễn thỏa mãn điều kiện
        const { count } = await Director.findAndCountAll({
            where: whereClause,
            distinct: true
        });
        
        // Lấy dữ liệu đạo diễn với phân trang và sắp xếp
        const directors = await Director.findAll({
            where: whereClause,
            limit: limit,
            offset: offset,
            order: [
                ['dob', sort_order.toUpperCase()]
            ]
        });
        
        // Tính toán thông tin phân trang
        const totalPages = Math.ceil(count / limit);
        
        return {
            directors,
            pagination: {
                total: count,
                totalPages,
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error("Error fetching directors:", error.message);
        throw error;
    }
};

const getDirectorsNotPage = async () => {
    try {
        const data = await Director.findAll();
        return { status: 200, message: "Get all directors successfully", data, success: true, error: false };
    } catch (error) {
        console.error("Error fetching director:", error.message);
        throw error;
    }
}

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
        if(profile_picture) {
            return await Director.update(
                { name, dob, bio, gender, profile_picture },
                { where: { id } }
            );
        }
        return await Director.update(
            { name, dob, bio, gender },
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

const getAllDirectorsForBoxchat = async () => {
    try {
        return await Director.findAll();
    } catch (error) {
        console.error("Error fetching directors:", error.message);
        throw error;
    }
};

module.exports = {
    getAllDirectors,
    getDirector,
    createDirector,
    updateDirector,
    deleteDirector,
    getAllDirectorsForBoxchat,
    getDirectorsNotPage
};
