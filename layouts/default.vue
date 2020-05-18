<template>

  <div>
  <v-app>
    <MenuBar/>
    <v-content>
      <nuxt />
    </v-content>
    </v-app>
  </div>
</template>
<script>
import MenuBar from '@/components/MenuBar.vue'
export default {
  components: {MenuBar},
  errorCaptured (err, vm, info) {
    console.log(`err:${err}`)
    vm.$toast.info('ERR' + err.message)
    return false
  },
  name: 'default'
}
</script>
<style>
html {
  font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

*,
*:before,
*:after {
  box-sizing: border-box;
  margin: 0;
}
</style>
