const checkAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    console.log('Request is authenticated.')
    next();
  } else {
    res.send({message: 'Not authenticated'})
  }
}
module.exports = { checkAuth}
