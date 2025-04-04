const { resErrors, resData } = require("../common/common");
const { getAllCinemas, createCinema, updateCinema, deleteCinema, getCinema, getCinemaByBranchId } = require("../../service/cinemaService");

class ApiCinemaController {
    static async index(req, res) {
        try {
            const cinemas = await getAllCinemas();
            const message = "Get cinemas successfully";
            res.json({ message, cinemas });
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
}

module.exports = ApiCinemaController;
