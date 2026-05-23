const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema({
  degree:         { type: String, required: true },
  institution:    { type: String, required: true },
  board:          { type: String },
  percentage:     { type: Number },
  cgpa:           { type: String },
  startYear:      { type: Number, required: true },
  endYear:        { type: Number },
  isPursuing:     { type: Boolean, default: false },
  specialization: { type: String },
});

const workExperienceSchema = new mongoose.Schema({
  jobTitle:    { type: String, required: true },
  company:     { type: String, required: true },
  location:    { type: String },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date },
  isCurrent:   { type: Boolean, default: false },
  description: { type: String },
  skills:      [{ type: String }],
});

const jobSeekerProfileSchema = new mongoose.Schema(
  {
    user:                { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    firstName:           { type: String },
    lastName:            { type: String },
    phone:               { type: String },
    dob:                 { type: Date },
    gender:              { type: String },
    profilePhoto:        { type: String },
    currentLocation:     { type: String },
    hometown:            { type: String },
    preferredLocations:  [{ type: String }],
    totalExperience:     { type: Number },
    currentSalary:       { type: Number },
    expectedSalary:      { type: Number },
    noticePeriod:        { type: String },
    currentDesignation:  { type: String },
    currentCompany:      { type: String },
    keySkills:           [{ type: String }],
    summary:             { type: String },
    languages:           [{ type: String }],
    resume:              { type: String },
    linkedIn:            { type: String },
    github:              { type: String },
    portfolio:           { type: String },
    achievements:        { type: String },
    education:           [educationSchema],
    workExperience:      [workExperienceSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobSeekerProfile", jobSeekerProfileSchema);
