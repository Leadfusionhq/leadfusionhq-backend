const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createMulter = (folderName) => {
  // Save inside public/uploads
  const uploadDir = path.join(__dirname, `../../public/uploads/${folderName}`);

  // Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png allowed"), false);
    }
  };

  return multer({ storage, fileFilter });
};

module.exports = createMulter;
