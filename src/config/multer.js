const multer    = require("multer");
const path      = require("path");
const multerS3  = require("multer-s3");
const { s3 }    = require("./s3");

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
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  storage: multerS3({
    s3,
    bucket:      process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      // Store under a folder per type, keep it organised in S3
      let folder = "others";
      if (file.fieldname === "resume")       folder = "resumes";
      if (file.fieldname === "profilePhoto") folder = "photos";
      if (file.fieldname === "companyLogo")  folder = "logos";

      const unique  = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext     = path.extname(file.originalname).toLowerCase();
      const key     = `${folder}/${unique}${ext}`;  // e.g. photos/1234567890-123456789.jpg
      cb(null, key);
    },
  }),
});

module.exports = upload;