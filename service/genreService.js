const { error } = require("console");
const { Genre } = require("../models");
const { Op } = require("sequelize");

// Lấy tất cả thể loại phim
const getAllGenres = async (page = 1, limit = 5, search = '') => {
    try {
        const offset = (page - 1) * limit;
        const whereClause = search ? {
            [Op.or]: [
                { name: { [Op.like]: `%${search}%` } },
            ]
        } : {};

        const { count, rows: genres } = await Genre.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        return {
            success: true,
            error: null,
            genres,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            }
        };
    } catch (error) {
        console.error("Error fetching list genres", error);
        throw error;
    }
};

const getAllGenresForDashboard = async () => {
    try {
        const data = await Genre.findAll({
            order: [['createdAt', 'DESC']]
        });
        return {
            status: 200,
            success: true,
            error: null,
            data,
        };
    } catch (error) {
        console.error("Error fetching list genres", error);
        throw error;
    }
}
// Lấy thể loại phim theo ID
const getGenre = async (id) => {
    try {
        const genre = await Genre.findOne({ where: { id } });
        return {
            status: 200,
            success: true,
            error: null,
            genre,
        };
    } catch (error) {
        console.error("Error fetching Genre", error);
        throw new Error("Error", error.message);
    }
};

// Tạo thể loại phim mới
const createGenre = async ({ name, description }) => {
    try {
        const genre = await Genre.create({ name, description });
        return {
            status: 200,
            success: true,
            error: null,
            genre,
            message: "Thể loại phim đã được tạo thành công",
        };
    } catch (error) {
        console.error("Error creating Genre", error);
        throw new Error("Error", error.message);
    }
};

// Cập nhật thể loại phim
const updateGenre = async (id, { name, description }) => {
    try {
        const genre = await Genre.findOne({ where: { id } });
        if (!genre) {
            throw new Error("Genre not found");
        }

        await genre.update({ name, description });
        return {
            status: 200,
            success: true,
            error: null,
            message: "Thể loại phim đã được cập nhật thành công",
        };
    } catch (error) {
        console.error("Error updating Genre", error);
        throw new Error("Error", error.message);
    }
};

// Xoá thể loại phim
const deleteGenre = async (id) => {
    try {
        const genre = await Genre.findOne({ where: { id } });
        if (!genre) {
            throw new Error("Genre not found");
        }

        await genre.destroy();
        return {
            status: 200,
            success: true,
            error: null,
            message: "Thể loại phim đã được xóa thành công",
        };
    } catch (error) {
        console.error("Error deleting Genre", error);
        throw new Error("Error", error.message);
    }
};

const getAllGenresForBoxchat = async () => {
    try {
        return await Genre.findAll();
    } catch (error) {
        console.error("Error fetching genres:", error.message);
        throw error;
    }
};

module.exports = {
    getAllGenres,
    getGenre,
    createGenre,
    updateGenre,
    deleteGenre,
    getAllGenresForBoxchat,
    getAllGenresForDashboard
};
