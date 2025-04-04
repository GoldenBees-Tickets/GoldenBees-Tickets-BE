const { resErrors, resData } = require("../common/common");
const { getAllGenres, getGenre, createGenre, updateGenre, deleteGenre } = require("../../service/genreService");

class ApiGenreController {
    static async index(req, res) {
        try {
            const genres = await getAllGenres();
            res.json({ message: "Get genres successfully", genres });
        } catch (error) {
            console.error("Error fetching genres:", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async show(req, res) {
        try {
            const { id } = req.params;
            const genre = await getGenre(id);
            if (genre) {
                res.json({ message: "Get genre successfully", genre });
            } else {
                resErrors(res, 404, "Genre not found");
            }
        } catch (error) {
            console.error("Error fetching genre:", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async create(req, res) {
        try {
            const { name } = req.body;
            const genre = await createGenre({ name });
            res.json({ message: "Genre created successfully", genre });
        } catch (error) {
            console.error("Error creating genre:", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;
            const updated = await updateGenre({ id, name });

            if (updated[0] === 0) {
                resErrors(res, 404, "Genre not found or no changes made");
            } else {
                res.json({ message: "Genre updated successfully" });
            }
        } catch (error) {
            console.error("Error updating genre:", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const deleted = await deleteGenre(id);

            if (deleted === 0) {
                resErrors(res, 404, "Genre not found");
            } else {
                res.json({ message: "Genre deleted successfully" });
            }
        } catch (error) {
            console.error("Error deleting genre:", error.message);
            resErrors(res, 500, error.message || "Internal Server Error");
        }
    }
}

module.exports = ApiGenreController;
