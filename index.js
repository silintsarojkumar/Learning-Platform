const express = require("express");
const app = express();
const port = 5000;
const mongoose = require("mongoose");
const data = require("./modles/data.js"); // Check for typo: "modles" → "models" if needed
const path = require("path");
const methodOverride = require("method-override");
const { availableMemory } = require("process");

app.use(methodOverride("_method"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname,"public")))
app.use(express.urlencoded({ extended: true }));

// ✅ Connect to MongoDB
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/video');
  console.log("MongoDB connected");
}

// ✅ Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// ✅ Home route
app.get("/", async (req, res) => {
  const allData = await data.find();
  console.log(allData);
  res.render("index.ejs",{allData})
});

// ✅ Admin page route
app.get("/admin", async (req, res) => {
  const allData = await data.find(); 
  res.render("admin.ejs", { allData }); 
});
app.get("/admin/add",(req,res)=>{
    res.render("add.ejs")
})
app.post("/admin", async (req, res) => {
  
    let add = req.body 
    const newData = new data(add); 
    await newData.save();              
    res.redirect("/admin");            
  
});
app.get("/admin/edit/:id",async(req,res)=>{
    let id = req.params.id;
    let tdata = await data.findById(id);
    res.render("edit.ejs",{tdata});
})
app.put("/admin/:id", async(req,res)=>{
    let {id} = req.params;
    let edit = req.body;
    await data.findByIdAndUpdate(id, edit);
    res.redirect("/admin")

})
app.get("/admin/detail/:id",async (req,res)=>{
    let id = req.params.id;
    let detail = await data.findById(id);
    res.render("details.ejs",{detail});
})

app.delete("/admin/:id", async(req,res)=>{
    let {id} = req.params;
    
    await data.findByIdAndDelete(id);
    res.redirect("/admin")

})
app.get("/play/:id",async (req,res)=>{
    let id = req.params.id;
    let detail = await data.findById(id);
    res.render("play.ejs",{detail});
})

