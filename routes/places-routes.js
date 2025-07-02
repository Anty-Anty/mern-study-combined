const express = require('express');
//lecture 104 validation
const { check } = require('express-validator');

const placesControllers = require('../controllers/places-controllers');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

// express.Router is used in external modules/midleware to connect them to app.js
const router = express.Router();

//my own code!!! for some reason there is no getPlace route in corse.
router.get('/', placesControllers.getPlaces);

router.get('/:pid', placesControllers.getPlaceById);

router.get('/user/:uid', placesControllers.getPlacesByUserId);

//lect 182 ALL ROUTES BELOW THIS MIDDLEWARE ARE PROTECTED WITH A TOKEN, SO TO GET THERE WE NEED TOKEN
// TOKEN HAS TO BE PART OF THE AUTHORIZATION HEADER
router.use(checkAuth);

//lecture 98 post route

router.post(
    '/',
    fileUpload.single('image'),
    //lecture 104 validation
    [
        check('title')
            .not()
            .isEmpty(),
        check('description').isLength({ min: 5 }),
        check('address')
            .not()
            .isEmpty(),
    ],
    placesControllers.createdPlace)

//lecture 100
router.patch('/:pid', [
    check('title')
        .not()
        .isEmpty(),
    check('description').isLength({ min: 5 })
], placesControllers.updatePlace)

router.delete('/:pid', placesControllers.deletePlace)

module.exports = router;