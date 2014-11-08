window.$ = require("jquery")
window.highlight = require("./highlight")
window.hiring = require("./hiring")
window.star = require("./star")()
window.npm_expansions = require("./npm-expansions")
window.obfuscate = require("./email-obfuscate")()
window.payments = require("./payments")()
window.github = require("./github")()

$(function () {
  $(".npm-install input").on("click", function () {
    $(this).select()
  })

  // Add active class to links that point to the current page
  $("a[href='" + location.pathname + "']").addClass("active")
})
