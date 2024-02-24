require('dotenv').config();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
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


const store = new MongoDBStore({
  uri: 'mongodb+srv://' + process.env.MONGOID+ 'hosa-demo.u9vtlvt.mongodb.net/HOSA',
  collection: 'sessions', // Collection to store sessions
});

store.on('error', (error) => {
  console.error('Session store error:', error);
});


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // Set a suitable session duration
    },
  })
);

/**
 * setup server
 */


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());


/**
 * session stuff
 */



// connect
mongoose.connect('mongodb+srv://' + process.env.MONGOID + 'hosa-demo.u9vtlvt.mongodb.net/HOSA') //add db string to connect
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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      scope: ['profile', 'email'] // Include 'email' scope
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        } else {
          const newUserProfile = {
            questionsAttempted: 0,
            questionsCorrect: 0,
            questionsWrong: 0,
            pastScores: [],
            wrongQuestions: []
          };

          const newUser = new User({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile._json.email, // Retrieve the email from the profile
            userProfile: newUserProfile
          });

          await newUser.save();
          return done(null, newUser);
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);


passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.googleId, username: user.displayName, email: user.email });
  });
});


passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});



/**
 * routes
 *
 */



app.get("/", (req,res)=>{
  res.render("homePage", {});
})

app.get("/login", (req, res) => {
  try {
    if (req.isAuthenticated()) {
      res.redirect("/landing-page")
    } else {
      res.redirect('/auth/google')
    }
  } catch (error) {
    ////console.log(error)
    res.redirect("/")
  }
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  async (req, res) => {

      await req.session.save(() => {

      res.redirect('/landing-page');
      });
  }
);

app.get('/landing-page', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('landingpage', { user: req.user });
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.get('/medical-math', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('medicalmath', { user: req.user });
  } else {
    res.redirect('/login');
  }
});
