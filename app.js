const fs = require('fs');
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
//lecture126
const mongoose = require('mongoose');

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');


const app = express();

app.use(bodyParser.json());

//opening frontend access to images which are stored in backend (kind of endpoint)
app.use('/uploads/images', express.static(path.join('uploads','images'))); 

//lect 206 deploying combined app
app.use(express.static(path.join('public'))); 

//lecture 149
app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE')
    next();
});

// app.use() - generic midleware which trigers on all requests
// app.get() - midleware with specific http methods

//register placesRoutes
app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);

//lect 206 deploying combined app
app.use((req,res,next)=>{
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
 });

// lecture 99 this middleware is only reache if it didn't have responce before
// app.use((req,res,next)=>{
//     const error = new HttpError('Could not find this route.', 404);
//     throw error;
// });

//lecture 95 error handling midleware function, because it has 'error' attribute first
//General error handeling logic
app.use((error,req,res,next)=>{
    
    //preventing file upload in case of Error
    if(req.file){
        fs.unlink(req.file.path, (err)=>{
            console.log(err);
        });
    }
    if (res.headerSent) {
        return next(error);
    }

    // if error.code exists (therefore it's true) then we get 'error.code' if it false, we get '500'
    res.status(error.code || 500);
    res.json({message: error.message || 'Unknown error occured!'})
});

//lecture126
mongoose
.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.9asrz.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`)
.then(()=>{
    app.listen(process.env.PORT || 5000);
})
.catch(err =>{
    console.log(err);
});
