const { getAllSeatType, createSeatType, updateSeatType, deleteSeatType } = require("../../service/seatTypeService");
const { resErrors } = require("../common/common");

class ApiSeatTypeController {
    static async index(req, res) {
        try {
            const seat_types = await getAllSeatType();
            res.json({status: 200, message: "Get seat_types successfully", seat_types});
        } catch (error) {
            console.error("Error seat_types:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
    static async create(req, res) {
        try {
            const {type, color, price_offset} = req.body;            
            const data = await createSeatType({type, color, price_offset});
            const message = "Create seats successfully";
            res.json({message, data});
        } catch (error) {
            console.error("Error seat_type:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
    static async update(req, res) {
        try {
            const {id} = req.params;
            const {type, color, price_offset} = req.body;
            
            const data = await updateSeatType({id,type, color, price_offset});
            const message = "Update successfully";
            res.json({message, data});
        } catch (error) {
            console.error("Error seat:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
    static async delete(req, res) {
        try {
            const {id} = req.params;
            const delete_type = await deleteSeatType(id);
            const message = "Delete seat_type successfully";
            res.json({message, delete_type});
        } catch (error) {
            console.error("Error seat:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
}
module.exports = ApiSeatTypeController;