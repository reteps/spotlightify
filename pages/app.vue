<template>
<div>

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
</div>
</template>
<script>
const axios = require('axios')
const subgenre = require('subgenre.js')
import { generateNodesAndLinks, getAllArtists } from '../api/lib.js'
import * as d3 from  'd3'
export default {
  data() {
    return {
      response: '',
      message: '',
      nodes: {},
      links: {},
      artistIDs: [],
      artists: []

    }
  },
  methods: {
    testSongs: function(e) {
      console.log('Running')
      var vm = this
      axios.get('/api/songs').then(res => {
        console.log(res.data.length)
        return generateNodesAndLinks(res.data)
      }).then(dataset => {
        vm.nodes = dataset.nodes
        vm.links = dataset.links
      }).catch(err => {
        console.log(err)
      })
    },
    sendArtists: function(e) {
      const dataset = require('../testing.json')

      return axios.post('/api/artists', getAllArtists(dataset))
      .then(res => {
        console.log('Received reply')
        console.log(res.data)
        this.artists = res.data

        // Now we have an appropriate list of genres, recategorize artist
        //console.log(subgenre.mostPopularGenre(genres))
        //console.log(subgenre.leastPopularGenre(genres))
      }).catch(err => {
        console.log(`ERR: ${err}`)
      })
    },
    loadTestingDataset: function(e) {
      if (this.artists.length == 0) {
        console.log('loadartisstsfirst')
        return
      }
      const dataset = require('../testing.json')
      const {nodes, links } = generateNodesAndLinks(dataset, this.artists)
      this.nodes = nodes
      this.links = links
      console.log('Dataset  loaded')
    },
    buildGraph: function(e)  {
      if (this.nodes.length === 0  || this.links.length === 0) {
        console.log('Cannot  build  graph, not filled in yet')
        return
      }
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
        let vm = this;
        console.log(vm.links)
        // let flatNodes = vm.nodes.reduce((a,node) => {
        //   a[node.id] = node
        //   return a
        // },{})
        // console.log(flatNodes)

      let sim = d3.forceSimulation(this.nodes)
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(w/2,h/2)) // Center  around  middle of graph
      .force("link",  d3.forceLink(this.links).id(d => d.id).distance(d => d.type).iterations(5))
      .force("x", d3.forceX())
      .force("y", d3.forceY())

      // Add tick for simulation
      // Add links
      let link = svg.append("g") //  Groups
      .attr('stroke', '#ccc') // Everything in the group is lightgrey
      .attr('stroke-width', '3px')
      .selectAll('line')
      .data(this.links) // Alternative  to enter,append, is now dynamic
      .join('line')
      // Now for some cool colors
      const colorScale =  d3.scaleOrdinal(d3.schemeSet1.slice(0,5))
      //const color = (d) => { return d => colorScale(d.type) }

      // Add nodes
      let node = svg.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', '1.5px')
      .selectAll('circle')
      .data(this.nodes)
      .join('circle') // enter/append
      .attr("r", 5)
      .attr("fill", d => colorScale(d.type))
      .call(drag(sim))// the  guy did  this

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

    },
    getToken: function(e) {
      axios.get('/api/me').then(res => {
        console.log(res)
        this.response = res.data.message
      }).catch(err => {
        console.log(err)
      })
    },
    testRefresh: function(e) {
      axios.get(`/api/refresh/${this.message}`).then(res => {
        return axios.get(`/api/songs/${res.data.access_token}`)



      }).then(res => {
        console.log(res.data.length)
        return generateNodesAndLinks(res.data)
      })
    }
  }
}
</script>
