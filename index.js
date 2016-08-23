import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import routes from './backend/routes/index';
import users from './backend/routes/users';
import User from './backend/models/User';
import helmet from 'helmet';
import csrf from 'csurf';
import config from 'config';
import passport from 'passport';
import mongoose from 'mongoose';
import flash from 'connect-flash';

const app = express();
const LocalStrategy = require('passport-local').Strategy;
const secret = config.get('SecretThings');

// connect　the mongoDB database
const database = config.get('Database.mongoDB');
const db_connect_string='mongodb://'+database.host+':'+database.port+'/'+database.database;

mongoose.connect(db_connect_string,(err) =>{
  if(err){
    console.log("Connect the database fail")
    process.exit(1);
  }else{
    console.log("Connect the database success")
  }
});

// setting the configuration about passport

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// view engine setup
app.set('views', path.join(__dirname, './backend/views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('express-session')({ secret: secret['Session-Secret'], resave: false, saveUninitialized: false }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(helmet());
app.use(express.static(path.join(__dirname, 'public')));



app.use('/', routes);
app.use('/users', users);



// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use((err, req, res) => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.listen(process.env.PORT||3000);
