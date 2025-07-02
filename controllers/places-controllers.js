const fs = require('fs');

const {v4:uuidv4} = require('uuid');
//lecture 104 validation
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAdress = require('../util/location');
const Place = require('../models/place');
const User = require ('../models/user')

// let DUMMY_PLACES = [
//     {
//         id: 'p1',
//         title: 'Empire State Building',
//         description: 'One of the most famous skyscrapers in the world',
//         location: {
//             lat: 40.7484405,
//             lag: -73.9882393
//         },
//         address: 'New York',
//         creator: 'u1'
//     }
// ];

//my own code!!! for some reason there is no getPlace route in corse.
const getPlaces = async (req, res, next) => {
    let places;
    try{
        places = await Place.find()
    }catch (err) {
        const error = new HttpError(
            'Fetching places failed, please try again.',500
        );
        return next(error);
    }

    if (places.length ===0) {
        const error =  new HttpError('Could not find no places.', 404);
        return next(error);
    }

    res.json({places:places.map(place=>place.toObject({getters:true}))});
};

const getPlaceById = async (req, res, next) => {
    //params property holds dinamic segmant :pid with entered in url value
    const placeId = req.params.pid;

    let place;
    try {
    place = 
    // DUMMY_PLACES.find(p => {
    //     return p.id === placeId;
    // });

    //lecture 129 if add .exec() it will retern a real promise  Place.findById().exec();
        await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError (
            'Something went wrong, could not find a place.', 500
        );
        return next(error);
    };

    // if url is wrong, we send 404 code
    // lecture 95 error handling
    if (!place) {
        // lecture 95 2min. "return" in if statement stop code execution and we don't go to res.json
        // return res.status(404).json({message:'Could not find a place for the provided id.'});

        // const error = new Error('Could not find a place for the provided id.')
        // error.code = 404;
        // // trow doesn't works with async functions
        // throw error;

        //lecture 96
        const error =  new HttpError('Could not find a place for the provided id.', 404);
        return next(error);
    }

    // lexture129 convirting mongoose object to JS object
    // findById(), doesnot retern JS Object, so .toObject turns Object to normal JS object, {getters:true} - get rid of underscore in id (_id)
    res.json({place:place.toObject({getters:true})});
};

const getPlacesByUserId = async (req,res,next) => {
    const userId = req.params.uid;
    let places 
    
    try{
        places = await Place.find({ creator : userId });
        // DUMMY_PLACES.filter(p =>{return p.creator === userId})
       
    }catch(err){
        const error = new HttpError (
            'Fetching places failed, please try again.',500
        );
        return next(error);
    };

    
    //lecture 95 error handling
    if (!places || places.length === 0) {
        // const error = new Error('Could not find a place for the provided user id.')
        // error.code = 404;
        // // next() works with async functions
        // return next(error);

        return next(new HttpError('Could not find any places for the provided user id.', 404));
    }

    res.json({places:places.map(place=>place.toObject({getters:true}))});
    
}

//lecture 98
const createdPlace = async (req,res,next) => {
    //lecture 104 validation
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.log(errors);
        return next( new HttpError('Invalid inputs passed, please check your data.', 422));
    }

    const { title, description, address, creator } = req.body;

    const coordinates = await getCoordsForAdress(address);

    // const createdPlace = {
    //     id: uuidv4(),
    //     title:title,
    //     description:description,
    //     location:coordinates,
    //     address:address,
    //     creator:creator
    // };

    const createdPlace = new Place({
        title:title,
        description:description,
        address:address,
        location:coordinates,
        image:req.file.path,
        creator:creator
    });


    //lecture 139
    let user;
    //find user for provided id
    try{
        user = await User.findById(creator);
    }catch(err){
        const error = new HttpError(
            'Creating place failed', 500
        );
        return next(error);
    };
    //check if this user in data base
    if(!user){
        const error = HttpError (
            'Could not find user for provided id', 404
        );
        return next(error)
    };

    console.log(user);

    // DUMMY_PLACES.push(createdPlace);
    try{
        // await createdPlace.save();
        // lecture 139
        // we are adding Place to places collection. 
        // when using transactions and sessions collection doesnot created automatically 
        // so we need to make sure that collection already exists in mango Atlas
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({session:sess});
        user.places.push(createdPlace);
        await user.save({session:sess});
        await sess.commitTransaction();

    } catch (err) {
        console.log(err);
        const error = new HttpError(
            'Creating place failed, please try again.', 500
        );
        console.log(error);
        return next(error)
    }
    
    // seems like in create route turning mangoose object into JS object is not necessary
    res.status(201).json({place: createdPlace});
};

const updatePlace = async (req,res,next) => {

    const errors = validationResult(req);
    
    if (!errors.isEmpty()){
        console.log(errors);
        return next (
            new HttpError('Invalid inputs passed, please check your data.', 422)
     );
    }
    
    const { title, description } = req.body;
    const placeId = req.params.pid;

    // const updatePlace = {...DUMMY_PLACES.find(p => p.id === placeId)};
    // const placeIndex = DUMMY_PLACES.findIndex(p=>p.id === placeId);

    // lecture 131
    let place;
    try{
        place = await Place.findById(placeId);
        
       
    }catch(err){
        const error = new HttpError (
            'Could not update place.',500
        );
        return next(error);
    };

    //lect 185 checking before updating place if place was created by logged in user. 
    //req.userData.userId is attached to token, which is seems like to be attached to req object
    //place.creator is comming from mongoDB, so it need to be turned into a string by .toString()
    if (place.creator.toString() !== req.userData.userId){
        const error = new HttpError (
            'You are not allowed to edit this place.', 401
        );
        return next(error);
    }

    place.title = title;
    place.description = description;

    // DUMMY_PLACES[placeIndex] = updatePlace;

    try {
        await place.save();
    } catch(err){
        const error = new HttpError (
            'Could not update place.',500
        );
        return next(error); 
    }

    res.status(200).json({place:place.toObject({getters:true})});

};

const deletePlace = async (req,res,next) => {
    const placeId = req.params.pid;

    //lecture 105 check if place exists
    // if (!DUMMY_PLACES.find(p=>p.id===placeId)){
    //     throw new HttpError('Could not find a place for that id.', 404)
    // }
    // DUMMY_PLACES = DUMMY_PLACES.filter(p=> p.id !== placeId);

    // lecture 140 populate() 
    let place;

    try {
        place = await Place.findById(placeId).populate('creator');
    } catch(err){
        // console.log(err.message);
        const error = new HttpError (
            'Could not find place.',500
        );
        return next(error); 
    };

    if(!place) {
        const error = new HttpError('Could not find place for this id', 404);
        return next(error); 
    }

    //lect 186 checking before updating place if place was created by logged in user. 
    //req.userData.userId is attached to token, which is seems like to be attached to req object
    //here place.creator.id is string but part of an object
    if(place.creator.id!== req.userData.userId){
        const error = new HttpError (
            'You are not allowed to delete this place.', 401
        );
        return next(error);
    }

    const imagePath = place.image;

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.deleteOne({session:sess});
        place.creator.places.pull(place);
        await place.creator.save({sessopn: sess});
        await sess.commitTransaction();
        // place = await Place.deleteOne({ _id: placeId })
    } catch(err){
        const error = new HttpError (
            'Could not delete place.',500
        );
        return next(error); 
    };

    fs.unlink(imagePath, err => {
        console.log(err)
    });

    res.status(200).json({message: 'Deleted place.'});
}; 


exports.getPlaces = getPlaces;
//lecture 97
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createdPlace = createdPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;