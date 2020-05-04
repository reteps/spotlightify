const express = require('express')
const consola = require('consola')
const myLib = require('../api/lib')
const backend = require('../api/index')
const { Nuxt, Builder } = require('nuxt')
const passport = require('passport')
require('dotenv').config()
const SpotifyStrategy = require('passport-spotify').Strategy;

const app = express()
const config = require('../nuxt.config.js')
config.dev = process.env.NODE_ENV !== 'production'

// passport.use(myLib.spotifyStrategy)
passport.serializeUser(function (tokens, done) {
  done(null, tokens);
})

passport.deserializeUser(function (obj, done) {
  done(null, obj);
})
passport.use(myLib.session)
passport.use(new SpotifyStrategy({
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
    ))
app.use(passport.initialize())
app.use(passport.session())
app.use('/app', myLib.checkAuth)
app.use('/api', backend)
app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
      res.redirect('/')
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

  // Listen the server
  app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}
start()
