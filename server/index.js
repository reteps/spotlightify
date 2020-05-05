  const express = require('express')
  const passport = require('passport')
  const consola = require('consola')
  const SpotifyStrategy = require('passport-spotify').Strategy;
  const { Nuxt, Builder } = require('nuxt')
  // My stuff
  const myLib = require('../api/lib')
  const backend = require('../api/index')
  const config = require('../nuxt.config.js')
  require('dotenv').config()

  const app = express()

  // Initialize Passport
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
  passport.serializeUser(function (tokens, done) { done(null, tokens) })
  passport.deserializeUser(function (obj, done) { done(null, obj) })
  app.use(myLib.session)
  app.use(passport.initialize())
  app.use(passport.session())
app.use('/app', myLib.checkAuth)
app.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    res.redirect('/'); // Make sure that we redirect AFTER session is destroyed
  })
});

  config.dev = process.env.NODE_ENV !== 'production'

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
