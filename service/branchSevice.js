const { where } = require("sequelize");
const { Branch } = require("../models");
const { Op } = require('sequelize');

// Lấy tất cả các chi nhánh với phân trang, tìm kiếm và sắp xếp
const getAllBranches = async (options = {}) => {
    try {
        const { page = 1, limit = 5, search = '', sort_order = 'desc' } = options;
        
        // Tính toán offset cho phân trang
        const offset = (page - 1) * limit;
        
        // Xây dựng điều kiện tìm kiếm
        let whereClause = {};
        
        // Tìm kiếm theo tên chi nhánh hoặc thành phố
        if (search) {
            whereClause = {
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { city: { [Op.like]: `%${search}%` } }
                ]
            };
        }
        
        // Đếm tổng số chi nhánh thỏa mãn điều kiện
        const { count } = await Branch.findAndCountAll({
            where: whereClause,
            distinct: true
        });
        
        // Lấy dữ liệu chi nhánh với phân trang và sắp xếp
        const branches = await Branch.findAll({
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
            branches,
            pagination: {
                total: count,
                totalPages,
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error("Error fetching list of branches", error.message);
        throw error;
    }
}

// Lấy chi nhánh theo id
const getBranch = async (id) => {
    try {
        const branch = await Branch.findOne({ where: { id } });
        return branch;
    } catch (error) {
        console.error("Error fetching branch", error.message);
        throw error;
    }
}

// Tạo chi nhánh mới
const createBranch = async ({ name, city }) => {
    try {
        const branch = await Branch.create({ name, city });
        return branch;
    } catch (error) {
        console.error("Error creating branch", error.message);
        throw error;
    }
}

// Cập nhật thông tin chi nhánh
const updateBranch = async ({ id, name, city }) => {
    try {
        const branch = await Branch.update(
            { name, city },
            { where: { id } }
        );
        return branch;
    } catch (error) {
        console.error("Error updating branch", error.message);
        throw error;
    }
}

// Xoá chi nhánh
const deleteBranch = async (id) => {
    try {
        const branch = await Branch.destroy({ where: { id } });
        return branch;
    } catch (error) {
        console.error("Error deleting branch", error.message);
        throw error;
    }
}

const getAllBranchesForBoxchat = async () => {
    try {
        const branches = await Branch.findAll();
        return branches;
    } catch (error) {
        console.error("Error fetching list of branches", error.message);
    }
}

module.exports = {
    getAllBranches,
    getBranch,
    createBranch,
    updateBranch,
    deleteBranch,
    getAllBranchesForBoxchat
};
