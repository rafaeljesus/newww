window.$ = require("jquery");
window.highlight = require("./highlight");
window.star = require("./star")();
window.npm_expansions = require("./npm-expansions")

$(function () {
  console.log("DOM is ready");
  require("./update-package-issue-count")();
});
