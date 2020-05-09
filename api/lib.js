const expressSession = require('express-session')
const subgenre = require('subgenre.js')
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
    delete song.track_number
    delete song.album.artists
    delete song.album.release_date
    delete song.album.release_date_precision
    delete song.album.total_tracks
    delete song.album.available_markets
    song.album.link = song.album.external_urls.spotify
    delete song.album.external_urls
    delete song.track
    return song
  })
}

const CONNECTION_TYPES = Object.freeze({
  USER_TO_GENRE: 50,
  GENRE_TO_ARTIST: 30,
  ARTIST_TO_ALBUM: 50,
  ALBUM_TO_SONG: 20,
})

const NODE_TYPES = Object.freeze({
  USER: 1,
  GENRE: 2,
  ARTIST: 3,
  ALBUM: 4,
  SONG: 5
})
const getAllArtists = (songs) => {
  let artists = songs.flatMap(song => song.artists).map(a => a.id)
  return artists.filter((artist, index, arr) => artists.indexOf(artist) === index)
}
const addGenre = (artists) => {
  console.log('adding genre', artists[0])
  let artistsWithGenres = artists
    .map(a => {
      a.tlgs = a.genres.map(g => subgenre.topLevelGenre(g))
      return a
    })
    .map(a => {
      a.genre = (a.tlgs.length == 0) ? 'other' : subgenre.mostPopularGenre(a.tlgs)
      delete a.tlgs
      delete a.genres
      return a
    })
  let genres = artistsWithGenres.map(a => a.genre)
  let uniq = [...new Set(genres)].reduce((dict, g) => {
    dict[g] = genres.filter(v => v == g).length
    return dict
  }, {})
  artistsWithGenres.map(a => {
    if (a.genre == 'other' || uniq[a.genre] < 10) {
      a.genre = 'other'
    }
    return a
  })
  uniq.other = 999
  return {
    artistsWithGenres: artistsWithGenres,
    genreMap: uniq
  }
}
const generateNodesAndLinks = (songs, artists) => {
  let {
    artistsWithGenres,
    genreMap
  } = addGenre(artists)
  console.log('genres added', genreMap)
  console.log(artistsWithGenres.length)
  console.log(songs.length)
  let nodes = []
  let links = []
  for (let genre in genreMap) {
    // Create all genre nodes
    if (genreMap[genre] < 10) {
      continue
    }
    console.log(genre)
    nodes.push({
      name: genre,
      type: NODE_TYPES.GENRE,
      id: genre,
      link: null
    })
    links.push({
      source: 'USER_NODE',
      target: genre,
      type: CONNECTION_TYPES.USER_TO_GENRE
    })
  }
  console.log('genres  done')
  for (let artist of artistsWithGenres) {
    nodes.push({
      name: artist.name,
      id: artist.id,
      type: NODE_TYPES.ARTIST,
      link: artist.link
    })
    links.push({
      source: artist.id,
      target: artist.genre,
      type: CONNECTION_TYPES.GENRE_TO_ARTIST
    })
  }

  console.log('artists done')
  let visitedAlbums = []
  for (let song of songs) {
    // Create all nodes
    let songNode = {
      name: song.name,
      link: song.link,
      type: NODE_TYPES.SONG,
      id: song.id
    }
    let albumNode = {
      name: song.album.name,
      link: song.album.link,
      type: NODE_TYPES.ALBUM,
      id: song.album.id
    }
    if (visitedAlbums.indexOf(albumNode.id) === -1) {
      nodes.push(albumNode)
      song.artists.slice(0, 1).forEach(artist => {
        links.push({
          source: artist.id,
          target: albumNode.id,
          type: CONNECTION_TYPES.ARTIST_TO_ALBUM
        })
      })
      visitedAlbums.push(albumNode.id)
    }
    nodes.push(songNode)
    // Create connection between album and each artist
    // Create connection between all artists and user

    // Create connection between album and song
    console.log(albumNode.id, songNode.id)
    links.push({
      source: albumNode.id,
      target: songNode.id,
      type: CONNECTION_TYPES.ALBUM_TO_SONG
    })

  }
  // Add user node
  let userNode = {
    name: 'User Node',
    link: null,
    type: NODE_TYPES.USER,
    id: 'USER_NODE'
  }
  nodes.push(userNode)
  return {
    links,
    nodes
  }
}

module.exports = { session, checkAuth, restructure, generateNodesAndLinks, getAllArtists }
