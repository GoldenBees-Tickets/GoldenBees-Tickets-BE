const { where } = require("sequelize");
const { Cinema } = require("../models");

// Lấy tất cả các cinema
const getAllCinemas = async () => {
    try {
        const cinemas = await Cinema.findAll();
        return cinemas;
    } catch (error) {
        console.error("Error fetching list of cinemas", error.message);
    }
}

// Lấy cinema theo id
const getCinema = async (id) => {
    try {
        const cinema = await Cinema.findOne({ where: { id } });
        return cinema;
    } catch (error) {
        console.error("Error fetching cinema", error.message);
    }
}
// Lấy cinema theo id
const getCinemaByBranchId = async (branch_id) => {
    try {
        const cinemas = await Cinema.findAll({ where: { branch_id } });        
        return cinemas;
    } catch (error) {
        console.error("Error fetching cinema", error.message);
    }
}

// Tạo cinema mới
const createCinema = async ({ name, city, district, ward, street, branch_id }) => {
    try {
        const cinema = await Cinema.create({ name, city, district, ward, street, branch_id });
        return cinema;
    } catch (error) {
        console.error("Error creating cinema", error.message);
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
    }
}

// Xoá cinema
const deleteCinema = async (id) => {
    try {
        const cinema = await Cinema.destroy({ where: { id } });
        return cinema;
    } catch (error) {
        console.error("Error deleting cinema", error.message);
    }
}

module.exports = {
    getAllCinemas,
    getCinema,
    getCinemaByBranchId,
    createCinema,
    updateCinema,
    deleteCinema,
};
