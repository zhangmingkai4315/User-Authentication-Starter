import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import winston from 'winston'; //eslint-disable-line
import expressWinston from 'express-winston';
import {development_logger,production_logger,development_error_logger,production_error_logger} from './backend/lib/logger';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');
import User from './backend/models/User';
import routes from './backend/routes/index';
import users from './backend/routes/users';

import helmet from 'helmet';
import config from 'config';
import passport from 'passport';
import flash from 'connect-flash';


const app = express();
const LocalStrategy = require('passport-local').Strategy;
const secret = config.get('SecretThings');

const database = config.get('Database.mongoDB');
const db_connect_string='mongodb://'+database.host+':'+database.port+'/'+database.database;
mongoose.connect(db_connect_string,{server:{auto_reconnect:true}},(err) =>{
  if(err){
    console.log('Connect the database fail')
    process.exit(1);
  }
});

mongoose.connection.on('connected', function() {
    console.log('MongoDB connect success!');
});
mongoose.connection.on('error', (err)=>{
  console.log('MongoDB error: '+err);
  mongoose.disconnect();
});
mongoose.connection.on('disconnected', function() {
    console.log('MongoDB disconnected,Try to reconnect it!');
    mongoose.connect(db_connect_string, {server:{auto_reconnect:true}});
});

// Close the Mongoose connection, when receiving SIGINT
process.on('SIGINT', function() {
    mongoose.connection.close(function () {
        console.log('Force to close the MongoDB conection');
        process.exit(0);
    });
});
// setting the configuration about passport

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// view engine setup
app.set('views', path.join(__dirname, './backend/views'));
app.set('view engine', 'ejs');
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

if (app.get('env')  === 'production_logger') {
  app.use(expressWinston.logger(production_logger));
}else{
  app.use(expressWinston.logger(development_logger));
}

app.use('/', routes);
app.use('/users', users);



// error handlers
// development error handler
// will print stacktrace
if (app.get('env')  === 'production') {
  app.use(expressWinston.errorLogger(production_error_logger));
  // production error handler
  app.use((err, req, res) => {
      res.status(err.status || 500);
      res.render('error', {
          message: err.message,
          error: {}
      });
  });
}else{
  app.use(expressWinston.errorLogger(development_error_logger));
  app.use((err, req, res) => {
      res.status(err.status || 500);
      res.render('error', {
          message: err.message,
          error: err
      });
  });
}



function start() {
  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log("UAS server listening on port %d in %s mode", port, app.settings.env); //eslint-disable-line
}
export {start,app};
