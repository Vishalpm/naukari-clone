const Job              = require("../../models/Job");
const RecruiterProfile = require("../../models/RecruiterProfile");
const JobSeekerProfile = require("../../models/JobSeekerProfile");

// ── Helper ─────────────────────────────────────────────────
const getRecruiter = async (userId) => {
  const profile = await RecruiterProfile.findOne({ user: userId });
  if (!profile) throw new Error("Recruiter profile not found");
  return profile;
};

const buildPagination = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages:  Math.ceil(total / limit),
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
});

// ── Create Job ─────────────────────────────────────────────
const createJob = async (userId, body) => {
  const recruiter = await getRecruiter(userId);
  if (!recruiter.companyName) {
    throw new Error("Please complete your recruiter profile before posting a job");
  }

  const toArray = (val) =>
    Array.isArray(val) ? val : (val ? val.split(",").map(s => s.trim()).filter(Boolean) : []);

  const job = await Job.create({
    recruiter:     recruiter._id,
    title:         body.title,
    description:   body.description,
    location:      toArray(body.location),
    skills:        toArray(body.skills),
    salaryMin:     body.salaryMin     ? Number(body.salaryMin)     : undefined,
    salaryMax:     body.salaryMax     ? Number(body.salaryMax)     : undefined,
    jobType:       body.jobType       || "full_time",
    experienceMin: body.experienceMin ? Number(body.experienceMin) : undefined,
    experienceMax: body.experienceMax ? Number(body.experienceMax) : undefined,
    industry:      body.industry,
    department:    body.department,
    education:     body.education,
    openings:      body.openings      ? Number(body.openings)      : 1,
    expiresAt:     body.expiresAt     ? new Date(body.expiresAt)   : undefined,
  });

  return job;
};

// ── Update Job ─────────────────────────────────────────────
const updateJob = async (userId, jobId, body) => {
  const recruiter = await getRecruiter(userId);
  const job = await Job.findOne({ _id: jobId, recruiter: recruiter._id });
  if (!job) throw new Error("Job not found or unauthorized");

  const toArray = (val) =>
    Array.isArray(val) ? val : (val ? val.split(",").map(s => s.trim()).filter(Boolean) : undefined);

  if (body.location)      job.location      = toArray(body.location);
  if (body.skills)        job.skills        = toArray(body.skills);
  if (body.title)         job.title         = body.title;
  if (body.description)   job.description   = body.description;
  if (body.jobType)       job.jobType       = body.jobType;
  if (body.status)        job.status        = body.status;
  if (body.industry)      job.industry      = body.industry;
  if (body.department)    job.department    = body.department;
  if (body.education)     job.education     = body.education;
  if (body.openings)      job.openings      = Number(body.openings);
  if (body.salaryMin)     job.salaryMin     = Number(body.salaryMin);
  if (body.salaryMax)     job.salaryMax     = Number(body.salaryMax);
  if (body.experienceMin) job.experienceMin = Number(body.experienceMin);
  if (body.experienceMax) job.experienceMax = Number(body.experienceMax);
  if (body.expiresAt)     job.expiresAt     = new Date(body.expiresAt);

  await job.save();
  return job;
};

// ── Delete Job ─────────────────────────────────────────────
const deleteJob = async (userId, jobId) => {
  const recruiter = await getRecruiter(userId);
  const job = await Job.findOneAndDelete({ _id: jobId, recruiter: recruiter._id });
  if (!job) throw new Error("Job not found or unauthorized");
  return { message: "Job deleted successfully" };
};

// ── Recruiter — own jobs ───────────────────────────────────
const getMyJobs = async (userId, page = 1, limit = 10, status) => {
  const recruiter = await getRecruiter(userId);
  const query     = { recruiter: recruiter._id };
  if (status) query.status = status;

  const total = await Job.countDocuments(query);
  const jobs  = await Job.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { jobs, pagination: buildPagination(total, page, limit) };
};

