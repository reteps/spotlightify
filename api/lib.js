const expressSession = require('express-session')

const checkAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    console.log('Request is authenticated.')
    next();
  } else {
    res.send({message: 'Not authenticated'})
  }
}
const session = expressSession({
  secret: 'cool spotify',
  resave: true,
  saveUninitialized: true,
})
module.exports = { session, checkAuth }
