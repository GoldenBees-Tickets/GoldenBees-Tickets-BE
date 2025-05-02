const { createPriceSetting, getAllPriceSettings, updatePriceSetting, updateHolidayDate, createHolidayDate, getAllHolidayDates } = require("../../service/priceSettingService");
const { resErrors, resData } = require("../common/common");

class ApiPriceSettingController {
    static async index(req, res) {
        try {
            const data = await getAllPriceSettings();
            res.json(data);
        } catch (error) {
            console.error("Error priceSetting:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const { base_ticket_price, weekend_ticket_price, holiday_ticket_price } = req.body;
            const data = await updatePriceSetting({ id, base_ticket_price, weekend_ticket_price, holiday_ticket_price });
            res.json(data);
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
            } = req.body;
            const data = await createPriceSetting({base_ticket_price,
                weekend_ticket_price,
                holiday_ticket_price,
                });
                res.json(data);
        } catch (error) {
            console.error("Error priceSetting:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }

    static async createHolidayDateController(req, res) {
        try {
            const { holidays } = req.body;
            const data = await createHolidayDate(holidays);
            res.json(data);
        } catch (error) {
            console.error("Error priceSetting:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }

    static async updateHolidayDateController(req, res) {
        try {
            const { id } = req.params;
            const { holiday_date, holiday_name } = req.body;
            const data = await updateHolidayDate({id, holiday_date, holiday_name});
            res.json(data);
        } catch (error) {
            console.error("Error priceSetting:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }

    static async getAllHolidayDateController(req, res) {
        try {
            const data = await getAllHolidayDates();
            res.json(data);
        } catch (error) {
            console.error("Error priceSetting:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
}
module.exports = ApiPriceSettingController;