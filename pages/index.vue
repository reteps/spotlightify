<template>
  <div class="container">
  <div class="login-btn">
    <a href="/api/auth"><span>Login With </span> <img class="spotify-img" src="/spotify_icon.png"></a>
  </div>
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

<style lang="sass">
.container
  margin: 0 auto
  min-height: 100vh
  display: flex
  justify-content: center
  align-items: center
  text-align: center
  .spotify-img
    height: 2em
    width: auto
  a
    text-decoration: none
    font-size: 3em
    span
      padding-right: 10px
    color: black
    display: flex
    align-items: center
    border: 5px solid black
    padding: .25em
    border-radius: 20px
    box-shadow: 5px 10px
    transition: 1s
  a:hover
    box-shadow: 0px 0px
    transform: translate(5px, 10px)
.menu
  a
    pointer-events: none
    cursor: default
    border-color: grey
    color: grey
</style>
