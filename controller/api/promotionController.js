const { resErrors, resData } = require("../common/common");
const { getAllPromotions, createPromotion, updatePromotion, deletePromotion, getPromotion, checkPromotionCode } = require("../../service/promotionService");

class ApiPromotionController {
    static async index(req, res) {
        try {
            const promotions = await getAllPromotions();
            const message = "Get promotions successfully";
            res.json({ message, promotions });
        } catch (error) {
            console.error("Error fetching promotions", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async show(req, res) {
        try {
            const { id } = req.params;
            const promotion = await getPromotion(id);
            if (promotion) {
                const message = "Get promotion successfully";
                res.json({ message, promotion });
            } else {
                resErrors(res, 404, "Promotion not found");
            }
        } catch (error) {
            console.error("Error fetching promotion", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async create(req, res) {
        try {
            const { 
                name, description, 
                start_date, end_date, 
                discount_type, discount_value, 
                applicable_to, min_order_value,
                max_discount, usage_limit, 
                per_user_limit, code
            } = req.body;

            const promotion = await createPromotion({ 
                name, description, 
                start_date, end_date, 
                discount_type, discount_value, 
                applicable_to, min_order_value,
                max_discount, usage_limit, 
                per_user_limit, code
            });
            res.json(promotion);
        } catch (error) {
            console.error("Error creating promotion", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async update(req, res) {
        try {
            
            const { id } = req.params;
            const { name, description, end_date} = req.body;
            const promotion = await updatePromotion({ id, name, description, end_date });

            res.json(promotion);
        } catch (error) {
            console.error("Error updating promotion", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const promotion = await deletePromotion(id);
            if (promotion === 0) {
                resErrors(res, 404, "Promotion not found");
            } else {
                res.json({ message: "Promotion deleted successfully" });
            }
        } catch (error) {
            console.error("Error deleting promotion", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async checkPromotion(req, res) {
        try {
            const { code, user_id } = req.body;
            const promotion = await checkPromotionCode({code, user_id});
            res.json(promotion);
        } catch (error) {
            console.error("Error checking promotion code", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }
}

module.exports = ApiPromotionController;
