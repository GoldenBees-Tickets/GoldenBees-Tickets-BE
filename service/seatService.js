const { Seat } = require("../models");

// Lấy tất cả các phòng
const getAllSeat = async (room_id) => {
  try {
    const Seats = await Seat.findAll({where: {room_id}});
    return Seats;
  } catch (error) {
    console.error("Error fetching list of Seats:", error.message);
    throw error;
  }
};

// Lấy thông tin phòng theo ID
const getSeat = async (id) => {
  try {
    const Seat = await Seat.findOne({ where: { id } });
    return Seat;
  } catch (error) {
    console.error("Error fetching Seat:", error.message);
    throw error;
  }
};

// Tạo phòng mới
const createSeats = async ({ room_id, seats }) => {  
  try {
    const seatsWithRoomId = seats.map(seat => ({
        ...seat,
        room_id, // Gắn room_id vào mỗi ghế
      }));
  
      // Dùng bulkCreate để tạo nhiều bản ghi một lúc
      const createdSeats = await Seat.bulkCreate(seatsWithRoomId);
    return createdSeats;
  } catch (error) {
    console.error("Error creating Seat:", error.message);
    throw error;
  }
};

const updateSeats = async ( {seats} ) => {  
  try {

    // Sử dụng bulkCreate với updateOnDuplicate để cập nhật nhiều bản ghi cùng lúc
    const updatedSeats = await Seat.bulkCreate(seats, {
      updateOnDuplicate: ["is_enabled", "type_id", "seat_number"], // Cập nhật các cột cần thay đổi
    });

    return updatedSeats;
  } catch (error) {
    console.error("Error updating seats:", error.message);
    throw error;
  }
};

// Xóa phòng
const deleteSeat = async (id) => {
  try {
    const result = await Seat.destroy({ where: { id } });
    return result;
  } catch (error) {
    console.error("Error deleting Seat:", error.message);
    throw error;
  }
};

module.exports = {
  getAllSeat,
  getSeat,
  createSeats,
  updateSeats,
  deleteSeat,
};
