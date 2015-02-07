window.$ = require("jquery")
window.hiring = require("./hiring")
window.star = require("./star")()
window.npm_expansions = require("./npm-expansions")
window.obfuscate = require("./email-obfuscate")()
window.payments = require("./payments")()
window.github = require("./github")()
window.pretty_numbers = require("./pretty-numbers")()
window.mousetrap = require("mousetrap")
window.private_npm_beta = require("./private-npm-beta")()
require('./user-content')()
require("./tooltips")()
require("./what-npm-is-for")()

$(function () {
  $(".autoselect-wrapper input").on("click", function () {
    $(this).select()
  })

  // Add active class to links that point to the current page
  $("a[href='" + location.pathname + "']").addClass("active")

  // Toggle display of hidden README content
  mousetrap.bind(['command+i', 'ctrl+i'], function() {
    $('.package-name-redundant, .package-description-redundant').toggle()
  })

  // Focus search input when / key is pressed (#513)
  mousetrap.bind('/', function(e){
    $('#site-search').focus();
    // don't add '/' character to input element
    e.preventDefault();
  });
})
