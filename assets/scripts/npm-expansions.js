window.expansions = require("npm-expansions")
var $ = require("jquery")
var clickCount = -1

var updateExpansion = function(event) {

  if (++clickCount > 10) {
    return window.location = "https://github.com/npm/npm-expansions"
  }

  var expansion = expansions[Math.floor(Math.random()*expansions.length)]
  $("#npm-expansions").text(expansion)
  return false
}

$(function(){
  updateExpansion()
  $("#npm-expansions").on('click', updateExpansion)
})
