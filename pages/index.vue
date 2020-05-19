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
    height: 1.5em
    width: auto
  a
    text-decoration: none
    font-size: 1.5em
    span
      padding-right: 10px
    color: black
    display: flex
    align-items: center
    border: 2px solid black
    box-shadow: 2px 5px
    padding: .25em
    border-radius: 25px
    transition: 1s
  @media (min-width: 800px)
    a
      font-size: 3em
      box-shadow: 5px 10px
    a:hover
      box-shadow: 0px 0px
      transform: translate(5px, 10px)
    .spotify-img
      height: 2em
.menu
  a
    pointer-events: none
    cursor: default
    border-color: grey
    color: grey
</style>
