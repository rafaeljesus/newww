window.domready = require("domready")

domready(function() {
  console.log("DOM is ready.")
  hljs.initHighlightingOnLoad();
})
