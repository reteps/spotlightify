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
const spotifyStrategy = new SpotifyStrategy({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.BASE_URL + '/api/callback'
    },
    function (accessToken, refreshToken, expires_in, profile, done) {
      process.nextTick(function () { // On next DOM update
        return done(null, {
          access: accessToken,
          refresh: refreshToken
        }); // resolve with the profile
      });
    }
  )
const session = expressSession({
  secret: 'cool spotify',
  resave: true,
  saveUninitialized: true,
})
module.exports = { session, checkAuth, spotifyStrategy }
