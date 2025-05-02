const { resErrors, resData } = require("../common/common");
const {
  getAllRoom,
  getRoom,
  createRoom,
  updateRoom,
  getRoomsByCinemaId,
  getSeatByRoomIdService
} = require("../../service/roomService");

class ApiRoomController {
  static async index(req, res) {
    try {
      // Lấy các tham số phân trang, tìm kiếm và sắp xếp từ request
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const sort_order = req.query.sort_order || 'desc';
      
      // Gọi service với các tham số
      const result = await getAllRoom({ page, limit, search, sort_order });
      
      // Trả về dữ liệu với thông tin phân trang
      res.json({
        message: "Get all rooms successfully",
        rooms: result.rooms,
        pagination: result.pagination
      });
    } catch (error) {
      console.error("Error fetching rooms:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async show(req, res) {
    try {      
      const { id } = req.params;
      const { showtime_id } = req.query; // Lấy showtime_id từ query parameter
      const room = await getRoom({id, showtime_id});
      resData(res, 200, "Get room successfully", room);
    } catch (error) {
      console.error("Error fetching room:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }
  static async getSeatsByRoomId(req, res) {
    try {
      const { id } = req.params;
      const seats = await getSeatByRoomIdService(id);
      res.json(seats)
    } catch (error) {
      console.error("Error fetching seats:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }
  static async showByCinemaId(req, res) {
    try {
      const cinema_id = req.params.id;
      const rooms = await getRoomsByCinemaId(cinema_id);
      resData(res, 200, "Get rooms successfully", rooms);
    } catch (error) {
      console.error("Error fetching room:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async create(req, res) {
    try {
      const { name, cinema_id, rows_count, columns_count, seats } = req.body;

      const room = await createRoom({
        name,
        cinema_id,
        rows_count,
        columns_count,
        seats,
      });

      res.json({ message: "Create room successfully", room });
    } catch (error) {
      console.error("Error creating room:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const result = await updateRoom({ id, name });

      resData(res, 200, "Room updated successfully", result);
    } catch (error) {
      console.error("Error updating room:", error.message);
      resErrors(res, 500, error.message || "Internal Server Error");
    }
  }
}
module.exports = ApiRoomController;
