const multer = require("multer");
const cloudinary = require("./cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "organization_files",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "svg"]
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
