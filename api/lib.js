const checkAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    console.log('Request is authenticated.')
    next();
  } else {
    res.redirect('/')
  }
}
module.exports = { checkAuth}
