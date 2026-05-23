const service = require("./seeker.service");

const getProfile = async (req, res) => {
  try {
    const data = await service.getSeekerProfile(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const files = req.files;
    const data  = await service.updateSeekerProfile(req.user.userId, req.body, files);
    res.json({ success: true, message: "Profile updated", data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const addEducation = async (req, res) => {
  try {
    const data = await service.addEducation(req.user.userId, req.body);
    res.status(201).json({ success: true, message: "Education added", data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateEducation = async (req, res) => {
  try {
    const data = await service.updateEducation(req.user.userId, req.params.id, req.body);
    res.json({ success: true, message: "Education updated", data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteEducation = async (req, res) => {
  try {
    const data = await service.deleteEducation(req.user.userId, req.params.id);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const addExperience = async (req, res) => {
  try {
    const data = await service.addWorkExperience(req.user.userId, req.body);
    res.status(201).json({ success: true, message: "Experience added", data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateExperience = async (req, res) => {
  try {
    const data = await service.updateWorkExperience(req.user.userId, req.params.id, req.body);
    res.json({ success: true, message: "Experience updated", data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteExperience = async (req, res) => {
  try {
    const data = await service.deleteWorkExperience(req.user.userId, req.params.id);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getProfile, updateProfile,
  addEducation, updateEducation, deleteEducation,
  addExperience, updateExperience, deleteExperience,
};
