import Vue from 'vue'
import Vuetify, { VSnackbar, VBtn, VIcon, VTextarea, VProgressCircular, VSelect } from 'vuetify'
import VuetifyToast from 'vuetify-toast-snackbar'

Vue.use(Vuetify, {
  components: {
    VSnackbar,
    VBtn,
    VIcon,
    VTextarea,
    VProgressCircular,
    VSelect
  }
})

Vue.use(VuetifyToast)
export default new Vuetify
