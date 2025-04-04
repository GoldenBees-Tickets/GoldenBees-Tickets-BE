const { resErrors, resData } = require("../../controller/common/common");

class ApiPaymentSettingController {
    static async index(req, res) {
        try {
            // Thêm logic xử lý ở đây
            return resData(res, 200, "Success", { message: "Payment settings retrieved successfully" });
        } catch (error) {
            console.error("Error paymentSetting:", error);
            return resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
}

module.exports = ApiPaymentSettingController;