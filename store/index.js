// Store
import Vue from 'vue'

export const state = () => ({
  self: {},
  friend: {},
  musicLoaded: false,
  tokensLoaded: false
})
// Mutations commit()
export const mutations = {
  
  set(state, user, key, val) {
    if (user != 'self' && user != 'friend') {
      console.log(`WARNING: user ${user} not found`)
    }
    console.log(`Setting ${key} on ${user}`)
    Vue.set(state[user], key, val)
  },
  setFriendTokens(state, {access, refresh}) {
    Vue.set(state.friend, 'access', access)
    Vue.set(state.friend, 'refresh', refresh)
  },
  setSongs(state, {user, songs}) {
    Vue.set(state[user], 'songs', songs)
  },
  setArtists(state, {user, artists}) {
    Vue.set(state[user], 'artists', artists)
  },
  musicLoaded(state, status) {
    state.musicLoaded = status
  },
  tokensLoaded(state, status) {
    state.tokensLoaded = status
  }
}
// Getters getters.test
export const getters = {
  entireState(state) {
    return state
  }
}
// Async (dispatch('actionA')
export const actions = {
  entireStateASYNC ({ commit }) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        commit('entireState')
        resolve()
      }, 1000)
    })
  }
}
// computed get/set for direct changes
