const expressSession = require('express-session')

const checkAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
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

const restructure = (songs) => {
  return songs.map(song => {
    // Pull everything out
    for (let [key, value] of Object.entries(song.track)) {
      if (key === 'external_urls') {
        value = value.spotify
        key = 'link'
      }
      song[key] = value
    }
    for (let artist of song.artists) {
      artist.link = artist.external_urls.spotify
      delete artist.external_urls
    }
    delete song.available_markets
    delete song.disc_number
    delete song.is_local
    delete song.external_ids
    delete song.duration_ms
    delete song.explicit
    delete song.album.artists
    delete song.album.release_date
    delete song.album.release_date_precision
    delete song.album.total_tracks
    delete song.album.available_markets
    song.album.link = song.album.external_urls.spotify
    delete song.album.external_urls
    delete song.track

    song.app = {
      album_id: song.album.id,
      song_id: song.song.id,
      artist_ids: song.artists.map(artist => artist.id)
    }
    return song
  })
}

module.exports = { session, checkAuth, restructure }