// ── Recruiter — single job with applicants ─────────────────
const getMyJobById = async (userId, jobId) => {
  const recruiter = await getRecruiter(userId);
  const job = await Job.findOne({ _id: jobId, recruiter: recruiter._id });
  if (!job) throw new Error("Job not found or unauthorized");
  return job;
};

// ── Public — search jobs ───────────────────────────────────
const searchJobs = async (query) => {
  const {
    keyword, location, skills, jobType, industry, department,
    salaryMin, salaryMax, experienceMin, experienceMax, education,
    page = 1, limit = 10, sortBy = "newest",
  } = query;

  const filter = {
    status: "active",
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  };

  // Keyword search
  if (keyword) {
    filter.$text = { $search: keyword };
  }

  // Location
  if (location) {
    filter.location = { $elemMatch: { $regex: location, $options: "i" } };
  }

  // Skills
  if (skills) {
    const skillList = skills.split(",").map(s => s.trim());
    filter.skills   = { $elemMatch: { $in: skillList.map(s => new RegExp(s, "i")) } };
  }

  if (jobType)    filter.jobType    = jobType;
  if (industry)   filter.industry   = { $regex: industry,   $options: "i" };
  if (department) filter.department = { $regex: department, $options: "i" };
  if (education)  filter.education  = { $regex: education,  $options: "i" };

  // Salary range
  if (salaryMin) filter.salaryMax = { $gte: Number(salaryMin) };
  if (salaryMax) filter.salaryMin = { ...(filter.salaryMin || {}), $lte: Number(salaryMax) };

  // Experience range
  if (experienceMin) filter.experienceMax = { $gte: Number(experienceMin) };
  if (experienceMax) filter.experienceMin = { ...(filter.experienceMin || {}), $lte: Number(experienceMax) };

  // Sorting
  let sort = { createdAt: -1 };
  if (sortBy === "salary_high") sort = { salaryMax: -1 };
  if (sortBy === "salary_low")  sort = { salaryMin:  1 };
  if (sortBy === "relevance" && keyword) sort = { score: { $meta: "textScore" }, createdAt: -1 };

  const pageNum  = Number(page);
  const limitNum = Number(limit);

  const total = await Job.countDocuments(filter);
  const jobs  = await Job.find(filter)
    .populate("recruiter", "firstName lastName companyName companyLogo companyLocation")
    .sort(sort)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  return { jobs, pagination: buildPagination(total, pageNum, limitNum) };
};

// ── Public — single job ────────────────────────────────────
const getJobById = async (jobId) => {
  const job = await Job.findOne({ _id: jobId, status: "active" })
    .populate("recruiter", "firstName lastName companyName companyLogo companyLocation companyWebsite");
  if (!job) throw new Error("Job not found or no longer active");
  return job;
};

// ── Seeker — recommended jobs ──────────────────────────────
const getRecommendedJobs = async (userId) => {
  const seeker = await JobSeekerProfile.findOne({ user: userId });
  if (!seeker) throw new Error("Seeker profile not found");

  const filter = {
    status: "active",
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  };

  // Match on skills
  if (seeker.keySkills?.length) {
    filter.skills = {
      $elemMatch: { $in: seeker.keySkills.slice(0, 5).map(s => new RegExp(s, "i")) },
    };
  }

  // Match on experience
  if (seeker.totalExperience != null) {
    filter.$and = [
      { $or: [{ experienceMin: { $exists: false } }, { experienceMin: { $lte: seeker.totalExperience } }] },
      { $or: [{ experienceMax: { $exists: false } }, { experienceMax: { $gte: seeker.totalExperience } }] },
    ];
  }

  // Match on location
  if (seeker.preferredLocations?.length) {
    filter.location = {
      $elemMatch: { $in: seeker.preferredLocations.slice(0, 3).map(l => new RegExp(l, "i")) },
    };
  }

  const jobs = await Job.find(filter)
    .populate("recruiter", "firstName lastName companyName companyLogo companyLocation")
    .sort({ createdAt: -1 })
    .limit(20);

  return jobs;
};

module.exports = {
  createJob, updateJob, deleteJob,
  getMyJobs, getMyJobById,
  searchJobs, getJobById, getRecommendedJobs,
};
