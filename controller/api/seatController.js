const { getAllSeat, createSeats, updateSeats } = require("../../service/seatService");
const { resErrors, resData } = require("../common/common");

class ApiSeatController {
    static async index(req, res) {
        try {
            const {room_id} = req.params.id;
            const seats = await getAllSeat(room_id);
            const message = "Get seats successfully";
            res.json({message, seats});
        } catch (error) {
            console.error("Error seat:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
    static async create(req, res) {
        try {
            const {room_id, seats} = req.body;            
            const seatsData = await createSeats({room_id,seats});
            const message = "Create seats successfully";
            res.json({message, seatsData});
        } catch (error) {
            console.error("Error seat:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
    static async update(req, res) {
        try {
            const seats= req.body;            
            const data = await updateSeats({seats});
            const message = "Update successfully";
            res.json({message, data});
        } catch (error) {
            console.error("Error seat:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
}
module.exports = ApiSeatController;