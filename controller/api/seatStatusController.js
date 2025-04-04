const { resErrors, resData } = require("../common/common");

class ApiSeatStatusController {
    static async index(req, res) {
        try {
            
        } catch (error) {
            console.error("Error seatStatus:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
}
module.exports = ApiSeatStatusController;