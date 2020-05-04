<template>
  <div class="container">
  <a href="/api/auth">Actual login</a>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import axios from "axios"

export default Vue.extend({
  methods: {
    login: function(e) {
      console.log('clicked.')
      axios.get('/api/auth').then(res => {
        console.log(res)
        this.$router.push('/app')
      })
      .catch(err => {
        console.log(`ERR: ${err}`)
      })
    }
  }
})
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
