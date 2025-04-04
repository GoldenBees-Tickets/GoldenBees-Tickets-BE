const { resErrors } = require("../common/common");
const {
  getAllProducers,
  getProducer,
  createProducer,
  updateProducer,
  deleteProducer,
} = require("../../service/producerService");
const { uploadToCloudinary, deleteFromCloudinary } = require("../../utils/cloudinary");

const uploadFolder = "producers";
class ApiProducerController {
  static async index(req, res) {
    try {
      const producers = await getAllProducers();
      res.json({ message: "Get producers successfully", producers });
    } catch (error) {
      console.error("Error fetching producers:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async show(req, res) {
    try {
      const { id } = req.params;
      const producer = await getProducer(id);

      if (producer) {
        res.json({ message: "Get producer successfully", producer });
      } else {
        resErrors(res, 404, "Producer not found");
      }
    } catch (error) {
      console.error("Error fetching producer:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async create(req, res) {
    try {
      const { name, bio } = req.body;

      const file = req?.file;
      const uploadFileName = file?.originalname.split(".")[0]; // Lấy tên file không có đuôi

      const profile_picture = await uploadToCloudinary(
        file,
        uploadFolder,
        uploadFileName
      );

      const newProducer = await createProducer({ name, bio, profile_picture });
      res.json(newProducer);
    } catch (error) {
      console.error("Error creating producer:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, bio } = req.body;

      let profile_picture; // Mặc định không thay đổi ảnh
      const file = req?.file;

      if (file) { // Chỉ upload ảnh nếu có file mới
        const uploadFileName = file.originalname.split(".")[0]; // Lấy tên file không có đuôi
        profile_picture = await uploadToCloudinary(file, uploadFolder, uploadFileName);
      }

      const updated = await updateProducer({ id, name, bio, profile_picture });

      res.json(updated);
    } catch (error) {
      console.error("Error updating producer:", error.message);
      resErrors(res, 500, "Internal Server Error");
    }
}


static async delete(req, res) {
  try {
      const { id } = req.params;

      // Lấy thông tin Producer trước khi xóa
      const producer = await getProducer(id);
      if (!producer) {
          return resErrors(res, 404, "Producer not found");
      }

      // Nếu có ảnh, xóa ảnh trên Cloudinary trước
      if (producer.profile_picture) {
          await deleteFromCloudinary(producer.profile_picture);
      }

      // Xóa Producer trong database
      const deleted = await deleteProducer(id);

      res.json(deleted);
  } catch (error) {
      console.error("Error deleting producer:", error.message);
      resErrors(res, 500, "Internal Server Error");
  }
}
}

module.exports = ApiProducerController;
