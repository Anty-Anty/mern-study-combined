// const {v4:uuidv4} = require('uuid');
//lecture 105 validation
const { validationResult } = require('express-validator');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
// connect to user model
const User = require('../models/user');

// const DUMMY_USERS = [
//     {id: 'u1', 
//     name: "Bobby Brown", 
//     email:'test@test.com',
//     password:'test'
// }];

const getUsers = async (req, res, next) => {
    //lecture 137
    let users;

    try {
        users = await User.find({}, '-password');
    } catch (err) {
        const error = new HttpError(
            'Fetching users failed.', 500
        );

        return next(error);
    }

    res.json({ users: users.map(user => user.toObject({ getters: true })) });
    // res.json({users:DUMMY_USERS});
};

const signup = async (req, res, next) => {
    //lecture 105 validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // console.log(errors);
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    };

    // const { name, email, password } = req.body;
    const { name, email, password } = req.body;

    // const hasUser = DUMMY_USERS.find(u => u.email === email);
    // if(hasUser){
    //     throw new HttpError('Could not create user, email already exists.', 422);
    // }

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {

        const error = new HttpError(
            'Signing up failed.', 500
        );

        return next(error);
    }

    if (existingUser) {
        const error = new HttpError(
            'User exists aleady, please login instead.', 422
        );
        return next(error);
    }

    //lect 178
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        const error = new HttpError('Could not create user, please try again.', 500);
    }


    const createdUser = new User({
        name: name,
        email: email,
        image: req.file.path,
        password: hashedPassword,
        //lecture 138
        places: []
    });

    try {
        await createdUser.save();
    } catch (err) {
        console.log(err)
        const error = new HttpError(
            'Signing up failed, please try again.', 500
        );
        return next(error)
    }

    // DUMMY_USERS.push(createdUser);

    let token;
    try {
        token = jwt.sign(
            {
                userId: createdUser.id,
                email: createdUser.email
            },
            process.env.JWT_KEY,
            // expiration is depricated use expiresIn
            { expiresIn: '1h' }

        );

    } catch (err) {
        console.log(err)
        const error = new HttpError(
            'Signing up failed, please try again.', 500
        );
        return next(error)
    }

    // res.status(201).json({ user: createdUser.toObject({ getters: true }) });
    res.status(201).json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {

    const { email, password } = req.body;

    let existingUser;

    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {

        const error = new HttpError(
            'Logging in failed.', 500
        );

        return next(error);
    }


    if (!existingUser) {
        const error = new HttpError(
            'Invalid credentials, could not log you in.', 403
        )
        return next(error);
    };
    // const identifiedUser = DUMMY_USERS.find(u => u.email === email);
    // if(!identifiedUser || identifiedUser.password !== password){
    //     throw new HttpError('Could not identify user', 403);
    // }

    let isValidPassword = false;
    try {

        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
        const error = new HttpError('Could not log you in, please check your credentials and try again.', 500);
        return next(error);
    }

    if (!isValidPassword) {
        const error = new HttpError(
            'Invalid credentials, could not log you in.', 403
        )
        return next(error);
    }

    let token;
    try {
        token = jwt.sign(
            {
                userId: existingUser.id,
                email: existingUser.email
            },
            process.env.JWT_KEY,
             // expiration is depricated use expiresIn
            { expiresIn: '1h' }

        );

    } catch (err) {
        console.log(err)
        const error = new HttpError(
            'Logging in failed, please try again.', 500
        );
        return next(error)
    }

    // res.json({ message: 'Logged in!', user: existingUser.toObject({ getters: true }) });
    res.json({
        userId: existingUser.id,
        email: existingUser.email,
        token: token
    });
};



exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;