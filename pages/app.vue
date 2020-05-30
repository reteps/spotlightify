<template>
    <v-container>
      <FriendLogin v-if='!tokensLoaded'></FriendLogin>
      <MusicLoader v-if='tokensLoaded && !musicLoaded'></MusicLoader>
      <div v-if="musicLoaded">
        <v-row>
        <v-col>
        <!-- sus stuff https://stackoverflow.com/questions/55188478/meaning-of-v-slotactivator-on/55194478 -->
        <div> I want music for ... </div>
        <v-btn-toggle v-model='who'>
          <InfoButton color='#79a3f7' text='Myself' help='New songs that are not in my playlist' ></InfoButton>
          <InfoButton color='#79a3f7' text='My Friend' help='Songs that are not in my friends playlist' ></InfoButton>
          <InfoButton color='#79a3f7' text='Both' help='Songs from both playlists that meet criteria' ></InfoButton>
        </v-btn-toggle>
        </v-col>
        <v-col>
        <div> I want songs with the same ... </div>
        <v-btn-toggle v-model='kind'>
          <InfoButton color='#cc74f2' text='Name' help='The exact same song (the target does not matter)' ></InfoButton>
          <InfoButton color='#cc74f2' text='Album' help='The same album (Recommended)'></InfoButton>
          <InfoButton color='#cc74f2' text='Artist' help='The same artist'></InfoButton>
        </v-btn-toggle>
          <HelpPopup></HelpPopup>
        </v-col>
        </v-row>
        <v-row>
        <v-col cols='12' md='6'>
          <v-select disable-lookup v-model="sortType" label="Sort By" :items="Object.keys(sortTypes)"></v-select>
        </v-col>
        <v-col cols='12' md='6'>
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
</template>

<style lang="sass">
  @media (max-width: 800px)
    .v-btn-toggle
      flex-direction: row
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
        who: '',
        kind: '',
        sortType: 'original',
        nodes: null,
        links: null,
        audioPlayer: null,
        currentPlayback: null,
        ended: false,
        exportName: '',
        filterTypes: {
          'myself-name': () => _.intersectionBy(this.mySongs, this.friendSongs, s => s.track.id),
          'myself-album': () => _.uniqBy(this.friendSongs, s => s.track.id).filter(s => this.mySongs.map(s => s.track.album.id).indexOf(s.track.album.id) > -1),
          'myself-artist': () => _.differenceBy(this.friendSongs, this.mySongs, s => s.track.id).filter(s => this.partialCommon(s, this.sharedArtists, 'artists')),
          'my-friend-name': () => _.intersectionBy(this.mySongs, this.friendSongs, s => s.track.id),
          'my-friend-album': () => _.uniqBy(this.mySongs, s => s.track.id).filter(s => this.friendSongs.map(s => s.track.album.id).indexOf(s.track.album.id) > -1),
          'my-friend-artist': () => _.differenceBy(this.mySongs, this.friendSongs, s => s.track.id).filter(s => this.partialCommon(s, this.sharedArtists, 'artists')),
          'both-name': () => _.intersectionBy(this.mySongs, this.friendSongs, s => s.track.id),
          'both-album': () => _.uniqBy(this.friendSongs.concat(this.mySongs), s => s.track.id).filter(s => this.sharedAlbums.indexOf(s.track.album.id) > -1),
          'both-artist': () => _.uniqBy(this.friendSongs.concat(this.mySongs), s => s.track.id).filter(s => this.partialCommon(s, this.sharedArtists, 'artists'))
        },
        sortTypes: {
          'original': s => s,
          'most popular': s => s.sort((a, b) => a.track.popularity >= b.track.popularity ? -1 : 1),
          'least popular': s => s.sort((a, b) => a.track.popularity >= b.track.popularity ? 1 : -1)
        }
      }
    },
    computed: {
      listType() {
        return [this.who,this.kind].join('-')
      },
      sharedSongs() {
        console.log('Recomputing with list type', this.listType)
        let filterFunc = this.filterTypes[this.listType] || (() => [])
        let currentSongs = filterFunc().filter(s => s.track.album.images[2] != undefined)
        return this.sortTypes[this.sortType](currentSongs)
      },
      sharedArtists() {
        console.log(_.intersectionBy([...Object.keys(this.friendArtists)], [...Object.keys(this.myArtists)]))
        return _.intersectionBy(Object.keys(this.friendArtists), Object.keys(this.myArtists))
      },
      sharedAlbums() {
        let mappedFriend = this.friendSongs.map(s => s.track.album.id)
        return this.mySongs.map(s => s.track.album.id).filter(value => -1 !== mappedFriend.indexOf(value))
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
      partialCommon(song, ids, property=null) {
        if (property == null) {
          return song.track.map(a => a.id).some(id => ids.indexOf(id) > -1)
        } else if (property == 'artists') {
          return song.track[property].map(a => a.id).some(id => ids.indexOf(id) > -1)
        }
      },
      async artistMatch() {
        let myIDs = Object.keys(this.myArtists)
        console.log(myIDs)
        let vm = this;
        return matches = await axios.post(`/api/related`, myIDs).then(info => {
          console.log('Success')
          let flattenedArtists = info.data.filter(val => val !== null).filter(val => val.artists.length > 0).flatMap(val => val.artists).map(artist => artist.id)
          let withAdditions = [...new Set(myIDs.concat(flattenedArtists))]
          return withAdditions
        }).then(ids => {
          let possibleMatchingIDs = _.intersectionBy(ids, Object.keys(vm.friendArtists))
          console.log(possibleMatchingIDs)
          console.log(vm.friendSongs.map(s => s.track.artists.map(a => a.id).map(id => possibleMatchingIDs.indexOf(id))))
          return vm.friendSongs.filter(s => vm.partialCommon(song, possibleMatchingIDs, 'artists'))
        }).then(matches => {
          console.log(matches)
        })
        return []
      },
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
