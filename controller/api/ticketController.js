const { resErrors, resData } = require("../common/common");

class ApiTicketController {
    static async index(req, res) {
        try {
            
        } catch (error) {
            console.error("Error ticket:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
}
module.exports = ApiTicketController;