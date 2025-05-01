const { resErrors } = require("../common/common");
const {
    getAllDirectors,
    getDirector,
    createDirector,
    updateDirector,
    deleteDirector,
    getDirectorsNotPage
} = require("../../service/directorService");
const { uploadToCloudinary } = require("../../utils/cloudinary");
const uploadFolder = 'directors';
class ApiDirectorController {
    static async index(req, res) {
        try {
            // Lấy các tham số phân trang, tìm kiếm, lọc và sắp xếp từ request
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 5;
            const search = req.query.search || '';
            const gender = req.query.gender || '';
            const sort_order = req.query.sort_order || 'desc';
            
            // Gọi service với các tham số
            const result = await getAllDirectors({ page, limit, search, gender, sort_order });
            
            // Trả về dữ liệu với thông tin phân trang
            res.json({
                message: "Get directors successfully",
                directors: result.directors,
                pagination: result.pagination
            });
        } catch (error) {
            console.error("Error fetching directors:", error.message);
            resErrors(res, 500, "Internal Server Error");
        }
    }

    static async getAll(req, res) {
        try {
            const data = await getDirectorsNotPage();
            res.json(data);
        } catch (error) {
            console.error("Error fetching all directors:", error.message);
            resErrors(res, 500, "Internal Server Error");
        }
    }   

    static async show(req, res) {
        try {
            const { id } = req.params;
            const director = await getDirector(id);

            if (director) {
                res.json({ message: "Get director successfully", director });
            } else {
                resErrors(res, 404, "Director not found");
            }
        } catch (error) {
            console.error("Error fetching director:", error.message);
            resErrors(res, 500, "Internal Server Error");
        }
    }

    static async create(req, res) {
        try {

            const { name, dob, bio, gender } = req.body;
            const file = req.file;            
            const uploadFileName = file.originalname.split('.')[0]; // Lấy tên file không có đuôi

            const profile_picture = await uploadToCloudinary(file, uploadFolder, uploadFileName);
            
            if (!name || !dob || !gender) {
                return resErrors(res, 400, "Name, dob, and gender are required.");
            }

            const newDirector = await createDirector({ name, dob, bio, gender, profile_picture });
            res.json({ message: "Director created successfully", director: newDirector });
        } catch (error) {
            console.error("Error creating director:", error.message);
            resErrors(res, 500, "Internal Server Error");
        }
    }


    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, dob, bio, gender } = req.body;
                
            const file = req.file;
            if(file) {
                const uploadFileName = file.originalname.split('.')[0]; // Lấy tên file không có đuôi

                const url = await uploadToCloudinary(file, uploadFolder, uploadFileName);
    
                const profile_picture = url;
                const updated = await updateDirector({ id, name, dob, bio, gender, profile_picture });
                return res.json({ message: "Director updated successfully", director: updated });
            }
            const updated = await updateDirector({ id, name, dob, bio, gender });

            if (updated) {
                res.json({ message: "Director updated successfully" });
            } else {
                resErrors(res, 404, "Director not found or no changes made");
            }
        } catch (error) {
            console.error("Error updating director:", error.message);
            resErrors(res, 500, "Internal Server Error");
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const deleted = await deleteDirector(id);

            if (deleted) {
                res.json({ message: "Director deleted successfully" });
            } else {
                resErrors(res, 404, "Director not found");
            }
        } catch (error) {
            console.error("Error deleting director:", error.message);
            resErrors(res, 500, "Internal Server Error");
        }
    }
}

module.exports = ApiDirectorController;
