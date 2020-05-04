<template>
<div>

Welcome to my super cool app guys!
<button v-on:click="testSongs">Test some stuff</button>
<a href="/logout">Logout</a>
<button v-on:click="getToken">Get your token</button>
<div> {{ response }} </div>
<input v-model="message">
<button v-on:click="testRefresh"> Test refresh token </button>
</div>
</template>
<script>
const axios = require('axios')
export default {
  data() {
    return {
      response: '',
      message: ''
    }
  },
  methods: {
    testSongs: function(e) {
      console.log('Running')
      axios.get('/api/songs').then(res => {
        // console.log(res)
        //this.response = res.body
      }).catch(err => {
        console.log(err)
      })
    },
    getToken: function(e) {
      axios.get('/api/me').then(res => {
        console.log(res)
        this.response = res.data.message
      }).catch(err => {
        console.log(err)
      })
    },
    testRefresh: function(e) {
      axios.get(`/api/refresh/${this.message}`).then(res => {
        console.log(res)
      })
    }
  }
}
</script>
