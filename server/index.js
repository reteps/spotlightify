const express = require('express')
const consola = require('consola')
const myLib = require('../api/lib')

const { Nuxt, Builder } = require('nuxt')
const app = express()
const passport = require('passport')
const SpotifyStrategy = require('passport-spotify').Strategy;
require('dotenv').config()

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js')
config.dev = process.env.NODE_ENV !== 'production'
var session = require('express-session')
passport.use(
  new SpotifyStrategy({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/api/callback'
    },
    function (accessToken, refreshToken, expires_in, profile, done) {
      process.nextTick(function () { // On next DOM update
        return done(null, {access: accessToken, refresh: refreshToken}); // resolve with the profile
      });
    }
  )
)
passport.serializeUser(function (tokens, done) {
  done(null, tokens);
})

passport.deserializeUser(function (obj, done) {
  done(null, obj);
})
app.use(session({
  secret: 'cool spotify',
  resave: true,
  saveUninitialized: true,
}))
app.use(passport.initialize())
app.use(passport.session())
// app.use(function (req, res, next) {
//   res.header('Access-Control-Allow-Credentials', true);
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   res.header('Access-Control-Allow-Origin',req.headers.origin)
//   next()
// })
app.use('/app', myLib.checkAuth)
app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
      res.redirect('/'); // Make sure that we redirect AFTER session is destroyed
    })
});
async function start () {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  const { host, port } = nuxt.options.server

  await nuxt.ready()
  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }

  // Give nuxt middleware to express
  app.use(nuxt.render)
  // Use passport and persistent sessions

  // Listen the server
  app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}
start()
