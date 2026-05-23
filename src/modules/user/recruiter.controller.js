const service = require("./recruiter.service");

const getProfile = async (req, res) => {
  try {
    const data = await service.getRecruiterProfile(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const data = await service.updateRecruiterProfile(req.user.userId, req.body, req.files);
    res.json({ success: true, message: "Profile updated", data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const data = await service.getRecruiterPublicProfile(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

module.exports = { getProfile, updateProfile, getPublicProfile };
