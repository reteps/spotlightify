<template>
  <div class="container">

  <div class="friend-login">
    <div> Congratulations 🎉! You are now logged in. 🎉 </div>
    <div> In order to access your friend's music, we need their secret token. Click the button to see your token.</div>
    <div v-if="refreshToken==''">
      <v-btn v-on:click="getToken"> Reveal token </v-btn>
    </div>
    <v-textarea outlined small label="Refresh Token" v-model="refreshToken" :value="refreshToken" v-else></v-textarea>
    <div> Enter your friend's token below: </div>
    <v-textarea solo v-model="secretToken" placeholder="AQCc2h_GJ2Q4NpOI-T_NryAmyf_EL4pWTjrZbp4VWoViZbE2fBTOEmBUD-J_yJnm..."></v-textarea>
    <div>
      <v-btn large color="primary" @click="submitSecretToken"> Lets go! </v-btn>
      <v-progress-circular indeterminate v-if="loadingFriend"></v-progress-circular>
    </div>
  </div>
  </div>
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

    }
  },
  methods: {
    getToken: function(e) {
      axios.get('/api/me').then(res => {
        let response = res.data.message
        this.refreshToken = response.replace(/^\s+|\s+$/g, '')
      }).catch(err => {
        console.log(err)
      })
    },
    submitSecretToken: function() {
      let vm = this;
      vm.loadingFriend = true
      if (!this.secretToken) {
        vm.loadingFriend = false
        throw new Error('Token cannot be empty')
        return
      }
      axios.get(`/api/refresh/${this.secretToken}`)
      .then(res => res.data.access_token)
      .then(token => {
        vm.loadingFriend = false
        vm.addedFriend = true
        console.log(vm.secretToken, token)
        vm.$emit('tokens', vm.secretToken, token)
      })
      .catch(err => {
        vm.loadingFriend = false
        vm.$toast.info(err.message)
      })
    }
  }
}
</script>
<style lang="sass">
  .friend-login
    border: 1px solid black
    width: 33%
    border-radius: 20px
    box-shadow: 5px 10px
    display: flex
    height: auto
    flex-direction: column
    text-align: center
    justify-content: center
    align-content: center
    padding: 1em
  .container
    margin: 0 auto
    min-height: 80vh
    display: flex
    justify-content: center
    align-items: center
    text-align: center
</style>
