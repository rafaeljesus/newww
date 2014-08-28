window.$ = require("jquery");
window.highlight = require("./highlight")

$(function () {
  console.log("DOM is ready");
  require("./update-package-issue-count")()
})
