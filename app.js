//Require dependencies
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const session = require("client-sessions");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require('bcryptjs');
const flash = require("connect-flash");
//Require Models & Routes
const House = require("./models/house");
const User = require("./models/user");
const houseRoutes = require("./routes/houses");
const userRoutes = require("./routes/users");

//db connect
// var db = process.env.DB_API_KEY || "mongodb://localhost:27017/student_housing_hub";
var db = "mongodb://localhost:27017/student_housing_hub";
mongoose.connect(db, { useNewUrlParser: true });
mongoose.set('useFindAndModify', false);

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(session({
    cookieName: "session",
    secret: "secret",
    duration: 30 * 60 * 3600,
    cookie: {
        ephemeral: true
    }
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
        // Match user
        User.findOne({
            email: email
        }).then(user => {
            if (!user) {
                return done(null, false, { message: 'That email is not registered' });
            }

            // Match password
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) throw err;
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Password incorrect' });
                }
            });
        });
    })
);

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    // res.locals.error = req.flash("error");
    // res.locals.success = req.flash("success");
    next();
});
app.use(houseRoutes);
app.use(userRoutes);

//Landing Page
app.get("/", (req, res) => {
    res.render("housing");
});

//Port Listen
app.listen(process.env.PORT || 3000, function () {
    console.log("Listening on PORT 3000");
});