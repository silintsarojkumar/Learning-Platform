
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const mongoose = require("mongoose");
const data = require("./modles/data.js"); // Check for typo: "modles" → "models" if needed
const user = require("./modles/user.js");
const admin = require("./modles/admin.js");
const idRequest = require("./modles/request.js")
const path = require("path");
const methodOverride = require("method-override");
const { availableMemory } = require("process");
const session = require("express-session");
const engine = require("ejs-mate");
app.engine("ejs",engine);
app.use(express.static(path.join(__dirname,"/public")))

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
    return next();
  }
  res.redirect("/"); // or /admin if you want
}

function isAdmin(req, res, next) {
  if (req.session.role === "admin") {
    return next();
  }
  res.send("Access denied: Admins only");
}

function isUser(req, res, next) {
  if (req.session.role === "user") {
    return next();
  }
  res.send("Access denied: Users only");
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
  if (!req.session.isLoggedIn || req.session.role !== "user") {
    return res.render("userlogin.ejs");
  }

  const allData = await data.find().sort({ index: 1 });
  const student = req.session.user; // ✅ get student from session
  const stu = req.session.user;

  res.render("index.ejs", { allData, student ,stu }); // ✅ pass student to EJS
});

app.post("/", async (req, res) => {
  const { username, pass } = req.body;
  const student = await user.findOne({ username, pass });

  if (student) {
    req.session.isLoggedIn = true;
    req.session.role = "user";
    req.session.user = student;
    const stu = req.session.user;

    const allData = await data.find().sort({ index: 1 });
    res.render("index.ejs", { allData, student,stu });
  } else {
    res.send("Invalid credentials");
  }
});


// ✅ Admin page route
app.get("/admin", async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.render("loginAdmin.ejs");
  }

  const adminUser = req.session.admin;

  const allData = await data.find().sort({ index: 1 });
  const adm = await admin.find();
  const use = await user.find();

  const noData = await data.countDocuments();
  const noAdm = await admin.countDocuments();
  const nouser = await user.countDocuments();
  let reqNo = await idRequest.countDocuments();

  res.render("admin.ejs", {
    allData,
    adminUser,
    adm,
    use,
    noData,
    noAdm,
    nouser,
    reqNo
  });
});


// POST /admin/login - for logging in
app.post("/admin", async (req, res) => {
  const { username, pass } = req.body;
  const adminUser = await admin.findOne({ username, pass });

  if (adminUser) {
    req.session.isLoggedIn = true;
    req.session.admin = adminUser; // ✅ store in session
    req.session.role = "admin"
    const noData = await data.countDocuments();
    const noAdm = await admin.countDocuments();
    const nouser = await user.countDocuments();
    let reqNo = await idRequest.countDocuments();

    res.render("admin.ejs", { noData, adminUser, noAdm, nouser,reqNo }); // ✅ pass here too
  } else {
    res.send("Invalid credentials");
  }
});

app.get("/admin/content",isLoggedIn,isAdmin,async (req,res)=>{
  const allData = await data.find().sort({ index: 1 });
  const adminUser = req.session.admin;
  res.render("content.ejs", { allData,adminUser });
  
})

app.get("/admin/add-student",isLoggedIn,isAdmin,(req,res)=>{
    const adminUser = req.session.admin;
    res.render("adminAddStudent.ejs",{adminUser})
})
app.post("/admin/add-student",isLoggedIn,isAdmin,async(req,res)=>{
  try {
    const nstudent = new user(req.body);
    await nstudent.save();
    res.redirect("/admin");
  } catch (err) {
    if (err.code === 11000) {
      const errorMsg = "❌ Username already exists!";
      const adminUser = req.session.admin;
      return res.render("adminAddStudent.ejs", { errorMsg, adminUser });
    } else {
      res.send("Something went wrong: " + err.message);
    }
  }
})

app.get("/admin/alluser",isLoggedIn,isAdmin,async (req,res)=>{
  const adminUser = req.session.admin;
    let stu = await user.find();
    res.render("alluser.ejs",{stu,adminUser})
})
app.get("/admin/add-vid",isLoggedIn,isAdmin,(req,res)=>{
  const adminUser = req.session.admin;
    res.render("add.ejs",{adminUser})
})
app.post("/admin/content",isLoggedIn,isAdmin,async(req,res)=>{
  let nvideo = await new data(req.body);
  nvideo.save();
  res.redirect("/admin/content")
})

