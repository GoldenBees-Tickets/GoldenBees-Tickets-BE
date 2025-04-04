const { HolidayDate } = require("../models");

const getHolidayDatesById = async (id) => {
    try {
        return await HolidayDate.findAll({ where: { id } });
    } catch (error) {
        console.error("Error creating holiday dates:", error.message);
        throw error;
    }
};

// Cập nhật thể loại phim
const updateHolidayDate = async ({ id, name }) => {
    try {
        return await HolidayDate.update({ name }, { where: { id } });
    } catch (error) {
        console.error("Error updating holiday date:", error.message);
        throw error;
    }
};


module.exports = {
    getHolidayDatesById,
    updateHolidayDate,
};
