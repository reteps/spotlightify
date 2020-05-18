<template>
  <div class="app">
    <v-container>
      <FriendLogin v-if='friendRefresh==null' @tokens='onTokens'></FriendLogin>
      <MusicLoader :friendAccess='friendAccess' :friendRefresh='friendRefresh' v-if='friendRefresh!=null && !songsLoaded' @songs='onSongs'></MusicLoader>
      <div v-if="songsLoaded">
        <v-btn-toggle v-model='listType'>

        <!--<v-btn color="primary"> Generate Visual </v-btn>-->
        <v-btn color="primary" value="match">Songs in common</v-btn>
        <v-btn color="primary" value="album">Songs with a common album</v-btn>
        <v-btn color="primary" value="albumNew">New Songs with a common album</v-btn>
        <v-btn color="primary" value="artist">Songs in common artist</v-btn>
        <v-btn color="primary" value="artistNew">New Songs with a common artist</v-btn>
        </v-btn-toggle>
        <v-list>
          <v-list-item v-for="song in sharedSongs" :key="song.track.id">
            <v-list-item-avatar tile><v-img :src="song.track.album.images[2].url"></v-img> </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title v-text="song.track.name"></v-list-item-title>
              <v-list-item-subtitle v-text="`${song.track.artists[0].name} - ${song.track.album.name}`"></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <div id="viz">
        </div>
      </div>
    </v-container>
  </div>
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
    generateNodesAndLinks
  } from '../api/lib.js'
  import * as d3 from 'd3'
  import FriendLogin from '@/components/FriendLogin.vue'
  import MusicLoader from '@/components/MusicLoader.vue'
  export default {
    components: {
      FriendLogin,
      MusicLoader
    },
    name: 'App',
    data() {
      return {

        friendRefresh: null,
        friendAccess: null,

        songsLoaded: false,
        myArtists: [],
        friendArtists: [],
        mySongs: [],
        friendSongs: [],
        listType: '',

        nodes: null,
        links: null
      }
    },
    computed: {
      sharedSongs() {
        console.log('Recomputing with list type', this.listType)
        if (this.listType == 'match') {
          return _.intersectionBy(this.mySongs, this.friendSongs, s => s.track.id)
        } else if (this.listType == 'album') {
          return _.intersectionBy(this.mySongs, this.friendSongs, s => s.track.album.id)
        } else if (this.listType == 'albumNew') {
          return _.differenceBy(_.intersectionBy(this.friendSongs, this.mySongs, s => s.track.album.id), this.mySongs, s=>s.track.id)
        } else if (this.listType == 'artist') {
          return _.intersectionBy(this.mySongs, this.friendSongs, s => s.track.artists[0].id)
        } else if (this.listType == 'artistNew') {
          return _.differenceBy(_.intersectionBy(this.friendSongs, this.mySongs, s => s.track.artists[0].id), s=>s.track.id)
        } else {
          return []
        }
      }
    },
    methods: {
      onTokens: function (refresh, access) {
        console.log('Received tokens.')
        this.friendRefresh = refresh
        this.friendAccess = access

      },
      onSongs: function (myArtists, mySongs, friendArtists, friendSongs) {
        this.songsLoaded = true
        this.myArtists = myArtists
        this.mySongs = mySongs
        this.friendArtists = friendArtists
        this.friendSongs = friendSongs
        console.log('Received songs')

      },

      generateChart() {
        // Mark songs based on owner
        this.mySongs.map(song => {
          song.owner = true
          return song
        })
        this.myArtists.map(artist => {
          artist.owner = true
          return artist
        })
        // Then merge songs
        // unionBy removes duplicates
        let mergedSongs = _.intersectionBy(this.mySongs, this.friendSongs, s => s.track.id)
        let mergedArtists = _.intersectionBy(this.myArtists, this.friendArtists, s => s.id)
        console.log(mergedSongs)
        console.log(mergedArtists)
        const {
          nodes,
          links
        } = generateNodesAndLinks(mergedSongs, mergedArtists)
        //this.nodes = nodes
        //this.links = links
        console.log('Dataset  loaded')
        this.buildGraph(nodes, links)
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
