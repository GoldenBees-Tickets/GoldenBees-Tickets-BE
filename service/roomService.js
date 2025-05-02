const {
  sequelize,
  Room,
  Seat,
  Cinema,
  SeatStatus,
  BlockSeat,
} = require("../models");
const { Op } = require("sequelize");

// Lấy tất cả các phòng có phân trang
const getAllRoom = async (options = {}) => {
  try {
    const { page = 1, limit = 10, search = "", sort_order = "desc" } = options;

    // Tính offset cho phân trang
    const offset = (page - 1) * limit;

    // Xây dựng điều kiện tìm kiếm
    let whereClause = {};

    // Tìm kiếm theo tên phòng
    if (search) {
      whereClause.name = {
        [Op.like]: `%${search}%`,
      };
    }

    // Đếm tổng số phòng thỏa mãn điều kiện
    const { count } = await Room.findAndCountAll({
      where: whereClause,
      include: {
        model: Cinema,
        attributes: ["name"],
      },
      distinct: true,
    });

    // Lấy danh sách phòng với phân trang và sắp xếp
    const rooms = await Room.findAll({
      where: whereClause,
      include: {
        model: Cinema,
        attributes: ["name"],
      },
      limit,
      offset,
      order: [["name", sort_order.toUpperCase()]],
    });

    // Trả về dữ liệu kèm thông tin phân trang
    return {
      rooms,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit,
      },
    };
  } catch (error) {
    console.error("Error fetching list of rooms:", error.message);
    throw error;
  }
};

// Lấy thông tin phòng theo ID
// const getRoom = async (id) => {
//   try {
//     const room = await Room.findOne({
//       where: { id },
//       include: {
//         model: Seat
//       }
//     });
//     return room;
//   } catch (error) {
//     console.error("Error fetching room:", error.message);
//     throw error;
//   }
// };

const getRoom = async ({ id, showtime_id }) => {
  try {
    // Lấy thông tin phòng và danh sách ghế
    const room = await Room.findOne({
      where: { id },
      include: {
        model: Seat,
        attributes: [
          "id",
          "room_id",
          "seat_number",
          "seat_row",
          "is_enabled",
          "type_id",
        ],
      },
    });

    if (!room) {
      return { status: 404, message: "Room not found" };
    }

    // Lấy và log danh sách ID của tất cả ghế trong phòng
    const seatIds = room.Seats.map((seat) => seat.id);

    // Lấy trạng thái ghế từ SeatStatus (ghế đã đặt)
    const bookedSeats = await SeatStatus.findAll({
      where: {
        seat_id: { [Op.in]: seatIds },
        status: "Booked",
        showtime_id,
      },
      attributes: ["seat_id"],
    });

    // Lấy và log ghế đang giữ chỗ từ BlockSeat
    const blockedSeats = await BlockSeat.findAll({
      where: {
        seat_id: { [Op.in]: seatIds },
        expires_at: {
          [Op.gt]: new Date(),
        },
        showtime_id,
      },
      attributes: ["seat_id"],
    });

    // Chuyển danh sách về mảng ID và log
    const bookedSeatIds = bookedSeats.map((seat) => seat.seat_id);
    const blockedSeatIds = blockedSeats.map((seat) => seat.seat_id);

    // Gắn trạng thái vào từng ghế
    const seatsWithStatus = room.Seats.map((seat) => {
      const status = bookedSeatIds.includes(seat.id)
        ? "Booked"
        : blockedSeatIds.includes(seat.id)
        ? "Blocked"
        : "Available";

      return {
        id: seat.id,
        seat_number: seat.seat_number,
        seat_row: seat.seat_row,
        room_id: seat.room_id,
        is_enabled: seat.is_enabled,
        type_id: seat.type_id,
        status,
      };
    });

    return {
      id: room.id,
      name: room.name,
      columns_count: room.columns_count,
      Seats: seatsWithStatus,
    };
  } catch (error) {
    console.error("Error fetching room:", error.message);
    console.error("Error details:", error);
    throw error;
  }
};

const getRoomsByCinemaId = async (cinema_id) => {
  try {
    const room = await Room.findAll({
      where: { cinema_id },
    });
    return room;
  } catch (error) {
    console.error("Error fetching rooms:", error.message);
    throw error;
  }
};

const createRoom = async ({
  name,
  cinema_id,
  rows_count,
  columns_count,
  seats,
}) => {
  const transaction = await sequelize.transaction();

  try {
    const room = await Room.create(
      { name, cinema_id, rows_count, columns_count },
      { transaction }
    );

    if (seats && seats.length > 0) {
      const seatData = seats.map((seat) => ({
        room_id: room.id,
        seat_row: seat.seat_row,
        seat_number: seat.seat_number,
        is_enabled: seat.is_enabled,
        type_id: seat.type_id,
      }));

      await Seat.bulkCreate(seatData, { transaction });
    }

    await transaction.commit();
    return room;
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating room:", error.message);
    throw error;
  }
};

// Cập nhật thông tin phòng
const updateRoom = async ({ id, name }) => {
  try {
    const result = await Room.update({ name }, { where: { id } });
    return result;
  } catch (error) {
    console.error("Error updating room:", error.message);
    throw error;
  }
};

// Xóa phòng
const deleteRoom = async (id) => {
  try {
    const result = await Room.destroy({ where: { id } });
    return result;
  } catch (error) {
    console.error("Error deleting room:", error.message);
    throw error;
  }
};

const getAllRoomForBoxchat = async () => {
  try {

    const rooms = await Room.findAll({
      include: {
        model: Cinema,
        attributes: ['name']
      },
    });

    return {status: 200, rooms};
  } catch (error) {
    console.error("Error fetching list of rooms:", error.message);
    throw error;
  }
};

const getSeatByRoomIdService = async (room_id) => {
  try {
    const seats = await Seat.findAll({ where: { room_id } });
    return {
      status: 200,
      data: seats,
      success: true,
      message: "Get seats successfully",
      error: null,
    };
  } catch (error) {
    console.error("Error fetching seats:", error.message);
    throw error;
  }
};

module.exports = {
  getAllRoom,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomsByCinemaId,
  getAllRoomForBoxchat,
  getSeatByRoomIdService
};
