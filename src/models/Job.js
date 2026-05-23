const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    recruiter:     { type: mongoose.Schema.Types.ObjectId, ref: "RecruiterProfile", required: true },
    title:         { type: String, required: true },
    description:   { type: String, required: true },
    location:      [{ type: String }],
    salaryMin:     { type: Number },
    salaryMax:     { type: Number },
    jobType:       {
      type: String,
      enum: ["full_time", "part_time", "contract", "internship", "freelance"],
      default: "full_time",
    },
    experienceMin: { type: Number },
    experienceMax: { type: Number },
    skills:        [{ type: String }],
    industry:      { type: String },
    department:    { type: String },
    education:     { type: String },
    openings:      { type: Number, default: 1 },
    status:        {
      type: String,
      enum: ["active", "closed", "draft"],
      default: "active",
    },
    expiresAt:     { type: Date },
  },
  { timestamps: true }
);

// Text index for keyword search
jobSchema.index({ title: "text", description: "text", skills: "text" });

module.exports = mongoose.model("Job", jobSchema);
