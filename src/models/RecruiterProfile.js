const mongoose = require("mongoose");

const recruiterProfileSchema = new mongoose.Schema(
  {
    user:               { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    firstName:          { type: String },
    lastName:           { type: String },
    phone:              { type: String },
    designation:        { type: String },
    companyName:        { type: String },
    companyWebsite:     { type: String },
    companyLogo:        { type: String },
    industry:           { type: String },
    companySize:        { type: String },
    companyDescription: { type: String },
    companyLocation:    { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecruiterProfile", recruiterProfileSchema);
