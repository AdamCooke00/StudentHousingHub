const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const auth = require("../middleware/auth");

router.get("/login", auth.forwardAuthenticated, (req, res) => {
    res.render("login");
});

router.get("/register", auth.forwardAuthenticated, (req, res) => {
    res.render("register");
});

router.get("/users/:id", auth.ensureAuthenticated, auth.checkAccountOwnership, (req, res) => {
    res.send(`This is the User Page of ${req.user.email} and current nobody else but you can get to this link.`);
});

router.post("/register", auth.forwardAuthenticated, (req, res) => {
    let hash = bcrypt.hashSync(req.body.password, 14);
    req.body.password = hash;
    User.findOne({ email: req.body.email }, (err, foundUser) => {
        if (foundUser) {
            return res.send("That email already exists. Try again")
        } else if (err) {
            return res.send("An error occured", err);
        }

        let user = new User(req.body);
        user.save(err => {
            if (err) {
                return res.redirect("back");
            }
            console.log("Saved User", user);
            req.login(user, err => {
                if (err) {
                    console.log(err);
                }
                return res.redirect("/houses");
            });
        });
    });
});

router.post("/login", auth.forwardAuthenticated, passport.authenticate("local",
    {
        successRedirect: "/houses",
        failureRedirect: "/login"
    }), (req, res) => {
    }
);

router.get("/logout", (req, res) => {
    req.logout();
    console.log(req.user);
    res.redirect("/login");
});

module.exports = router;