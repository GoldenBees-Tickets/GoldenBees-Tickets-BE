const { PriceSetting, HolidayDate } = require("../models");

const createPriceSetting = async ({
    base_ticket_price,
    weekend_ticket_price,
    holiday_ticket_price,
}) => {

    try {
        const data = await PriceSetting.create(
            { base_ticket_price, weekend_ticket_price, holiday_ticket_price },
        );

        return {
            status: 200,
            message: "Tạo cài đặt giá vé thành công",
            data: data,
            success: true,
            error: null,
        };
    } catch (error) {
        console.error("Error creating price setting:", error.message);
        throw error;
    }
};

const createHolidayDate = async (holidays) => {
    try {
        const holidayDates = await HolidayDate.bulkCreate(
            holidays.map(({ holiday_date, holiday_name }) => ({
                holiday_date,
                holiday_name
            }))
        );
        return {
            status: 200,
            message: "Tạo ngày lễ thành công",
            data: holidayDates,
            success: true,
            error: null,
        }
    } catch (error) {
        console.error("Error creating holiday date:", error.message);
        throw error;
    }
};

const updatePriceSetting = async ({id, base_ticket_price, weekend_ticket_price, holiday_ticket_price}) => {
    try {
        return await PriceSetting.update(
            { base_ticket_price, weekend_ticket_price, holiday_ticket_price },
            { where: { id } }
        );
    }
    catch (error) {
        console.error("Error updating price setting:", error.message);
        throw error;
    }   
}

const getAllPriceSettings = async () => {
    try {        
        const data = await PriceSetting.findAll();
        return {
            status: 200,
            message: "Lấy danh sách giá vé thành công",
            data: data,
            success: true,
            error: null,
        }
    } catch (error) {
        console.error("Error getting price settings and holiday dates:", error.message);
        throw error;
    }
};

const getAllHolidayDates = async () => {
    try {
        const data = await HolidayDate.findAll();
        return {
            status: 200,
            message: "Lấy danh sách ngày lễ thành công",
            data: data,
            success: true,
            error: null,
        }
    } catch (error) {
        console.error("Error getting holiday dates:", error.message);
        throw error;
    }
}


const updateHolidayDate = async ({ id, holiday_date, holiday_name }) => {
    try {
        return await HolidayDate.update({ holiday_date, holiday_name }, { where: { id } });
    } catch (error) {
        console.error("Error updating holiday date:", error.message);
        throw error;
    }
};


module.exports = {
    createPriceSetting,
    getAllPriceSettings,
    updateHolidayDate,
    updatePriceSetting,
    createHolidayDate,
    getAllHolidayDates
};
