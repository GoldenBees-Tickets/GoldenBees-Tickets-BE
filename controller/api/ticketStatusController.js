const { resErrors, resData } = require("../common/common");

class ApiTicketStatusController {
    static async index(req, res) {
        try {
            
        } catch (error) {
            console.error("Error ticketStatus:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
}
module.exports = ApiTicketStatusController;