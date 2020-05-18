import Vue from 'vue'
import Vuetify, { VSnackbar, VBtn, VIcon, VTextarea, VProgressCircular, VSelect, VToolbar, VSpacer, VCard } from 'vuetify'
import VuetifyToast from 'vuetify-toast-snackbar'
import '@fortawesome/fontawesome-free/css/all.css' // Ensure you are using css-loader

Vue.use(Vuetify, {
  components: {
    VSnackbar,
    VBtn,
    VIcon,
    VTextarea,
    VProgressCircular,
    VSelect,
    VToolbar,
    VCard,
    VSpacer
  }
})

Vue.use(VuetifyToast)
export default new Vuetify({
      icons: {
        iconfont: 'fa',
      }
})