app.get("/admin/edit/:id",isLoggedIn,isAdmin,async(req,res)=>{
    const adminUser = req.session.admin;
    let id = req.params.id;
    let tdata = await data.findById(id);
    res.render("edit.ejs",{tdata,adminUser});
})
app.put("/admin/:id",isLoggedIn, isAdmin,async(req,res)=>{
    let {id} = req.params;
    let edit = req.body;
    await data.findByIdAndUpdate(id, edit);
    res.redirect("/admin/content")

})
app.get("/admin/detail/:id",isLoggedIn,isAdmin,async (req,res)=>{
    const adminUser = req.session.admin;
    let id = req.params.id;
    let detail = await data.findById(id);
    res.render("details.ejs",{detail,adminUser});
})

app.delete("/admin/:id",isLoggedIn,isAdmin, async(req,res)=>{
    let {id} = req.params;
    
    await data.findByIdAndDelete(id);
    res.redirect("/admin")

})
app.get("/user/details/:id", isLoggedIn, isAdmin, async (req, res) => {
  let { id } = req.params;
  const adminUser = req.session.admin;
  let student = await user.findById(id);
  res.render("userdetails.ejs", { student , adminUser});
});
app.delete("/admin/alluser/:id", isLoggedIn,isAdmin, async (req, res) => {
  let { id } = req.params;
  
  await user.findByIdAndDelete(id);
  res.redirect("/admin/alluser");
});
app.get("/admin/Profile/:username", isLoggedIn, isAdmin, async (req, res) => {
  let username = req.params.username;
  const profile = await admin.findOne({ username });

  if (!profile) {
    return res.send("Admin not found");
  }

  const adminUser = req.session.admin;
  res.render("adminProfile.ejs", { profile, adminUser });
});

app.put("/admin/Profile/:username", isLoggedIn, isAdmin, async (req, res) => {
  const oldUsername = req.params.username;
  const newData = req.body;

  const updatedAdmin = await admin.findOneAndUpdate(
    { username: oldUsername },
    newData,
    { new: true } // return updated document
  );

  // ✅ update session with new admin data
  req.session.admin = updatedAdmin;

  // ✅ redirect using updated username (if username changed)
  res.redirect(`/admin/Profile/${updatedAdmin.username}`);
});
app.get("/admin/user/request",isAdmin,isLoggedIn,async (req,res)=>{
  let request = await idRequest.find();
  const adminUser = req.session.admin;
  res.render("idRequest.ejs",{request,adminUser})
})
app.get("/admin/user/request/:id",isAdmin,isLoggedIn,async (req,res)=>{
  let id=req.params.id;
  let profile = await idRequest.findById(id);
 
  const adminUser = req.session.admin;
  res.render("reqDetail.ejs",{profile,adminUser})
})
app.post("/admin/user/request/:id",isAdmin,isLoggedIn,async (req,res)=>{
  
  let nuser = await new user(req.body)
  nuser.save();
  await idRequest.findByIdAndDelete(req.params.id);
  res.redirect("/admin/user/request")
})
app.get("/register",async (req,res)=>{

  

  res.render("registerStu.ejs")
})
app.post("/register",async (req,res)=>{

  try {
    const newReq = await new idRequest(req.body);
    await newReq.save();
    res.redirect("/");
  } catch (err) {
    if (err.code === 11000) {
      const errorMsg = "❌ Username already exists!";
      
      return res.render("registerStu.ejs", { errorMsg });
    } else {
      res.send("Something went wrong: " + err.message);
    }
  }


  
})



app.get("/play/:id",isLoggedIn, isUser,async (req,res)=>{
    let id = req.params.id;
    const stu = req.session.user;
    let detail = await data.findById(id);
    res.render("play.ejs",{detail, stu});
})

app.get("/Profile/:username", isLoggedIn, isUser, async (req, res) => {
  let username = req.params.username;
  const profile = await user.findOne({ username });

  if (!profile) {
    return res.send("Student not found");
  }

  const stu = req.session.user;
  res.render("studentProfile.ejs", { profile, stu });
});

app.put("/Profile/:username", isLoggedIn, isUser, async (req, res) => {
  const oldUsername = req.params.username;
  const newData = req.body;

  const updatedUser = await user.findOneAndUpdate(
    { username: oldUsername },
    newData,
    { new: true } // return updated document
  );

  // ✅ update session with new admin data
  req.session.user = updatedUser;

  // ✅ redirect using updated username (if username changed)
  res.redirect(`/Profile/${updatedUser.username}`);
});
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/"); // or to login page
  });
});
app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin"); // or to login page
  });
});

