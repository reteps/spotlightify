<template>
<div>

Welcome to my super cool app guys!
<button v-on:click="getToken">Test some stuff</button>
<a href="/logout">Logout</a>
<div> {{response}}</div>
</div>
</template>
<script>
const axios = require('axios')
export default {
  data() {
    return {
      response: ''
    }
  },
  methods: {
    getToken: function(e) {
      console.log('Running')
      axios.get('/api/test').then(res => {
        console.log(res)
        //this.response = res.body
      }).catch(err => {
        console.log(err)
      })
    }
  }
}
</script>
