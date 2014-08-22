window.domready = require("domready");

var Highlight = require("highlight.js/lib/highlight");
var hl = new Highlight();
"bash css coffeescript glsl http javascript json typescript xml"
  .split(' ')
  .forEach(function(lang){
    hl.registerLanguage(lang, require('highlight.js/lib/languages/'+lang));
  })

domready(function() {
  console.log("DOM is ready");
  hl.initHighlightingOnLoad();
})
