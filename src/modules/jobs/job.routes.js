const express  = require("express");
const router   = express.Router();
const ctrl     = require("./job.controller");
const { authenticate, authorizeRoles } = require("../../middlewares/auth.middleware");

// Public
router.get("/",     ctrl.searchJobs);

// Seeker
router.get("/seeker/recommended", authenticate, authorizeRoles("job_seeker"), ctrl.getRecommendedJobs);

// Recruiter
router.post("/",          authenticate, authorizeRoles("recruiter"), ctrl.createJob);
router.get("/mine/all",   authenticate, authorizeRoles("recruiter"), ctrl.getMyJobs);
router.get("/mine/:id",   authenticate, authorizeRoles("recruiter"), ctrl.getMyJobById);
router.put("/:id",        authenticate, authorizeRoles("recruiter"), ctrl.updateJob);
router.delete("/:id",     authenticate, authorizeRoles("recruiter"), ctrl.deleteJob);

// Public single job — MUST be after specific routes
router.get("/:id", ctrl.getJobById);

module.exports = router;
