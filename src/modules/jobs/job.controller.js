const service = require("./job.service");

// ── Recruiter ──────────────────────────────────────────────

const createJob = async (req, res) => {
  try {
    const data = await service.createJob(req.user.userId, req.body);
    res.status(201).json({ success: true, message: "Job posted successfully", data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateJob = async (req, res) => {
  try {
    const data = await service.updateJob(req.user.userId, req.params.id, req.body);
    res.json({ success: true, message: "Job updated", data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const data = await service.deleteJob(req.user.userId, req.params.id);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getMyJobs = async (req, res) => {
  try {
    const page   = Number(req.query.page)  || 1;
    const limit  = Number(req.query.limit) || 10;
    const status = req.query.status;
    const data   = await service.getMyJobs(req.user.userId, page, limit, status);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getMyJobById = async (req, res) => {
  try {
    const data = await service.getMyJobById(req.user.userId, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

// ── Public / Seeker ────────────────────────────────────────

const searchJobs = async (req, res) => {
  try {
    const data = await service.searchJobs(req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getJobById = async (req, res) => {
  try {
    const data = await service.getJobById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

const getRecommendedJobs = async (req, res) => {
  try {
    const data = await service.getRecommendedJobs(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  createJob, updateJob, deleteJob,
  getMyJobs, getMyJobById,
  searchJobs, getJobById, getRecommendedJobs,
};
