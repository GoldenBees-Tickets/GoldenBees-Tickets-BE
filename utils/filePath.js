import multer from "multer";

export const uploadDefault = () => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "public/uploads");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "_" + file.originalname);
    }
  });
  return multer({ storage: storage });
};
