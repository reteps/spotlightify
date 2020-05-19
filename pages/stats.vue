<template>
  <v-container>
      <FriendLogin v-if='!tokensLoaded'></FriendLogin>
      <MusicLoader v-if='tokensLoaded && !musicLoaded'></MusicLoader>
      <div id="viz">
      </div>
  </v-container>
</template>
<script>
import {
  mapState
} from 'vuex';
import {
  addGenre
} from '../api/lib.js'
import FriendLogin from '@/components/FriendLogin.vue'
import MusicLoader from '@/components/MusicLoader.vue'
import InfoButton from '@/components/InfoButton.vue'
import HelpPopup from '@/components/HelpPopup.vue'
import * as d3 from 'd3'
var subgenre = require('subgenre.js')
var _ = require('lodash');
export default {
  components: {
    FriendLogin,
    MusicLoader,
    InfoButton,
    HelpPopup
  },
  name: 'stats',
  computed: {
    ...mapState([
      'musicLoaded',
      'tokensLoaded'
    ]),
    ...mapState({
      mySongs: state => state.self.songs,
      friendSongs: state => state.friend.songs,
      myArtists: state => state.self.artists,
      friendArtists: state => state.friend.artists
    }),
    ready() {
      return this.mySongs != undefined && this.friendSongs != undefined && this.myArtists != undefined && this.friendArtists != undefined
    },
    combo() {
      let myArtistsID = this.mySongs.flatMap(s => s.track.artists).map(a => a.id)
      let friendArtistsID = this.friendSongs.flatMap(s => s.track.artists).map(a => a.id)
      let countOBJ = {}
      let vm = this;
      myArtistsID.forEach(a => {
        if (!(a in countOBJ)) {
          if (vm.friendArtists[a] == undefined) {
            return
          }
          countOBJ[a] = {friend:0,self:0,data: vm.myArtists[a]}
          countOBJ[a].data.genre = countOBJ[a].data.genres.length > 0 ? subgenre.mostPopularGenre(countOBJ[a].data.genres) : 'other'
        } else {
          countOBJ[a].self += 1
        }
      })
      friendArtistsID.forEach(a => {
        if (!(a in countOBJ)) {
          if (vm.friendArtists[a] == undefined) {
            return
          }
          countOBJ[a] = {friend:0,self:0,data: vm.friendArtists[a]}
          countOBJ[a].data.genre = countOBJ[a].data.genres.length > 0 ? subgenre.mostPopularGenre(countOBJ[a].data.genres) : 'other'
        } else {
          countOBJ[a].friend += 1
        }
      })

      return Object.values(countOBJ).filter(v => v.friend > 0 && v.self > 0)
    }
  },
  data() {
    return {

    width: 500,
    height: 500,
    margin: {
      top: 25,
      right: 20,
      bottom: 35,
      left: 40
    }
    }
  },
  watch: {
    ready(val) {
      console.log('Ready state updated to',val)
      if (!val) {
        console.log('Not ready yet.')
        return
      }
      console.log('Ready.')
      console.log(this.combo)
      console.log('Generating chart')
      this.generateChart(this.combo)
    }
  },
  mounted() {
    console.log('Mounted')
    if (this.ready) {
      this.generateChart(this.combo)
    }
  },
  methods: {
    generateChart(data) {
      console.log(data)
      let x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.friend)).nice()
        .range([this.margin.left, this.width - this.margin.right])
      let y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.self)).nice()
        .range([this.height - this.margin.bottom, this.margin.top])
      let color = d3.scaleOrdinal(data.map(d => d.data.genre), d3.schemeCategory10)
      let tooltip = d3.select("#viz").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
      const svg = d3.select('#viz').append("svg")

      svg.attr("viewBox", [0, 0, this.width, this.height]);
      // Generate gridlines
      svg.append('g')
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1)
        .call(g => g.append("g") // Vertical gridlines
          .selectAll("line")
          .data(x.ticks())

          .join("line")
          .attr("x1", d => 0.5 + x(d))
          .attr("x2", d => 0.5 + x(d))
          .attr("y1", this.margin.top)
          .attr("y2", this.height - this.margin.bottom))
        .call(g => g.append("g") // Horizontal gridlines
          .selectAll("line")
          .data(y.ticks())
          .join("line")
          .attr("y1", d => 0.5 + y(d))
          .attr("y2", d => 0.5 + y(d))
          .attr("x1", this.margin.left)
          .attr("x2", this.width - this.margin.right))
      // x-axis
      svg.append("g")
        .attr("transform", `translate(0,${this.height - this.margin.bottom})`)
        .call(d3.axisBottom(x).ticks(this.width / 80))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
          .attr("x", this.width)
          .attr("y", this.margin.bottom - 4)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
          .text(data.x))
      // y axis
      svg.append("g")
        .attr("transform", `translate(${this.margin.left},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
          .attr("x", -this.margin.left)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(data.y))

      // data points
      svg.append("g")
        .attr("stroke-width", 1.5)
        //.attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.friend))
        .attr('cy', d=> y(d.self))
        .attr("fill", d => color(d.data.genre))
        .attr("r", 5)
              .on("mouseover", function(d) {
          tooltip.transition()
               .duration(200)
               .style("opacity", .9);
          tooltip.html(`${d.data.name} - ${d.data.genre}`)
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
          tooltip.transition()
               .duration(500)
               .style("opacity", 0);
      });

    }
  }
} </script>
<style lang='sass'>
.tooltip
  position: absolute
  pointer-events: none
  width: 200px
  height: 30px
</style>
