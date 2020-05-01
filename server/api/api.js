const express = require('express')

let backend = express.Router()

backend.get('/', (req, res) => {
  res.send('<h1>Api working!</h1>')
})
module.exports = backend
