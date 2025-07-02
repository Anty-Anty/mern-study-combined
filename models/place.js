// mongoose schema

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//schema
const placeSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    //lecture138
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User'}
});

//'Place' - name of the model, placeSchema - schema
module.exports = mongoose.model('Place', placeSchema);

// now we export schema to places-controllers.js, and place there instead of DUMMY_PLACES