const { resErrors, resData } = require("../common/common");

class ApiReviewController {
    static async index(req, res) {
        try {
            
        } catch (error) {
            console.error("Error review:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
}
module.exports = ApiReviewController;