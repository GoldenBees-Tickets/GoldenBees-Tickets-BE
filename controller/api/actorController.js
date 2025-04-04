// controller/api/actorController.js

const { resErrors } = require("../common/common");
const {
    getAllActors,
    getActor,
    createActor,
    updateActor,
    deleteActor
} = require("../../service/actorService");
const { uploadToCloudinary } = require("../../utils/cloudinary");
const uploadFolder="actors";
class ApiActorController {
    static async index(req, res) {
        try {
            const actors = await getAllActors();
            res.json({ message: "Get actors successfully", actors });
        } catch (error) {
            console.error("Error fetching actors:", error.message);
            resErrors(res, 500, "Internal Server Error");
        }
    }

    static async show(req, res) {
        try {
            const { id } = req.params;
            const actor = await getActor(id);

            if (actor) {
                res.json({ message: "Get actor successfully", actor });
            } else {
                resErrors(res, 404, "Actor not found");
            }
        } catch (error) {
            console.error("Error fetching actor:", error.message);
            resErrors(res, 500, "Internal Server Error");
        }
    }

    static async create(req, res) {
        try {
            const { name, dob, bio, gender } = req.body;
            const file = req.file;
            
            const uploadFileName = req.file.originalname.split('.')[0]; // Lấy tên file không có đuôi

            if (!name || !dob || !gender) {
                return resErrors(res, 400, "Name, dob, and gender are required.");
            }

            const url = await uploadToCloudinary(file, uploadFolder, uploadFileName);
            
            const profile_picture = url;
            const newActor = await createActor({ name, dob, bio, gender, profile_picture });

            res.json({ message: "Actor created successfully", actor: newActor });
        } catch (error) {
            console.error("Error creating actor:", error.message);
            resErrors(res, 500, "Internal Server Error");
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, dob, bio, gender } = req.body;
            const profile_picture = req.file ? req.file.path : undefined;
            const uploadFileName = fileName || file.originalname.split('.')[0]; // Lấy tên file không có đuôi

            const url = await uploadToCloudinary(profile_picture, uploadFolder, uploadFileName);

            const updated = await updateActor({ id, name, dob, bio, gender, profile_picture: url });

            if (updated) {
                res.json({ message: "Actor updated successfully" });
            } else {
                resErrors(res, 404, "Actor not found or no changes made");
            }
        } catch (error) {
            console.error("Error updating actor:", error.message);
            resErrors(res, 500, "Internal Server Error");
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const deleted = await deleteActor(id);

            if (deleted) {
                res.json({ message: "Actor deleted successfully" });
            } else {
                resErrors(res, 404, "Actor not found");
            }
        } catch (error) {
            console.error("Error deleting actor:", error.message);
            resErrors(res, 500, "Internal Server Error");
        }
    }
}

module.exports = ApiActorController;
