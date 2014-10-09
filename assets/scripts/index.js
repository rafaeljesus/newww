window.$ = require("jquery");
window.highlight = require("./highlight");
window.star = require("./star")();
window.npm_expansions = require("./npm-expansions")
window.obfuscate = require("./email-obfuscate")()

$(function () {
  require("./update-package-issue-count")();
});
