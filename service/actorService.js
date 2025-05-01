const { Actor } = require("../models");
const { Op } = require('sequelize');

// Lấy tất cả diễn viên
const getAllActors = async (options = {}) => {
    try {
        const { page = 1, limit = 5, search = '', gender = '', sort_order = 'desc' } = options;
        
        // Tính toán offset cho phân trang
        const offset = (page - 1) * limit;
        
        // Xây dựng điều kiện tìm kiếm
        let whereClause = {};
        
        // Tìm kiếm theo tên diễn viên
        if (search) {
            whereClause.name = {
                [Op.like]: `%${search}%`
            };
        }
        
        // Lọc theo giới tính
        if (gender) {
            whereClause.gender = gender;
        }
        
        // Đếm tổng số diễn viên thỏa mãn điều kiện
        const { count } = await Actor.findAndCountAll({
            where: whereClause,
            distinct: true
        });
        
        // Lấy dữ liệu diễn viên với phân trang và sắp xếp
        const actors = await Actor.findAll({
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
            actors,
            pagination: {
                total: count,
                totalPages,
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error("Error fetching actors:", error.message);
        throw error;
    }
};

const getActorsNotPage = async () => {
    try {
        const data = await Actor.findAll();
        return {status: 200, success: true, message: "Get all actors successfully", data, error: false};
    } catch (error) {
        console.error("Error fetching all actors:", error.message);
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
        if(profile_picture) {
            return await Actor.update(
                { name, dob, bio, gender, profile_picture},
                { where: { id } }
            );
        } 
        return await Actor.update(
            { name, dob, bio, gender},
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

const getAllActorsForBoxchat = async () => {
    try {
        return await Actor.findAll();
    } catch (error) {
        console.error("Error fetching actors:", error.message);
        throw error;
    }
};

module.exports = {
    getAllActors,
    getActor,
    createActor,
    updateActor,
    deleteActor,
    getAllActorsForBoxchat,
    getActorsNotPage
};
