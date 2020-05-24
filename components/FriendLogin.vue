<template>

  <v-card>
    <v-card-text>
    <h2 class='text--primary'> Congratulations 🎉! You are now logged in. 🎉 </h2>
    <div class='text--primary'> In order to access your friend's music, we need their secret code or a link to their <b> public </b>playlist. If the secret code is provided, you can access their Liked Songs and private playlists.
    Click the button to view your token if you are sharing it.</div>
    </v-card-text>
    <div> Enter the link to their playlist <b> OR </b> their secret code </div>
    <v-textarea auto-grow rows="2" outlined v-model="secretToken" placeholder="https://open.spotify.com/playlist/1qMrfpKAX8C..."></v-textarea>
    <v-card-actions>
      <v-btn class="mr-2" color="primary" :disabled='!secretToken' @click="submitSecretToken"> Lets go! </v-btn>
      <v-progress-circular indeterminate v-if="loadingFriend"></v-progress-circular>
      <v-spacer></v-spacer>
      <v-btn @click="getToken">
        Reveal Code <v-icon>{{ show ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </v-btn>
    </v-card-actions>
        <v-expand-transition>
      <div v-show="show">
        <v-textarea rows="2" auto-grow :value="refreshToken"></v-textarea>
      </div>
    </v-expand-transition>
  </v-card>
</template>
<script>
const axios = require('axios')

export default {
  name: 'FriendLogin',
  data() {
    return {
      secretToken: null,
      loadingFriend: false,
      refreshToken: '',
      secretToken: '',
      show: false

    }
  },
  methods: {
      flattenSongArtists(songs) {
        let artists = songs.flatMap(song => song.track.artists).map(a => a.id)
        return artists.filter((artist, index, arr) => artists.indexOf(artist) === index && artist != null)
      },
    getToken() {
      this.show = !this.show
      if (!this.show || this.refreshToken) {
        return
      }
      axios.get('/api/token').then(res => {
        let response = res.data.message
        this.refreshToken = response.replace(/^\s+|\s+$/g, '')
      }).catch(err => {
        console.log(err)
      })
    },
    submitSecretToken: function() {
      this.show = false
      let vm = this;
      vm.loadingFriend = true
      // First determine if it is a playlist
      if (!this.secretToken) {
        vm.loadingFriend = false
        throw new Error('Code cannot be empty')
        return
      }
      if (this.secretToken.indexOf('spotify.com') > -1) {
        let regex = /playlist\/([a-zA-Z0-9]+)/g.exec(this.secretToken)
        console.log(regex)
        if (regex == null) {
          vm.loadingFriend = false
          throw new Error('That is not a valid spotify link')
        }
        let code = regex[1]
        console.log(code)
        axios.get(`/api/playlist/${code}`).then(d => {
          let songs = d.data
          if (songs.length == 0) {
            throw new Error('That is not a valid playlist (is it private?)')
          }
          console.log(`Received ${songs.length} songs`)
          vm.$store.commit('setSongs', {
              user: 'friend',
              songs
            })
          return axios.post('/api/artists', this.flattenSongArtists(songs))
        }).then(d => {
          let artists = d.data
          vm.$store.commit('setArtists', {
              user: 'friend',
              artists
            })
            vm.$store.commit('tokensLoaded', true)
        }).catch(err => {
          vm.loadingFriend = false
          vm.$toast.info(err.message)
        })

        return
      }
      axios.get(`/api/refresh/${this.secretToken}`)
      .then(res => res.data.access_token)
      .then(token => {
        vm.loadingFriend = false
        vm.addedFriend = true
        console.log(vm.secretToken, token)
        vm.$store.commit('setFriendTokens', {access: token, refresh: vm.secretToken })
        vm.$store.commit('tokensLoaded', true)
      })
      .catch(err => {
        vm.loadingFriend = false
        vm.$toast.info('That is not a valid token')
      })
    }
  }
}
</script>
