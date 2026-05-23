const express    = require("express");
const router     = express.Router();
const upload     = require("../../config/multer");
const { authenticate, authorizeRoles } = require("../../middlewares/auth.middleware");
const seekerCtrl   = require("./seeker.controller");
const recruiterCtrl = require("./recruiter.controller");

router.use(authenticate);

// ── Seeker ────────────────────────────────────────────────
router.get("/seeker",
  authorizeRoles("job_seeker"),
  seekerCtrl.getProfile
);
router.put("/seeker",
  authorizeRoles("job_seeker"),
  upload.fields([{ name: "resume", maxCount: 1 }, { name: "profilePhoto", maxCount: 1 }]),
  seekerCtrl.updateProfile
);

// Education
router.post("/education",     authorizeRoles("job_seeker"), seekerCtrl.addEducation);
router.put("/education/:id",  authorizeRoles("job_seeker"), seekerCtrl.updateEducation);
router.delete("/education/:id", authorizeRoles("job_seeker"), seekerCtrl.deleteEducation);

// Work experience
router.post("/experience",     authorizeRoles("job_seeker"), seekerCtrl.addExperience);
router.put("/experience/:id",  authorizeRoles("job_seeker"), seekerCtrl.updateExperience);
router.delete("/experience/:id", authorizeRoles("job_seeker"), seekerCtrl.deleteExperience);

// ── Recruiter ─────────────────────────────────────────────
router.get("/recruiter",
  authorizeRoles("recruiter"),
  recruiterCtrl.getProfile
);
router.put("/recruiter",
  authorizeRoles("recruiter"),
  upload.fields([{ name: "companyLogo", maxCount: 1 }]),
  recruiterCtrl.updateProfile
);
router.get("/recruiter/:id/public", recruiterCtrl.getPublicProfile);

module.exports = router;
