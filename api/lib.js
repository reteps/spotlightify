require('dotenv').config()
const expressSession = require('express-session')
const SpotifyStrategy = require('passport-spotify').Strategy;

const checkAuth = (aReq, res, next) => {
  if (aReq.isAuthenticated()) {
    console.log('Request is authenticated.')
    next();
  } else {
    res.send({message: 'Not authenticated'})
  }
}
const session = expressSession({
  secret: 'cool spotify',
  resave: true,
  saveUninitialized: true,
})
module.exports = { session, checkAuth }
