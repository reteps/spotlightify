<template>
  <div class="app">
    <v-container>
      <FriendLogin v-if='!tokensLoaded'></FriendLogin>
      <MusicLoader v-if='tokensLoaded && !musicLoaded'></MusicLoader>
      <div v-if="musicLoaded">
        <v-row>
        <v-col>
        <!-- sus stuff https://stackoverflow.com/questions/55188478/meaning-of-v-slotactivator-on/55194478 -->
        <v-btn-toggle v-model='listType'>
          <InfoButton v-for="sort in sortTypes" :key='sort.text' :color="sort.color" :text='sort.text' :help='sort.help'></InfoButton>
        </v-btn-toggle>
          <HelpPopup></HelpPopup>
        </v-col>
        <v-col>
          <v-form ref="form" @submit.prevent="submit">
            <v-text-field label="Playlist Name" type='text' v-model="exportName"></v-text-field>
            <v-btn :disabled='exportName==""' @click='exportCurrentPlaylist()'>Export</v-btn>
          </v-form>
        </v-col>
        </v-row>
        <v-list>
          <v-list-item v-for="song in sharedSongs" :key="song.track.id">
            <v-list-item-avatar tile><v-img :src="song.track.album.images[2].url"></v-img> </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title v-text="song.track.name"></v-list-item-title>
              <v-list-item-subtitle v-text="`${song.track.artists[0].name} - ${song.track.album.name}`"></v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-btn target="_blank" icon :href="song.track.external_urls.spotify">
                <v-icon color="green">fab fa-spotify</v-icon>
              </v-btn>
            </v-list-item-action>
            <v-list-item-action>
              <v-btn icon :disabled="song.track.preview_url == null" @click="play(song.track.preview_url)">
                <v-icon>{{ !ended && song.track.preview_url == currentPlayback && song.track.preview_url != null ? 'fa-pause' : 'fa-play'}}</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
        <div id="viz">
        </div>
      </div>
    </v-container>
  </div>
</template>

<style lang="sass">
  @media (max-width: 800px)
    .v-btn-toggle
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
  import {mapState} from 'vuex';
  import FriendLogin from '@/components/FriendLogin.vue'
  import MusicLoader from '@/components/MusicLoader.vue'
  import InfoButton from '@/components/InfoButton.vue'
  import HelpPopup from '@/components/HelpPopup.vue'
  export default {
    components: {
      FriendLogin,
      MusicLoader,
      InfoButton,
      HelpPopup
    },
    name: 'App',
    data() {
      return {
        listType: '',
        nodes: null,
        links: null,
        audioPlayer: null,
        currentPlayback: null,
        ended: false,
        exportName: '',
        sortTypes: [
          {
            text: 'Match',
            help: 'Songs that are in both playlists',
            sort: () => _.intersectionBy(this.mySongs, this.friendSongs, s => s.track.id),
            color: '#5db0f2'
          },
          {
            text: 'Album Match',
            help: 'Songs of albums that are in both playlists',
            sort: () => _.intersectionBy(this.mySongs, this.friendSongs, s => s.track.album.id),
            color: '#8cc6f6'
          },
          {
            text: 'Your Album Match',
            help: 'Songs of albums that are in both playlists but not in your playlist',
            sort: () => _.differenceBy(_.intersectionBy(this.friendSongs, this.mySongs, s => s.track.album.id), this.mySongs, s=>s.track.id),
            color: '#b9dcf9'
          },
          {
            text: 'Friend Album Match',
            help: 'Songs of albums that are in both playlists but not in their playlist',
            sort: () => _.differenceBy(_.intersectionBy(this.mySongs, this.friendSongs, s => s.track.album.id), this.friendSongs, s=>s.track.id),
            color: '#e2f1fc'
          },
          {
            text: 'Artist Match',
            help: 'Songs of artists that are in both playlists',
            sort: () => _.intersectionBy(this.mySongs, this.friendSongs, s => s.track.artists[0].id),
            color: '#7e3ff2'
          },
          {
            text: 'Your Artist Match',
            help: 'Songs of artists that are in both playlists but not in your playlist',
            sort: () => _.differenceBy(_.intersectionBy(this.friendSongs, this.mySongs, s => s.track.artists[0].id), this.mySongs, s=>s.track.id),
            color: '#9965f4'
          },
          {
            text: 'Friend Artist Match',
            help: 'Songs of artists that are in both playlists but not in their playlist',
            sort: () => _.differenceBy(_.intersectionBy(this.mySongs, this.friendSongs, s => s.track.artists[0].id), this.friendSongs, s=>s.track.id),
            color: '#b794f6'
          }
        ]
      }
    },
    computed: {
      sharedSongs() {
        console.log('Recomputing with list type', this.listType)
        let currentSort = _.find(this.sortTypes, s => s.text == this.listType)
        if (currentSort === undefined) {
          return []
        }
        return currentSort.sort()
      },
      ...mapState([
        'musicLoaded',
        'tokensLoaded'
      ]),
      ...mapState({
        mySongs: state => state.self.songs,
        friendSongs: state => state.friend.songs,
        myArtists: state => state.self.artists,
        friendArtists: state => state.friend.artists,
      })
    },
    mounted() {
      this.audioPlayer = new Audio();
      this.audioPlayer.onended = this.handleEnded
    },
    methods: {
      exportCurrentPlaylist() {
        let uris = this.sharedSongs.map(song => song.track.uri)
        axios.post(`/api/export/${this.exportName}`, uris).then(() => {
          this.$toast.info('Playlist successfully created!')
          this.exportName = ''
        })
        //axios.get(`/api/create/${this.exportName}`)
      },
      handleEnded() {
        console.log('Song has now ended.')
        this.ended = true
        this.currentPlayback = null
      },
      play(url) {
        if (this.currentPlayback == url) {
          this.audioPlayer.pause()
          this.currentPlayback = null
          return
        }
        this.ended = false
        this.currentPlayback = url
        this.audioPlayer.src = url
        this.audioPlayer.load()
        this.audioPlayer.play()
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
