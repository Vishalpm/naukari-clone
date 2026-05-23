const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
  {
    job:         { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    seeker:      { type: mongoose.Schema.Types.ObjectId, ref: "JobSeekerProfile", required: true },
    status:      {
      type: String,
      enum: ["applied", "viewed", "shortlisted", "rejected", "hired"],
      default: "applied",
    },
    coverLetter: { type: String },
  },
  { timestamps: true }
);

// One application per job per seeker
jobApplicationSchema.index({ job: 1, seeker: 1 }, { unique: true });

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
