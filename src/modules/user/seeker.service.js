const JobSeekerProfile = require("../../models/JobSeekerProfile");
const { signObjectFiles } = require("../../utils/s3.utils");

// ── Helper ─────────────────────────────────────────────────
const getProfileByUserId = async (userId) => {
  const profile = await JobSeekerProfile.findOne({ user: userId }).populate("user", "email role");
  if (!profile) throw new Error("Seeker profile not found");
  return profile;
};

// ── Get full seeker profile ────────────────────────────────
const getSeekerProfile = async (userId) => {
  const profile = await getProfileByUserId(userId);

  // Convert the plain profile doc to a plain object so we can mutate it
  const data = profile.toObject ? profile.toObject() : { ...profile };

  // Sign any stored S3 keys into temporary pre-signed URLs
  const signed = await signObjectFiles(data, ["resume", "profilePhoto"]);

  return signed;
};

// ── Update seeker profile ──────────────────────────────────
const updateSeekerProfile = async (userId, body, files) => {
  const profile = await getProfileByUserId(userId);

  // Handle array fields that might come as comma-separated strings
  const arrayFields = ["keySkills", "preferredLocations", "languages"];
  arrayFields.forEach((field) => {
    if (body[field] && typeof body[field] === "string") {
      body[field] = body[field].split(",").map((s) => s.trim()).filter(Boolean);
    }
  });

  // Apply all body fields
  Object.assign(profile, body);

  // Handle file uploads
  // if (files?.resume?.[0])       profile.resume       = `uploads/resumes/${files.resume[0].filename}`;
  // if (files?.profilePhoto?.[0]) profile.profilePhoto = `uploads/photos/${files.profilePhoto[0].filename}`;

  // AFTER — S3 returns the full URL in file.location
  if (files?.resume?.[0])       profile.resume       = files.resume[0].key;
  if (files?.profilePhoto?.[0]) profile.profilePhoto = files.profilePhoto[0].key;

  await profile.save();
  return profile;
};

// ── EDUCATION ──────────────────────────────────────────────

const addEducation = async (userId, data) => {
  const profile = await getProfileByUserId(userId);
  profile.education.push(data);
  await profile.save();
  return profile.education[profile.education.length - 1];
};

const updateEducation = async (userId, eduId, data) => {
  const profile = await getProfileByUserId(userId);
  const edu = profile.education.id(eduId);
  if (!edu) throw new Error("Education record not found");
  Object.assign(edu, data);
  await profile.save();
  return edu;
};

const deleteEducation = async (userId, eduId) => {
  const profile = await getProfileByUserId(userId);
  const edu = profile.education.id(eduId);
  if (!edu) throw new Error("Education record not found");
  edu.deleteOne();
  await profile.save();
  return { message: "Education deleted successfully" };
};

// ── WORK EXPERIENCE ───────────────────────────────────────

const addWorkExperience = async (userId, data) => {
  const profile = await getProfileByUserId(userId);
  if (data.isCurrent) data.endDate = undefined;
  profile.workExperience.push(data);
  await profile.save();
  return profile.workExperience[profile.workExperience.length - 1];
};

const updateWorkExperience = async (userId, expId, data) => {
  const profile = await getProfileByUserId(userId);
  const exp = profile.workExperience.id(expId);
  if (!exp) throw new Error("Work experience not found");
  if (data.isCurrent) data.endDate = undefined;
  Object.assign(exp, data);
  await profile.save();
  return exp;
};

const deleteWorkExperience = async (userId, expId) => {
  const profile = await getProfileByUserId(userId);
  const exp = profile.workExperience.id(expId);
  if (!exp) throw new Error("Work experience not found");
  exp.deleteOne();
  await profile.save();
  return { message: "Work experience deleted successfully" };
};

module.exports = {
  getSeekerProfile,
  updateSeekerProfile,
  addEducation,
  updateEducation,
  deleteEducation,
  addWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
};
