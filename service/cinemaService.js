const { Cinema, User } = require("../models");
const { Op } = require('sequelize');

// Lấy tất cả các cinema
const getAllCinemas = async (options = {}) => {
    try {
        const { page = 1, limit = 5, search = '', sort_order = 'desc' } = options;
        
        // Tính toán offset cho phân trang
        const offset = (page - 1) * limit;
        
        // Xây dựng điều kiện tìm kiếm
        let whereClause = {};
        
        // Tìm kiếm theo tên rạp
        if (search) {
            whereClause.name = {
                [Op.like]: `%${search}%`
            };
        }
        
        // Đếm tổng số rạp thỏa mãn điều kiện
        const { count } = await Cinema.findAndCountAll({
            where: whereClause,
            distinct: true
        });
        
        // Lấy dữ liệu rạp với phân trang và sắp xếp
        const cinemas = await Cinema.findAll({
            where: whereClause,
            limit: limit,
            offset: offset,
            order: [
                ['name', sort_order.toUpperCase()]
            ]
        });
        
        // Tính toán thông tin phân trang
        const totalPages = Math.ceil(count / limit);
        
        return {
            cinemas,
            pagination: {
                total: count,
                totalPages,
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error("Error fetching list of cinemas", error.message);
        throw error;
    }
}

const getAllCinemasNotPagination = async () => {
    try {
        const data = await Cinema.findAll();
        return {
            status: 200,
            success: true,
            error: false,
            data
        };
    } catch (error) {
        console.error("Error fetching list of cinemas", error.message);
        throw error;
    }
}

const getCinemasForDashboardByBranchService = async (id) => {
    try {
        const user = await User.findOne({ where: { id } });
        if (!user) {
            return { status: 404, message: "User not found" };
        }
        const cinemas = await Cinema.findAll({ where: { branch_id: user.branch_id } });
        return {
            status: 200,
            success: true,
            error: false,
            data: cinemas
        };
    } catch (error) {
        console.error("Error fetching cinema", error.message);
        throw error;
    }
}

// Lấy cinema theo id
const getCinema = async (id) => {
    try {
        const cinema = await Cinema.findOne({ where: { id } });
        return cinema;
    } catch (error) {
        console.error("Error fetching cinema", error.message);
        throw error;
    }
}
// Lấy cinema theo id
const getCinemaByBranchId = async (branch_id) => {
    try {
        const cinemas = await Cinema.findAll({ where: { branch_id } });        
        return cinemas;
    } catch (error) {
        console.error("Error fetching cinema", error.message);
        throw error;
    }
}

// Tạo cinema mới
const createCinema = async ({ name, city, district, ward, street, branch_id }) => {
    try {
        const cinema = await Cinema.create({ name, city, district, ward, street, branch_id });
        return cinema;
    } catch (error) {
        console.error("Error creating cinema", error.message);
        throw error;
    }
}

// Cập nhật thông tin cinema
const updateCinema = async ({ id, name, city, district, ward, street, branch_id }) => {
    try {
        const cinema = await Cinema.update(
            { name, city, district, ward, street, branch_id },
            { where: { id } }
        );
        return cinema;
    } catch (error) {
        console.error("Error updating cinema", error.message);
        throw error;
    }
}

// Xoá cinema
const deleteCinema = async (id) => {
    try {
        const cinema = await Cinema.destroy({ where: { id } });
        return cinema;
    } catch (error) {
        console.error("Error deleting cinema", error.message);
        throw error;
    }
}

const getAllCinemasForBoxchat = async () => {
    try {
        const cinemas = await Cinema.findAll();
        return cinemas;
    } catch (error) {
        console.error("Error fetching list of cinemas", error.message);
    }
}

module.exports = {
    getAllCinemas,
    getCinema,
    getCinemaByBranchId,
    createCinema,
    updateCinema,
    deleteCinema,
    getAllCinemasForBoxchat,
    getAllCinemasNotPagination,
    getCinemasForDashboardByBranchService
};
