const { getAllReviews, getReviewByMovieId, createReview } = require("../../service/reviewService");
const { resErrors, resData } = require("../common/common");

class ApiReviewController {
    static async index(req, res) {
        try {
            const page = req.query.page || null;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || "";
            const sort_order = req.query.sort_order || "desc";
            
            const data = await getAllReviews({ page, limit, search, sort_order });
            res.json(data);
        } catch (error) {
            console.error("Error review:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
    static async show(req, res) {
        try {
            const { id } = req.params;
            const data = await getReviewByMovieId(id);
            res.json(data);
        } catch (error) {
            console.error("Error review:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }

    static async create(req, res) {
        try {
            const { user_id, movie_id, rating } = req.body;
            const data = await createReview({ user_id, movie_id, rating });
            res.json(data);
        } catch (error) {
            console.error("Error review:", error);
            resErrors(res, 500, error.message || "Internal Server Error");  
        }
    }
}
module.exports = ApiReviewController;