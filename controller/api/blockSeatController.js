const { resErrors, resData } = require("../common/common");

class ApiBlockSeatController {
    static async index(req, res) {
        try {
            
        } catch (error) {
            console.error("Error blockSeat:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
}
module.exports = ApiBlockSeatController;