<template>

  <v-card>
    <v-card-text>
    <h2 class='text--primary'> Congratulations 🎉! You are now logged in. 🎉 </h2>
    <div class='text--primary'> In order to access your friend's music, we need their secret token. Click the button to view your token and share it with a friend.</div>
    </v-card-text>
    <div> Enter your friend's token below: </div>
    <v-textarea :auto-grow="true" solo v-model="secretToken" placeholder="AQCc2h_GJ2Q4NpOI-T_NryAmyf_EL4pWTjrZbp4VWoViZbE2fBTOEmBUD-J_yJnm..."></v-textarea>
    <v-card-actions>
      <v-btn class="mr-2" color="primary" :disabled='!secretToken' @click="submitSecretToken"> Lets go! </v-btn>
      <v-progress-circular indeterminate v-if="loadingFriend"></v-progress-circular>
      <v-spacer></v-spacer>
      <v-btn @click="getToken">
        Reveal Token <v-icon>{{ show ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </v-btn>
    </v-card-actions>
        <v-expand-transition>
      <div v-show="show">
        <v-textarea :auto-grow="true" :value="refreshToken"></v-textarea>
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
    getToken() {
      this.show = !this.show
      if (!this.show || this.refreshToken) {
        return
      }
      axios.get('/api/me').then(res => {
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
