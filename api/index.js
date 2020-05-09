"use strict"
const express = require('express')
const passport = require('passport')
const consola = require('consola')
const myLib = require('./lib')
const axios = require('axios')
const qs = require('querystring')

const ENCODED_CLIENT = Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64')

let backend = express.Router()
backend.use(express.json())
require('dotenv').config()

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
function getArtists(token, artistIDs) {
  return new Promise( (resolve, reject) => {
    let artists = []

    console.log('Backend got  request')
    for (let i = 0; i < artistIDs.length; i += 50) {
      let end = (artistIDs.length > i + 50) ? (artistIDs.length - i) : i + 50
      let part = artistIDs.slice(i, i + 50)
      console.log(part[0])
      axios.get("https://api.spotify.com/v1/artists", {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          ids: part.join(',')
        }
      }).then(resp => {
        console.log(artists.length)
        artists.push(...resp.data.artists)
        if (artistIDs.length == artists.length) {
          resolve(artists)
        }
      }).catch(err => {
        reject(err)
      })
    }

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

backend.get('/songs/:token?', (req, res, next) => {
  let token = null
  if (req.params.token !== undefined) {
    token = req.params.token
  } else if (req.isAuthenticated()) {
    token = req.user.access
  } else {
    res.status(400).send({message: 'Not authenticated'})
  }
  console.log('Running.')
  getTracks("https://api.spotify.com/v1/me/tracks?offset=0&limit=50", token)
  .then(rawSongs => {
    const songs = myLib.restructure(rawSongs)
    console.log('Received:', songs)
    res.json(songs)
  })
})
backend.get('/me', myLib.checkAuth, (req, res, next) => {
  res.json({message: req.user.refresh})
})
backend.post('/artists', myLib.checkAuth, (req, res) => {
  getArtists(req.user.access,  req.body)
  .then(artists => {
    res.json(artists)
  }).catch(err => {
    res.status(500).send({message: err})
  })
})
backend.get('/refresh/:token', (req, res) => {
  if (!req.params.token) {
    res.status(400).send({
      message: 'Token cannot be none'
    })
  }
  axios.post('https://accounts.spotify.com/api/token', null, {
      params: {
        grant_type: 'refresh_token',
        refresh_token: req.params.token
      },
      headers: {
      'Authorization': `Basic ${ENCODED_CLIENT}`,
      'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(res => {
    return res.data
  }).then(data => {
    res.json(data)
  }).catch(err => {
    console.log(err)
    res.json({message: err.message})
  })
})
module.exports = backend
