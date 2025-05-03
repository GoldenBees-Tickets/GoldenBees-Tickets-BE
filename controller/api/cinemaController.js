const { resErrors, resData } = require("../common/common");
const { getAllCinemas, createCinema, updateCinema, deleteCinema, getCinema, getCinemaByBranchId, getAllCinemasNotPagination, getCinemasForDashboardByBranchService } = require("../../service/cinemaService");

class ApiCinemaController {
    static async index(req, res) {
        try {
            // Lấy các tham số phân trang, tìm kiếm và sắp xếp từ request
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 5;
            const search = req.query.search || '';
            const sort_order = req.query.sort_order || 'desc';
            
            // Gọi service với các tham số
            const result = await getAllCinemas({ page, limit, search, sort_order });
            
            // Trả về dữ liệu với thông tin phân trang
            res.json({
                message: "Get cinemas successfully",
                cinemas: result.cinemas,
                pagination: result.pagination
            });
        } catch (error) {
            console.error("Error fetching cinemas", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async show(req, res) {
        try {
            const { id } = req.params;
            const cinema = await getCinema(id);
            if (cinema) {
                const message = "Get cinema successfully";
                res.json({ message, cinema });
            } else {
                resErrors(res, 404, "Cinema not found");
            }
        } catch (error) {
            console.error("Error fetching cinema", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async getByBranchId(req, res) {
        try {
            const branch_id = req.params.id;            
            const cinemas = await getCinemaByBranchId(branch_id);            
            const message = "Get cinemas successfully";
            res.json({ message, cinemas });
        } catch (error) {
            console.error("Error fetching cinema", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async getCinemasForDashboardByBranch(req, res) {
        try {
            const { id } = req.params;
            const cinemas = await getCinemasForDashboardByBranchService(id);            
            res.json(cinemas);
        } catch (error) {
            console.error("Error fetching cinema", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async create(req, res) {
        try {
            const { name, city, district, ward, street, branch_id } = req.body;
            const cinema = await createCinema({ name, city, district, ward, street, branch_id });
            res.json({ cinema });
        } catch (error) {
            console.error("Error creating cinema", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, city, district, ward, street, branch_id } = req.body;
            const cinema = await updateCinema({ id, name, city, district, ward, street, branch_id });
            if (cinema[0] === 0) {
                resErrors(res, 404, "Cinema not found or no changes made");
            } else {
                res.json({ message: "Cinema updated successfully", cinema });
            }
        } catch (error) {
            console.error("Error updating cinema", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const cinema = await deleteCinema(id);
            if (cinema === 0) {
                resErrors(res, 404, "Cinema not found");
            } else {
                res.json({ message: "Cinema deleted successfully" });
            }
        } catch (error) {
            console.error("Error deleting cinema", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async getAllCinemaNoPagination(req, res) {
        try {
            const data = await getAllCinemasNotPagination();
            res.json(data);
        } catch (error) {
            console.error("Error fetching all cinemas", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }
}

module.exports = ApiCinemaController;
