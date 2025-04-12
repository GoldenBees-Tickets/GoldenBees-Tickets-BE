const { where } = require("sequelize");
const { SeatType } = require("../models");
const { Op } = require('sequelize');

const getAllSeatType = async (options = {}) => {
  try {
    const { page = 1, limit = 5, search = '', sort_order = 'desc' } = options;
    
    // Tính toán offset cho phân trang
    const offset = (page - 1) * limit;
    
    // Xây dựng điều kiện tìm kiếm
    let whereClause = {};
    
    // Tìm kiếm theo loại ghế hoặc màu sắc
    if (search) {
      whereClause = {
        [Op.or]: [
          { type: { [Op.like]: `%${search}%` } },
          { color: { [Op.like]: `%${search}%` } }
        ]
      };
    }
    
    // Đếm tổng số loại ghế thỏa mãn điều kiện
    const { count } = await SeatType.findAndCountAll({
      where: whereClause,
      distinct: true
    });
    
    // Lấy dữ liệu loại ghế với phân trang và sắp xếp
    const seat_types = await SeatType.findAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [
        ['type', sort_order.toUpperCase()]
      ]
    });
    
    // Tính toán thông tin phân trang
    const totalPages = Math.ceil(count / limit);
    
    return {
      seat_types,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        limit
      }
    };
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

// Xóa loại ghế
const deleteSeatType = async (id) => {
  try {
    const result = await SeatType.destroy({ where: { id } });
    return result;
  } catch (error) {
    console.error("Error deleting seat_type:", error.message);
    throw error;
  }
};

const getAllSeatTypeForBoxchat = async () => {
  try {
    const seat_types = await SeatType.findAll();
    return seat_types;
  } catch (error) {
    console.error("Error fetching list of seat_type:", error.message);
    throw error;
  }
};

module.exports = {
  getAllSeatType,
  createSeatType,
  updateSeatType,
  deleteSeatType,
  getAllSeatTypeForBoxchat
};
