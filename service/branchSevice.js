const { where } = require("sequelize");
const { Branch } = require("../models");

// Lấy tất cả các chi nhánh
const getAllBranches = async () => {
    try {
        const branches = await Branch.findAll();
        return branches;
    } catch (error) {
        console.error("Error fetching list of branches", error.message);
    }
}

// Lấy chi nhánh theo id
const getBranch = async (id) => {
    try {
        const branch = await Branch.findOne({ where: { id } });
        return branch;
    } catch (error) {
        console.error("Error fetching branch", error.message);
    }
}

// Tạo chi nhánh mới
const createBranch = async ({ name, city }) => {
    try {
        const branch = await Branch.create({ name, city });
        return branch;
    } catch (error) {
        console.error("Error creating branch", error.message);
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
    }
}

// Xoá chi nhánh
const deleteBranch = async (id) => {
    try {
        const branch = await Branch.destroy({ where: { id } });
        return branch;
    } catch (error) {
        console.error("Error deleting branch", error.message);
    }
}

module.exports = {
    getAllBranches,
    getBranch,
    createBranch,
    updateBranch,
    deleteBranch,
};
