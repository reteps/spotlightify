<template>
    <v-card>
      <div> Now select which playlists you would like to compare</div>
      <div>
        <v-select v-model="selectedMyPlaylist" :items="myPlaylistNames" label="My Playlist"></v-select>
        <v-select v-model="selectedFriendPlaylist" :items="friendPlaylistNames" label="Friend Playlist"></v-select>
        <v-btn :disabled="selectedFriendPlaylist == null || selectedMyPlaylist == null" color="primary" @click="retrievePlaylistsAndArtists">Lets go!</v-btn>
        <v-progress-circular v-if="songLoadProgress != -1" :value="songLoadProgress * 25"></v-progress-circular>
      </div>
    </v-card>
</template>
<script>
const axios = require('axios')
export default {
  name: 'MusicLoader',
  props: {
    friendAccess: {type: String, required: true},
    friendRefresh: {type: String, required: true}
  },
  data: function()  {
    return {
      songLoadProgress: -1,
      friendSongs: [],
      mySongs: [],
      friendPlaylists: [],
      myPlaylists: [],
      selectedFriendPlaylist: null,
      selectedMyPlaylist: null
    }
  },
  computed: {
      friendPlaylistNames() {
        if (!this.friendPlaylists) {
          return []
        }
        return ['Liked Songs'].concat(this.friendPlaylists.map(item => item.name))
      },
      myPlaylistNames() {
        if (!this.myPlaylists) {
          return []
        }
        return ['Liked Songs'].concat(this.myPlaylists.map(item => item.name))
      },
  },
  created() {
    this.loadPlaylists()
  },
  methods: {
      retrievePlaylistsAndArtists() {
        let vm = this
        this.startedLoad = true
        this.songLoadProgress = 0
        this.retrievePlaylist((this.friendPlaylists.find(o => o.name == vm.selectedFriendPlaylist) || {id:'Liked Songs'}).id, this.friendAccess).then(songs => {
          vm.friendSongs = songs
          vm.songLoadProgress += 1
          return songs
        }).then(songs => {
          console.log(`Received ${songs.length}`)
          return vm.loadArtists(songs)
        }).then(artists => {
          vm.friendArtists = artists
          vm.songLoadProgress += 1
        })
        .then(() => vm.retrievePlaylist((vm.myPlaylists.find(o => o.name == vm.selectedMyPlaylist) || {id:'Liked Songs'}).id)) // Now load my songs
        .then(songs => {
          vm.mySongs = songs
          vm.songLoadProgress += 1
          return songs
        }).then(songs => {
          console.log(`Received ${songs.length}`)
          return vm.loadArtists(songs)
        }).then(artists => {
          vm.myArtists = artists
          vm.songLoadProgress += 1
          vm.$emit('songs', vm.myArtists, vm.mySongs, vm.friendArtists, vm.friendSongs)
        })
      },
      loadArtists(dataset) {
        console.log('The dataset is', dataset.length)
        return axios.post('/api/artists', this.flattenSongArtists(dataset))
          .then(res => {
            console.log('Received reply')
            return res.data
          }).catch(err => {
            console.log(`ERR: ${err}`)
          })
      },
      flattenSongArtists(songs) {
        let artists = songs.flatMap(song => song.track.artists).map(a => a.id)
        return artists.filter((artist, index, arr) => artists.indexOf(artist) === index && artist != null)
      },
      retrievePlaylist(id, token='') {
        let func = (id == 'Liked Songs') ? this.loadSongs : this.loadPlaylist
        return func(id, token)
      },
      loadSongs: function(_, token) {
        return axios.get(`/api/songs/${token}`).then(res => {
          return res.data
        })
      },
      loadPlaylist: function(id, token) {
        return axios.get(`/api/playlist/${id}/${token}`).then(res => {
          return res.data
        })
      },
      loadPlaylists() {
        let vm = this;
        axios.get(`/api/playlists/${this.friendAccess}`).then(res => {
          vm.friendPlaylists = res.data.items
          return axios.get('/api/playlists')
        }).then(res => {
          console.log(res.data)
          vm.myPlaylists = res.data.items
        })
      }
  }
}
</script>
