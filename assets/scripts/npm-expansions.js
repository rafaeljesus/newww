window.expansions = require("npm-expansions")
var $ = require("jquery")
var fadeDuration = 200
var clickCount = -1

var updateExpansion = function(event) {

  if (++clickCount > 10) {
    return window.location = "https://github.com/npm/npm-expansions"
  }

  var expansion = expansions[Math.floor(Math.random()*expansions.length)]
  $("#npm-expansions").fadeOut(fadeDuration, function() {
    $(this).text(expansion).fadeIn(fadeDuration)
  })
  return false
}

$(function(){
  updateExpansion()
  $("#npm-expansions").on('click', updateExpansion)
})
