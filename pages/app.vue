<template>
  <div class="app">
    <FriendLogin v-if='friendRefresh==null' @tokens='onTokens'></FriendLogin>
    <div v-else class="container">
      <div> Now select which playlists you would like to compare</div>
      <div>
        <v-select v-model="selectedFriendPlaylist" :items="friendPlaylistNames" label="Friend Playlist"></v-select>
        <v-select v-model="selectedMyPlaylist" :items="myPlaylistNames" label="My Playlist"></v-select>
        <v-btn :disabled="selectedFriendPlaylist == null || selectedMyPlaylist == null" color="primary" @click="retrievePlaylistsAndArtists">Lets go!</v-btn>
        <v-progress-circular :value="songLoadProgress * 25" v-if="!songsLoaded && startedLoad"></v-progress-circular>
      </div>
      <div v-if="songsLoaded">
        <div> The final step! Generate the chart </div>
        <v-btn color="primary" @click="generateChart">Lets go!</v-btn>
        <div id="viz">
        </div>
      </div>
    </div>
  </div>
  <!--
Welcome to my super cool app guys!
<button v-on:click="testSongs">Test some stuff</button>
<a href="/logout">Logout</a>
<button v-on:click="getToken">Get your token</button>
<div> {{ response }} </div>
<input v-model="message">
<button v-on:click="testRefresh">Build the ultra cool visual</button>
<button v-on:click="loadTestingDataset"> Load  Testing  Dataset </button>
<button v-on:click="sendArtists">Load Artists</button>

<button v-on:click="buildGraph">Build the graph</button>
<div id="viz"></div>
-->
</template>

<style lang="sass">
  .container
    margin: 0 auto
    min-height: 80vh
    display: flex
    flex-direction: column

</style>
<script>
  const axios = require('axios')
  const subgenre = require('subgenre.js')
  var _ = require('lodash');
  import {
    generateNodesAndLinks,
    flattenSongArtists
  } from '../api/lib.js'
  import * as d3 from 'd3'
  import FriendLogin from '@/components/FriendLogin.vue'
  export default {
    components: {
      FriendLogin
    },
    name: 'App',
    data() {
      return {
        loadingSongs: false,
        friendSongs: [],
        mySongs: [],
        friendRefresh: null,
        friendAccess: null,
        friendPlaylists: null,
        myPlaylists: null,
        selectedFriendPlaylist: null,
        selectedMyPlaylist: null,
        songLoadProgress: 0,
        startedLoad: false,
        myArtists: [],
        friendArtists: [],
        nodes: null,
        links: null
      }
    },

    computed: {
      friendPlaylistNames() {
        if (!this.friendPlaylists) {
          return []
        }
        return ['Liked Songs'].concat(this.friendPlaylists.map(item => item.name))
      },
      myPlaylistNames() {
        if (!this.myPlaylists) {
          return []
        }
        return ['Liked Songs'].concat(this.myPlaylists.map(item => item.name))
      },
      songsLoaded() {
        return this.songLoadProgress == 4
      }
    },
    methods: {
      retrievePlaylistsAndArtists() {
        let vm = this
        this.startedLoad = true
        this.retrievePlaylist((this.friendPlaylists.find(o => o.name == vm.selectedFriendPlaylist) || {id:'Liked Songs'}).id, this.friendAccess).then(songs => {
          vm.friendSongs = songs
          vm.songLoadProgress += 1
          return songs
        }).then(songs => {
          return vm.loadArtists(songs)
        }).then(artists => {
          vm.friendArtists = artists
          vm.songLoadProgress += 1
        })

        this.retrievePlaylist((this.myPlaylists.find(o => o.name == vm.selectedMyPlaylist) || {id:'Liked Songs'}).id).then(songs => {
          vm.mySongs = songs
          vm.songLoadProgress += 1
          return songs
        }).then(songs => {
          return vm.loadArtists(songs)
        }).then(artists => {
          vm.myArtists = artists
          vm.songLoadProgress += 1
        })
      },
      retrievePlaylist(id, token='') {
        let func = (id == 'Liked Songs') ? this.loadSongs : this.loadPlaylist
        return func(id, token)
      },
      loadSongs: function(_, token) {
        return axios.get(`/api/songs/${token}`).then(res => {
          return res.data
        })
      },
      loadPlaylist: function(id, token) {
        return axios.get(`/api/playlist/${id}/${token}`).then(res => {
          return res.data
        })
      },
      loadPlaylists() {
        let vm = this;
        axios.get(`/api/playlists/${this.friendAccess}`).then(res => {
          vm.friendPlaylists = res.data.items
          return axios.get('/api/playlists')
        }).then(res => {
          console.log(res.data)
          vm.myPlaylists = res.data.items
        })
      },
      onTokens: function (refresh, access) {
        console.log('Received tokens.')
        this.friendRefresh = refresh
        this.friendAccess = access
        this.loadPlaylists()

      },
      loadArtists(dataset) {

        return axios.post('/api/artists', flattenSongArtists(dataset))
          .then(res => {
            console.log('Received reply')
            return res.data
          }).catch(err => {
            console.log(`ERR: ${err}`)
          })
      },
      generateChart() {
        // Mark songs based on owner

      },
      buildGraph(nodes, links) {
        const drag = (simulation) => {
          function dragstarted(d) {
            //if (!d3.event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          }

          function dragged(d) {
            d.fx = d3.event.x
            d.fy = d3.event.y
          }

          function dragended(d) {
            //if (!d3.event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }

          const dragHandler = d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)

          return dragHandler
        }
        console.log('Building graph')
        // Build graph
        const h = 3000
        const w = 3000
        let svg = d3.select('#viz')
          .append('svg')
          .attr('width', w)
          .attr('height', h)
        // Force simulation
        var linkNodes = [];

        let sim = d3.forceSimulation(nodes)
          .force("charge", d3.forceManyBody())
          .force("center", d3.forceCenter(w / 2, h / 2)) // Center  around  middle of graph
          .force("link", d3.forceLink(links).id(d => d.id).distance(d => d.type).iterations(5))
          .force("x", d3.forceX())
          .force("y", d3.forceY())

        // Add tick for simulation
        // Add links
        let link = svg.append("g") //  Groups
          .attr('stroke', '#ccc') // Everything in the group is lightgrey
          .attr('stroke-width', '3px')
          .selectAll('line')
          .data(links) // Alternative  to enter,append, is now dynamic
          .join('line')
        // Now for some cool colors
        const colorScale = d3.scaleOrdinal(d3.schemeSet1.slice(0, 5))
        //const color = (d) => { return d => colorScale(d.type) }

        // Add nodes
        let node = svg.append('g')
          .attr('stroke', '#fff')
          .attr('stroke-width', '1.5px')
          .selectAll('circle')
          .data(nodes)
          .join('circle') // enter/append
          .attr("r", 5)
          .attr("fill", d => colorScale(d.type))
          .call(drag(sim)) // the  guy did  this

        sim.on("tick", () => {
          link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y)

          node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
        })

      }


    }
  }

</script>
