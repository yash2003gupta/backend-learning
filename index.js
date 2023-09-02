import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";


// connect with database
mongoose.connect("mongodb://127.0.0.1:27017/back", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("Database connected")).catch((e) => console.log(e));
 


const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

const app = express();

// res.sendStatus(404) -> check with code words 404 for error 

// settinng up view engine yaa toh set do 

app.use(express.static(path.join(path.resolve(), "public"))); // path.resolve gives current dir 
app.use(express.urlencoded({ extended: true })); // excess form information
app.use(cookieParser());
//setting up view Engine
app.set("view engine", "ejs");


// Authentication
const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {

    const decoded = jwt.verify(token, "hello");
     req.user = await User.findById(decoded._id);

    next();

  } else {
    res.redirect("/login");
  }

}
app.get("/", isAuthenticated, (req, res) => {

  res.render("logout" ,{ name: req.user.name});
});

app.get("/login",(req,res)=>{
  res.render("login");
})
app.get("/register",(req, res) => {

  res.render("register");
});

app.post("/login", async (req,res)=>{
  const {email, password} = req.body;
  let user = await User.findOne({email});

  if(!user) return res.redirect("/register");

  const isMatch = user.password===password;

  if(!isMatch) return  res.render("login" , {email ,message:"Incorrect password"});
  const token = jwt.sign({ _id: user._id }, "hello");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
      res.redirect("/");
})

// get route .. for redirect to success

// cookie .. for authentication

//Authentication  
app.post("/register", async (req, res) => {

  const { name, email , password} = req.body;
  //console.log(req.body); // for check in console

  let user =await User.findOne({email}); // find only one account
  if( user){
    return res.redirect("/login"); 
  }
   user = await User.create({
    name,
    email,
    password,
  });
  const token = jwt.sign({ _id: user._id }, "hello");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/"); // for overcoming the infinite loading kyuki na hum kuch render kr rhe hai aur na send
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/"); // for overcoming the infinite loading kyuki na hum kuch render kr rhe hai aur na send
});






app.listen(5001, () => {
  console.log("server is working");
});