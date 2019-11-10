var express = require("express");
var router = express.Router();
const auth = require("../middleware/auth");
require('dotenv').config();
var House = require("../models/house");
var multer = require("multer");
var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
        return cb(new Error("Only jpg/jpeg/png allowed"), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter });

var cloudinary = require("cloudinary");
cloudinary.config({
    cloud_name: "CLOUD_NAME", //idek if i needs to hide this but ye
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
var NodeGeocoder = require('node-geocoder');

var options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};

var geocoder = NodeGeocoder(options);

//Index
router.get("/houses", (req, res) => {
    if (req.query.bedFilter < 7) {
        House.find({ bedrooms: req.query.bedFilter }, (err, houses) => {
            if (err) {
                console.log(err);
            } else {
                return res.render("index", { houses: houses });
            }
        });
    } else if (req.query.bedFilter >= 7) {
        House.find({ bedrooms: { $gte: 7 } }, (err, houses) => {
            if (err) {
                console.log(err);
            } else {
                return res.render("index", { houses: houses });
            }
        });
    } else {
        House.find({}, (err, houses) => {
            if (err) {
                console.log(err);
            } else {
                res.render("index", { houses: houses });
            }
        });
    }
});

//New
router.get("/houses/new", auth.ensureAuthenticated, (req, res) => {
    res.render("new");
});

//Create
router.post("/houses", auth.ensureAuthenticated, upload.array("image", 7), (req, res) => {
    console.log("Body:\n" + JSON.stringify(req.body, null, 2) + "\n");
    geocoder.geocode(req.body.house.address, async (err, data) => {
        if (data === undefined || data.length == 0) {
            console.log(err);
            return res.send("Unable to locate entered address. Please try again. Address must be in Kingston.");
        }
        if (data[0].city !== "Kingston") {
            return res.send("Address entered is not in Kingston. Service currently designed for Kingston properties only. Sorry");
        }

        console.log("Date received from geocoder: \n" + JSON.stringify(data, null, 2) + "\n");
        let house = {
            //rentalType: [house, attached, apartment. etc.]
            //unit: [optional. A/b/ etc.]
            address: data[0].streetNumber + " " + data[0].streetName + ", " + data[0].city,
            formattedAddress: data[0].formattedAddress,
            bedrooms: req.body.house.bedrooms,
            bathrooms: req.body.house.bathrooms,
            monthRent: req.body.house.monthRent,
            //dateAvailable: [Date lease starts]
            //dateCreated: [Current Date]
            laundry: req.body.house.laundry,
            parking: req.body.house.parking,
            utilities: req.body.house.utilities,
            ac: req.body.house.ac,
            heating: req.body.house.heating,
            //desc: [Landlord tped description]
            image: [],
            lat: data[0].latitude,
            lng: data[0].longitude,
            author: {
                id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email
            }
        }

        let itemsProcessed = 0;

        req.files.forEach(function (file) {
            cloudinary.v2.uploader.upload(file.path, (err, result) => {
                console.log("Result from cloudinary from image" + (itemsProcessed + 1) + ":\n" + JSON.stringify(result, null, 2));
                // add cloudinary url for the image to the campground object under image property
                house.image.push({ url: result.secure_url, imageId: result.public_id });
                itemsProcessed += 1;
                if (itemsProcessed === req.files.length) {
                    createHouse(house);
                }
            });
        });

        function createHouse(house) {
            House.create(house, (err, newHouse) => {
                if (err) {
                    console.log(err);
                    res.render("new");
                } else {
                    console.log("House Created: \n" + newHouse + "\n");
                    res.redirect("/houses");
                }
            });
        }

    });
});



//Show
router.get("/houses/:id", (req, res) => {
    House.findById(req.params.id, (err, foundHouse) => {
        if (err) {
            console.log(err);
        } else {
            res.render("show", { house: foundHouse });
        }
    });
});

//Edit
router.get("/houses/:id/edit", auth.checkHouseOwnership, (req, res) => {
    House.findById(req.params.id, (err, foundHouse) => {
        if (err) {
            console.log(err);
        } else {
            res.render("edit", { house: foundHouse });
        }
    });
});

//Update
router.put("/houses/:id", auth.checkHouseOwnership, upload.single("image"), (req, res) => {
    House.findById(req.params.id, (err, foundHouse) => {
        if (err) {
            console.log(err);
        } else {
            console.log(req.body.house);
            geocoder.geocode(req.body.house.address, async (err, data) => {
                if (err) {
                    console.log(err);
                    res.redirect("back");
                }
                foundHouse.lat = data[0].latitude;
                foundHouse.lng = data[0].longitude;
                foundHouse.formattedAddress = data[0].formattedAddress;
                req.body.house.address = data[0].streetNumber + " " + data[0].streetName + ", " + data[0].city;

                if (req.file && foundHouse.image.length < 7) {
                    try {
                        var result = await cloudinary.v2.uploader.upload(req.file.path);
                        foundHouse.image.push({ url: result.secure_url, imageId: result.public_id });
                    } catch (err) {
                        console.log(err);
                        return res.redirect("/houses/" + req.params.id);
                    }
                }

                foundHouse.address = req.body.house.address;
                foundHouse.bedrooms = req.body.house.bedrooms;
                foundHouse.monthRent = req.body.house.monthRent;
                foundHouse.utilities = req.body.house.utilities;
                foundHouse.parking = req.body.house.parking;
                await foundHouse.save();
                res.redirect("/houses/" + req.params.id);
            });
        }
    });
});

//Delete
router.delete("/houses/:id", auth.checkHouseOwnership, (req, res) => {
    House.findById(req.params.id, async (err, foundHouse) => {
        if (err) {
            console.log(err);
            return res.redirect("/houses/" + req.params.id);
        }
        try {
            foundHouse.image.forEach(img => {
                cloudinary.v2.uploader.destroy(img.imageId);
            })
            foundHouse.remove();
            res.redirect("/houses");
        } catch (err) {
            console.log(err);
            return res.redirect("back");
        }
    });
});

module.exports = router;