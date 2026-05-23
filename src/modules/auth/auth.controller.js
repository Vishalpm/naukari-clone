const { registerUser, loginUser, getMe } = require("./auth.service");

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: "email, password and role are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    const data = await registerUser({ email, password, role });
    res.status(201).json({ success: true, message: "Registration successful", data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "email and password are required" });
    }
    const data = await loginUser({ email, password });
    res.status(200).json({ success: true, message: "Login successful", data });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  try {
    const data = await getMe(req.user.userId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, me };
