const { getHolidayDatesById, updateHolidayDate } = require("../../service/holidayDayService");
const { resErrors, resData } = require("../common/common");

class ApiHolidayDateController {
    static async index(req, res) {
        try {
            const holidayDates = await getHolidayDatesById();
            res.json({ message: "Get holiday dates successfully", data: holidayDates });
        } catch (error) {
            console.error("Error fetching genres:", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const {name} = req.body;
            const holidayDates = await updateHolidayDate({id, name});
            res.json({ message: "Get holiday date successfully", data: holidayDates });
        } catch (error) {
            console.error("Error fetching holiday date:", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }
}

module.exports = ApiHolidayDateController;
