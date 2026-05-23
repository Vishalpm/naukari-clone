const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

// Ensure upload dirs exist
["uploads/resumes", "uploads/photos", "uploads/logos"].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "resume")       return cb(null, "uploads/resumes");
    if (file.fieldname === "profilePhoto") return cb(null, "uploads/photos");
    if (file.fieldname === "companyLogo")  return cb(null, "uploads/logos");
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "resume") {
    const allowed = [".pdf", ".doc", ".docx"];
    if (!allowed.includes(path.extname(file.originalname).toLowerCase())) {
      return cb(new Error("Resume must be PDF or DOC/DOCX"));
    }
  }
  if (["profilePhoto", "companyLogo"].includes(file.fieldname)) {
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];
    if (!allowed.includes(path.extname(file.originalname).toLowerCase())) {
      return cb(new Error("Photo must be JPG, PNG or WEBP"));
    }
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
