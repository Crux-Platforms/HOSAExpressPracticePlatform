require('dotenv').config();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const express = require("express");
const bodyParser = require("body-parser");
const querystring = require('querystring');
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
 * Schemas
 */



const userSchema = new mongoose.Schema({
  googleId: String,
  displayName: String,
  email: String,
  userProfile: JSON
});

const User = mongoose.model('User', userSchema);
const questionSchema = new mongoose.Schema({
  Question: String,
  OptionOne: String,
  OptionTwo: String,
  OptionThree: String,
  OptionFour: String,
  Answer: String
});


const questions = mongoose.model("mtquestions", questionSchema);


/**
* Login verifcation stragegy
*/

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

app.get('/medical-terminology', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('MT');

  } else {
    res.redirect('/login');
  }
});

app.post('/questions', async (req, res) => {
  if (req.isAuthenticated()) {

    try{

      var questionNumbers = req.body.question;
      var timeLimit = req.body.timeLimit;

      function getRandomNumer(min, max){
        return Math.floor(Math.random() * (max - min) + min);
      }

      function checkIfNumberisInArray(array, number){
        for(let i = 0; i < array.length; i++){
          if(array[i] === number){
            return true;
          }
        }
        return false;
      }

      const length = await questions.estimatedDocumentCount();
      const questionBank = await questions.find({}).exec();


      const populationQuestions = async() => {
        let questionArray = [];
        let chosenArray = [];
        for(let i = 0; i < questionNumbers; i++){
          let randomNum = getRandomNumer(0, length);
          var numberChosen = checkIfNumberisInArray(randomNum, chosenArray);
          while(numberChosen){
            randomNum = getRandomNumer(0, length);
            numberChosen = checkIfNumberisInArray(randomNum, chosenArray);
        }
          chosenArray.push(randomNum);
         questionArray.push(questionBank[randomNum]._id)
        }
        return questionArray;
      }

      const questionsToRender = await populationQuestions();

      const time = new Date().getTime();
      const queryParams = querystring.stringify({
        questionIds: JSON.stringify(questionsToRender),
        number: JSON.stringify(questionNumbers),
        timer: JSON.stringify(timeLimit === 'none' ? "false" : "true"),
        time: JSON.stringify(time)
      })
      res.redirect("/questions?" + queryParams);
      }

    catch(error){
      console.log(error)
    }

  } else {
    res.redirect('/login');
  }
});

app.get("/questions", async (req, res) => {
  if (req.isAuthenticated()) {
    try{
      const numberofQuestions = JSON.parse(req.query.number)

        const questionsId = JSON.parse(req.query.questionIds);

        const getQuestionsFromId = async () => {
          let questionsArray = [];
          for (var i = 0; i < numberofQuestions; i++) {
            const questionFromDatabase =  await questions.find({ _id: questionsId[i] }).exec();
            await questionsArray.push(questionFromDatabase[0]);
          }
          return questionsArray;
        }

        const timer = JSON.parse(req.query.timer);
        const questionsArrayfromID = await getQuestionsFromId()
        res.render("practice",
          { questions: questionsArrayfromID, number: numberofQuestions,
              timerBoolean: timer, time: JSON.parse(req.query.time) })


    }
    catch(error){
      console.log(error)
    }

  } else {
    res.redirect('/login');
  }
});

app.post("/answers", (req, res) => {
  try {
    const questionIdsArray = JSON.parse(req.body.questionIds);
    const number = JSON.parse(req.body.number);
    const questionsAnswers = [];

    //console.log(req.body)

    function getUserAnswers(request) {
      var userAnswers = [];
      for (var i = 0; i < number; i++) {
        userAnswers.push(request['' + i])
      }
      return userAnswers;
    }

    function checkAnswers(userAnswers, questionsAnswers) {
      var results = {
        correct: 0,
        incorect: 0,
        wrongQuestions: []
      }

      for (var k = 0; k < number; k++) {
        if (userAnswers[k] == questionsAnswers[k]) {
          results.correct++;
        } else {
          results.incorect++;
          results.wrongQuestions.push(questionIdsArray[k])
        }
      }
      return results;
    }

    Promise.all(questionIdsArray.map((id) => {
      return questions.findById(id, 'Answer').exec();
    }))
      .then((results) => {
        results.forEach((question) => {
          questionsAnswers.push(question.Answer);
        });

        const userAnswers = getUserAnswers(req.body);
        var results = checkAnswers(userAnswers, questionsAnswers);

        // async function updateUserStats(results) {
        //   var user = await User.find({ email: req.user.email }).exec()
        //   var userProfileNew = user[0].userProfile;
        //   userProfileNew.questionsCorrect += results.correct;
        //   userProfileNew.questionsWrong += results.incorect;
        //   userProfileNew.questionsAttempted += (results.correct + results.incorect)
        //   userProfileNew.pastScores.push(results.correct / number)
        //   results.wrongQuestions.forEach((question) => {
        //     userProfileNew.wrongQuestions.push({ questionId: question, db: db });
        //   })
        //   ////console.log(userProfileNew)
        //   await User.findOneAndUpdate({ email: req.user.email }, { userProfile: userProfileNew })
        // }

        // updateUserStats(results)

        const queryParams = querystring.stringify({
          questionIds: JSON.stringify(questionIdsArray),
          userAnswers: JSON.stringify(userAnswers),
          results: JSON.stringify(results),
          number: JSON.stringify(number)
        });
        res.redirect("/submit?" + queryParams);
      })
      .catch((error) => {
        console.error(error);
        res.redirect("/landing-page")
      });
  } catch (error) {
    //////console.log(error)
    res.redirect("/")
  }
})


app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const questionIdsArray = JSON.parse(req.query.questionIds);
      const userAnswers = JSON.parse(req.query.userAnswers);
      const results = JSON.parse(req.query.results);
      const number = JSON.parse(req.query.number);
      res.render("submit", { questionIds: questionIdsArray, userAnswers: userAnswers, results: results, number: number })
    } catch (error) {
      //////console.log(error)
      res.redirect("/")
    }
  } else {
    res.redirect('/login');
  }
}); 
