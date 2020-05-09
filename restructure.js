var json = require('./testing.json')
var api = require('./api/lib')
const subgenre = require('subgenre.js')
let a = api.getAllArtists(json)



console.log(`Now ${a.length}`)
