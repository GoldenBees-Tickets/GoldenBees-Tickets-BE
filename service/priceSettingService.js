const { PriceSetting, HolidayDate, sequelize } = require("../models");

const createPriceSetting = async ({
    base_ticket_price,
    weekend_ticket_price,
    holiday_ticket_price,
    branch_id,
    holidays
}) => {
    const transaction = await sequelize.transaction(); 

    try {
        const holidayDates = await HolidayDate.bulkCreate(
            holidays.map(({ holiday_date, holiday_name }) => ({
                branch_id,
                holiday_date,
                holiday_name
            })),
            { transaction } 
        );

        const priceSetting = await PriceSetting.create(
            { branch_id, base_ticket_price, weekend_ticket_price, holiday_ticket_price },
            { transaction }
        );

        await transaction.commit();
        const message = "Cập nhật giá thành công";
        return {status: 200, message,  priceSetting, holidayDates };

    } catch (error) {
        // 4. Nếu có lỗi, rollback transaction
        await transaction.rollback();
        console.error("Error creating price setting:", error.message);
        throw error;
    }
};


const getAllPriceSettingByBranchId = async (branch_id) => {
    try {        
        // Lấy dữ liệu từ bảng PriceSetting (chỉ 1 dòng)
        const priceSetting = await PriceSetting.findOne({
            where: { branch_id }
        });

        // Lấy danh sách ngày lễ từ bảng HolidayDate
        const holidayDates = await HolidayDate.findAll({
            where: { branch_id }
        });

        // Nếu không có priceSetting, trả về null
        if (!priceSetting) return null;

        // Gán danh sách ngày lễ vào priceSetting
        return {
            ...priceSetting.toJSON(),  // Chuyển priceSetting thành object thuần
            holidayDates                // Thêm danh sách ngày lễ
        };
    } catch (error) {
        console.error("Error getting price settings and holiday dates:", error.message);
        throw error;
    }
};


const updateHolidayDate = async ({ id, name }) => {
    try {
        return await HolidayDate.update({ name }, { where: { id } });
    } catch (error) {
        console.error("Error updating holiday date:", error.message);
        throw error;
    }
};


module.exports = {
    createPriceSetting,
    getAllPriceSettingByBranchId,
    updateHolidayDate,
};
