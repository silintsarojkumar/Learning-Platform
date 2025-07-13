const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    link: {
      type: String,
      required: true
    },
    Dis: {
      type: String,
    }
  
});

const Video = mongoose.model("Video", videoSchema); // ⬅️ Create model

module.exports = Video; // ⬅️ Export the model
