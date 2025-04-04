const { createPriceSetting, getAllPriceSettingByBranchId } = require("../../service/priceSettingService");
const { resErrors, resData } = require("../common/common");

class ApiPriceSettingController {
    static async index(req, res) {
        try {
            const branch_id = req.params.id;            
            const data = await getAllPriceSettingByBranchId(branch_id);
            
            const message = "Get data successfully";
            resData(res, 200, message, data);
        } catch (error) {
            console.error("Error priceSetting:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }

    static async create(req, res) {
        try {
            const {
                base_ticket_price,
                weekend_ticket_price,
                holiday_ticket_price,
                branch_id,
                holidays
            } = req.body;
            const data = await createPriceSetting({base_ticket_price,
                weekend_ticket_price,
                holiday_ticket_price,
                branch_id,
                holidays});
                res.json(data);
        } catch (error) {
            console.error("Error priceSetting:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
}
module.exports = ApiPriceSettingController;