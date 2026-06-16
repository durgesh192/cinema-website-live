const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  poster: { type: String, required: true },
  link: { type: String }, 
  category: { type: String, default: "General", trim: true },
  language: { type: String, default: "Hindi" },
  section: { type: String },
  episodes: [{ 
    title: String, 
    link: String 
  }] 
}, { timestamps: true });

module.exports = mongoose.model("Movie", movieSchema);