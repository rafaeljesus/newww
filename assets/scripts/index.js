window.$ = require("jquery");
window.highlight = require("./highlight");
window.star = require("./star")();

$(function () {
  console.log("DOM is ready");
  require("./update-package-issue-count")();
});
