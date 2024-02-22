require('dotenv').config();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config(); //dotenv file
const express = require("express");
const bodyParser = require("body-parser");
const { name } = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require('mongoose');
const app = express();
const MongoDBStore = require('connect-mongodb-session')(session);
const port = process.env.PORT || 5000;


/**
 * setup server
 */

//
// const store = new MongoDBStore({
//   uri: process.env.MONGOID,
//   collection: 'sessions', // Collection to store sessions
// });

// store.on('error', (error) => {
//   console.error('Session store error:', error);
// });

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     store: store,
//     cookie: {
//       maxAge: 1000 * 60 * 60 * 24 * 7, // Set a suitable session duration
//     },
//   })
// );
// app.use(passport.initialize());
// app.use(passport.session());
app.use(express.static('public'));


// connect
mongoose.connect(process.env.MONGOID) //add db string to connect
  .then(() => {
    console.log("Connected to the database");
    app.listen(port, () =>
    console.log(`Express server listening ${port}.`));
  })
  .catch(err => console.error(err));


  /**
   * Login verifcation stragegy
   */

  const userSchema = new mongoose.Schema({
    googleId: String,
    displayName: String,
    email: String,
    userProfile: JSON
  });

  const User = mongoose.model('User', userSchema);




  /**
   * routes
   *
   */

  app.get("/", (req,res)=>{
    res.render("homePage", {});
  })

  app.post("/login", (req,res)=>{

    const data = req.body;
    console.log(data);
    res.redirect("/");
  });
