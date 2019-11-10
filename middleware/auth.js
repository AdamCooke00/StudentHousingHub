const House = require("../models/house");

module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        // req.flash('error_msg', 'Please log in to view that resource');
        res.redirect('/login');
    },

    forwardAuthenticated: function (req, res, next) {
        if (!req.isAuthenticated()) {
            return next();
        }
        res.redirect('/houses');
    },

    checkHouseOwnership: function (req, res, next) {
        if (req.isAuthenticated()) {
            House.findById(req.params.id, (err, foundHouse) => {
                if (err) {
                    // req.flash("error", "Campground not found");
                    res.redirect("back");
                } else {

                    if (!foundHouse) {
                        // req.flash("error", "Item not found.");
                        return res.redirect("back");
                    }

                    if (foundHouse.author.id.equals(req.user._id)) {
                        next();
                    } else {
                        // req.flash("error", "You don't have permission for that")
                        res.redirect("back");
                    }
                }
            });
        } else {
            // req.flash("error", "You must log in first");
            res.redirect("/login");
        }
    },

    checkAccountOwnership: function (req, res, next) {
        console.log(typeof req.params.id);
        console.log(typeof req.user._id);
        console.log(req.user._id);
        if (req.user._id == req.params.id) {
            console.log("mhm");
            next();
        } else {
            // req.flash("error", "You must log in first");
            res.redirect("/users/" + req.user._id);
        }


    }
}