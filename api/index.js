"use strict"
const express = require('express')
const passport = require('passport')
const consola = require('consola')
const myLib = require('./lib')
const axios = require('axios')
let backend = express.Router()

let session = {
  'secret': 'cool spotify',
  resave: true,
  saveUninitialized: true,
}
function getTracks(url, auth, currentTracks=[]) {
  return axios.get(url, {headers: {
    'Authorization' : `Bearer ${auth}`
  }}).then(res => {
    consola.log(url, "=>", res.data.next)
    if (res.data.items !== undefined) {
      currentTracks = currentTracks.concat(res.data.items)
    }
    if (res.data.next) {
      return getTracks(res.data.next, auth, currentTracks)
    } else {
      console.log(`There are ${currentTracks.length} songs.`)
      return currentTracks
    }
  }).catch(err => {
    console.log(err)
  })
}
backend.get('/', (req, res) => {
  res.send('<h1>Api working!</h1>')
})
backend.get('/auth',passport.authenticate('spotify', {
  scope: ['user-library-read', 'playlist-read-private', 'playlist-read-collaborative'],
  showDialog: true
}))
backend.get('/callback',
passport.authenticate('spotify',
{failureRedirect: '/', successRedirect: '/app'}))

backend.get('/test', myLib.checkAuth, (req, res, next) => {
  console.log('Running.')
  getTracks("https://api.spotify.com/v1/me/tracks?offset=0&limit=50", req.user.access)
  .then(data => {
    console.log('Received:', data)
    res.json(data)
  })
})
module.exports = backend
