"use strict"
const express = require('express')
const passport = require('passport')
const consola = require('consola')
const myLib = require('./lib')
const axios = require('axios')
const qs = require('querystring')
var passportService = require('passport-spotify')(passport)

let backend = express.Router()
require('dotenv').config()
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

backend.get('/songs', (req, res, next) => {
  token = null
  if (req.query.token !== undefined) {
    token = req.query.token
  } else if (req.isAuthenticated()) {
    token = req.user.access
  } else {
    res.status.send({message: 'Not authenticated'})
  }
  console.log('Running.')
  getTracks("https://api.spotify.com/v1/me/tracks?offset=0&limit=50", token)
  .then(data => {
    console.log('Received:', data)
    res.json(data)
  })
})
backend.get('/me', myLib.checkAuth, (req, res, next) => {
  res.json({message: req.user.refresh})
})
backend.get('/refresh/:token', (req, res) => {
  if (!req.params.token) {
    res.status(400).send({
      message: 'Token cannot be none'
    })
  }
  const encodedClient = Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64')
  const requestBody = {
        grant_type: 'refresh_token',
        refresh_token: req.params.token
  }
  axios.post('https://accounts.spotify.com/api/token', qs.stringify(requestBody),
      {headers: {
      'Authorization': `Basic ${encodedClient}`,
      'Content-Type': 'application/x-www-form-urlencoded'
      }}).then(res => {
    return res.data
  }).then(data => {
    res.json(data)
  }).catch(err => {
    console.log(err)
    res.json({message: err.message})
  })
})
module.exports = backend
