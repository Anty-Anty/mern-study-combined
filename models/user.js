//lecture 134
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema ({
    name:{ type: String, required: true },
    email: { type: String, require: true, unique: true, match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'] },
    password: { type: String, required: true, minlength:6 },
    image: { type: String, required:true },
    //lecture138
    places: [{  type: mongoose.Types.ObjectId, required: true, ref: 'Place' }]
});

module.exports = mongoose.model('User', userSchema);

