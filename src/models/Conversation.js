const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    job:       { type: mongoose.Schema.Types.ObjectId, ref: "Job",              required: true },
    seeker:    { type: mongoose.Schema.Types.ObjectId, ref: "JobSeekerProfile", required: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "RecruiterProfile", required: true },
  },
  { timestamps: true }
);

// One conversation per job + seeker + recruiter combo
conversationSchema.index({ job: 1, seeker: 1, recruiter: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);
