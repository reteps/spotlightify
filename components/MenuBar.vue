<template>
        <v-app-bar app dark>

          <v-toolbar-title>Vibe Check</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn color="indigo" href='/logout'>
            <v-icon>fa-sign-out-alt</v-icon>
            <span class="ml-2">Sign out</span>
          </v-btn>
        </v-app-bar>
</template>
<script>
export default {
  name: 'MenuBar'
}
</script>
<style scoped lang="sass">
.menu
  display: flex
  justify-content: space-around
  padding-top: 10px
  padding-bottom: 20px
  border-bottom: 1px solid black
a
  text-decoration: none
  color: black
  border: 1px solid black
  padding: 5px
  border-radius: 5px
</style>
