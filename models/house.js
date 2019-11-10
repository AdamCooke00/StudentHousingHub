const mongoose = require("mongoose");

//Schema
const houseSchema = new mongoose.Schema({
    rentalType: String,
    unit: String,
    address: String,
    formattedAddress: String,
    bedrooms: Number,
    bathrooms: Number,
    monthRent: Number,
    dateAvailable: Date,
    // dateCreated: new Date(),
    laundry: String,
    parking: String,
    utilities: String,
    ac: String,
    heating: String,
    desc: String,
    image: [
        {
            url: String,
            imageId: String
        }
    ],
    lat: Number,
    lng: Number,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        email: String,
        firstName: String,
        lastName: String
    }
});

var House = mongoose.model("House", houseSchema);

module.exports = House;