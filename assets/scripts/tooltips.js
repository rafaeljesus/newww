module.exports = function() {
  $(function() {
    require("tipsy-browserify")($)
    $('a[rel=tipsy]').tipsy({
      fade: false,
      gravity: 's',
      opacity: 1
    })
  })
}
