const bcrypt          = require("bcryptjs");
const User            = require("../../models/User");
const JobSeekerProfile = require("../../models/JobSeekerProfile");
const RecruiterProfile = require("../../models/RecruiterProfile");
const { generateToken } = require("../../utils/jwt");

// ── Register ───────────────────────────────────────────────
const registerUser = async ({ email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email already registered");

  if (!["job_seeker", "recruiter"].includes(role)) {
    throw new Error("Invalid role. Must be job_seeker or recruiter");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({ email, password: hashedPassword, role });

  // Auto-create empty profile
  if (role === "job_seeker") {
    await JobSeekerProfile.create({ user: user._id });
  } else {
    await RecruiterProfile.create({ user: user._id });
  }

  const token = generateToken({
    userId: user._id.toString(),
    email:  user.email,
    role:   user.role,
  });

  return {
    token,
    user: { id: user._id, email: user.email, role: user.role },
  };
};

// ── Login ──────────────────────────────────────────────────
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid email or password");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");

  const token = generateToken({
    userId: user._id.toString(),
    email:  user.email,
    role:   user.role,
  });

  return {
    token,
    user: { id: user._id, email: user.email, role: user.role },
  };
};

// ── Get Me ─────────────────────────────────────────────────
const getMe = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new Error("User not found");

  let profile = null;
  if (user.role === "job_seeker") {
    profile = await JobSeekerProfile.findOne({ user: userId });
  } else {
    profile = await RecruiterProfile.findOne({ user: userId });
  }

  return { ...user.toObject(), profile };
};

module.exports = { registerUser, loginUser, getMe };
