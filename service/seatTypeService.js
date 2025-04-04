const { where } = require("sequelize");
const { SeatType } = require("../models");

const getAllSeatType = async () => {
  try {
    const seat_types = await SeatType.findAll();
    return seat_types;
  } catch (error) {
    console.error("Error fetching list of seat_type:", error.message);
    throw error;
  }
};

const createSeatType = async ({ type, color, price_offset }) => {    
  try {
    const seat_type = await SeatType.create({type, color, price_offset});
    return seat_type;
  } catch (error) {
    console.error("Error creating seat_type:", error.message);
    throw error;
  }
};

const updateSeatType = async ({ id, type, color, price_offset }) => {
  try {
    const seat_type = await SeatType.update({ type, color, price_offset}, {where: {id}});
    return seat_type;
  } catch (error) {
    console.error("Error updating seat_type:", error.message);
    throw error;
  }
};

// Xóa phòng
const deleteSeatType = async (id) => {
  try {
    const result = await SeatType.destroy({ where: { id } });
    return result;
  } catch (error) {
    console.error("Error deleting seat_type:", error.message);
    throw error;
  }
};

module.exports = {
  getAllSeatType,
  createSeatType,
  updateSeatType,
  deleteSeatType,
};
