const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username:{
        type:String,
        required: true
    },
    pass:{
        type:String,
        required: true
    },
    mob:{
        type:Number,
        required:true
    },
    email:{
        type:String,
        required:true

    },
    name:{
        type:String,
        required:true
    }
  
});

const Video = mongoose.model("user", userSchema); // ⬅️ Create model

module.exports = user; // ⬅️ Export the model
