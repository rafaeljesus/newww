window.$ = require("jquery");
window.highlight = require("./highlight");
window.star = require("./star")();
window.npm_expansions = require("./npm-expansions")
window.obfuscate = require("./email-obfuscate")()
window.payments = require("./payments")()

$(function () {
  require("./update-package-issue-count")();

  $(".npm-install input").on("click", function () {
    $(this).select()
  })
})
