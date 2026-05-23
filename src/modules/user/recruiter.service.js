const RecruiterProfile = require("../../models/RecruiterProfile");

const getProfileByUserId = async (userId) => {
  const profile = await RecruiterProfile.findOne({ user: userId }).populate("user", "email role");
  if (!profile) throw new Error("Recruiter profile not found");
  return profile;
};

const getRecruiterProfile = async (userId) => {
  return await getProfileByUserId(userId);
};

const updateRecruiterProfile = async (userId, body, files) => {
  const profile = await getProfileByUserId(userId);
  Object.assign(profile, body);
  if (files?.companyLogo?.[0]) {
    profile.companyLogo = `uploads/logos/${files.companyLogo[0].filename}`;
  }
  await profile.save();
  return profile;
};

const getRecruiterPublicProfile = async (recruiterId) => {
  const profile = await RecruiterProfile.findById(recruiterId).populate("user", "email");
  if (!profile) throw new Error("Recruiter not found");
  return {
    id:                 profile._id,
    firstName:          profile.firstName,
    lastName:           profile.lastName,
    designation:        profile.designation,
    companyName:        profile.companyName,
    companyWebsite:     profile.companyWebsite,
    companyLogo:        profile.companyLogo,
    industry:           profile.industry,
    companySize:        profile.companySize,
    companyDescription: profile.companyDescription,
    companyLocation:    profile.companyLocation,
  };
};

module.exports = {
  getRecruiterProfile,
  updateRecruiterProfile,
  getRecruiterPublicProfile,
};
