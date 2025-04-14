const { resErrors, resData } = require("../common/common");
const { getAllGenres, getGenre, createGenre, updateGenre, deleteGenre, getAllGenresForDashboard } = require("../../service/genreService");

class ApiGenreController {
    static async index(req, res) {
        try {
            const { page = 1, limit = 5, search = '' } = req.query;
            const result = await getAllGenres(parseInt(page), parseInt(limit), search);
            const message = "Get genres is successfully";
            res.json({ message, ...result });
        } catch (error) {
            console.error("Error fetching genre data:", error);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async show(req, res) {
        try {
            const { id } = req.params;
            const genre = await getGenre(id);
            res.json(genre);
        } catch (error) {
            console.error("Error fetching genre:", error);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async create(req, res) {
        try {
            const { name, description } = req.body;
            const genre = await createGenre({ name, description });
            res.json(genre);
        } catch (error) {
            console.error("Error creating genre:", error);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            const genre = await updateGenre(id, { name, description });
            res.json(genre);
        } catch (error) {
            console.error("Error updating genre:", error);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const result = await deleteGenre(id);
            res.json(result);
        } catch (error) {
            console.error("Error deleting genre:", error);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async getAllForDashboard(req, res) {
        try {
            const data = await getAllGenresForDashboard();
            res.json(data);
        } catch (error) {
            console.error("Error fetching genres:", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }
}

module.exports = ApiGenreController;
