
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;



const mongoose = require("mongoose");
const data = require("./modles/data.js"); // Check for typo: "modles" → "models" if needed
const user = require("./modles/user.js");
const admin = require("./modles/admin.js");
const path = require("path");
const methodOverride = require("method-override");
const { availableMemory } = require("process");
const session = require("express-session");

app.use(session({
  secret: "1234",  // change this to a strong secret in real apps
  resave: false,
  saveUninitialized: false
}));


app.use(methodOverride("_method"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname,"public")))
app.use(express.urlencoded({ extended: true }));

// ✅ Connect to MongoDB
main().catch(err => console.log(err));

function isLoggedIn(req, res, next) {
  if (req.session.isLoggedIn) {
    next();
  } else {
    res.redirect("/admin");
  }
}

async function main() {
  await mongoose.connect('mongodb+srv://silintsarojkumar:Saroj%402811@cluster0.tiu0bwb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
  console.log("MongoDB connected");
}

// ✅ Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// ✅ Home route
app.get("/", async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.render("userlogin.ejs");
  }
  const allData = await data.find();
  
  res.render("index.ejs",{allData})
});
app.post("/", async(req,res)=>{
  const { username, pass } = req.body;
  const student = await user.findOne({ username, pass });
    if (student) {
    const allData = await data.find().sort({ index: 1 });
    res.render("index.ejs", { allData ,student});
  } else {
    res.send("Invalid credentials");
  }

})

// ✅ Admin page route
app.get("/admin", async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.render("loginAdmin.ejs");
  }

  const allData = await data.find().sort({ index: 1 });
  const adminUser = req.session.admin;
  const adm = await admin.find();
  const use = await user.find();

  res.render("admin.ejs", { allData, adminUser, adm, use });
});
// POST /admin/login - for logging in
app.post("/admin", async (req, res) => {
  const { username, pass } = req.body;
  const adminUser = await admin.findOne({ username, pass });
  if (adminUser) {
    req.session.isLoggedIn = true; 
    req.session.admin = adminUser;
    const allData = await data.find().sort({ index: 1 }).limit(4);
    const adm = await admin.find();
    const use = await user.find();
    res.render("admin.ejs", { allData ,adminUser,adm,use});
  } else {
    res.send("Invalid credentials");
  }
});
app.get("/admin/content",isLoggedIn,async (req,res)=>{
  const allData = await data.find().sort({ index: 1 });
  const adminUser = req.session.admin;
  res.render("content.ejs", { allData,adminUser });
  
})

app.get("/admin/student",(req,res)=>{
    const adminUser = req.session.admin;
    res.render("adminStudent.ejs")
})
app.post("/admin/student",isLoggedIn,async(req,res)=>{
    
    let nstudent = await new user(req.body);
    nstudent.save();
    res.redirect("/admin");
    


})

app.get("/admin/alluser",async (req,res)=>{
  const adminUser = req.session.admin;
    let stu = await user.find();
    res.render("alluser.ejs",{stu,adminUser})
})
app.get("/admin/add",(req,res)=>{
    res.render("add.ejs")
})
app.post("/admin/content",isLoggedIn,async(req,res)=>{
  let nvideo = await new data(req.body);
  nvideo.save();
  res.redirect("/admin/content")
})

app.get("/admin/edit/:id",async(req,res)=>{
    const adminUser = req.session.admin;
    let id = req.params.id;
    let tdata = await data.findById(id);
    res.render("edit.ejs",{tdata,adminUser});
})
app.put("/admin/:id",isLoggedIn, async(req,res)=>{
    let {id} = req.params;
    let edit = req.body;
    await data.findByIdAndUpdate(id, edit);
    res.redirect("/admin/content")

})
app.get("/admin/detail/:id",async (req,res)=>{
    const adminUser = req.session.admin;
    let id = req.params.id;
    let detail = await data.findById(id);
    res.render("details.ejs",{detail,adminUser});
})

app.delete("/admin/:id",isLoggedIn, async(req,res)=>{
    let {id} = req.params;
    
    await data.findByIdAndDelete(id);
    res.redirect("/admin")

})
app.get("/user/details/:id", isLoggedIn, async (req, res) => {
  let { id } = req.params;
  let student = await user.findById(id);
  res.render("userdetails.ejs", { student });
});
app.delete("/admin/alluser/:id", isLoggedIn, async (req, res) => {
  let { id } = req.params;
  await user.findByIdAndDelete(id);
  res.redirect("/admin/alluser");
});
app.get("/play/:id",async (req,res)=>{
    let id = req.params.id;
    let detail = await data.findById(id);
    res.render("play.ejs",{detail});
})
app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin");
  });
});

