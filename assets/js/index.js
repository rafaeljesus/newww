window.domready = require("domready");

var Highlight = require('highlight.js/lib/highlight');
var hl = new Highlight();
hl.registerLanguage('bash', require('highlight.js/lib/languages/bash'));
hl.registerLanguage('css', require('highlight.js/lib/languages/css'));
hl.registerLanguage('coffeescript', require('highlight.js/lib/languages/coffeescript'));
hl.registerLanguage('glsl', require('highlight.js/lib/languages/glsl'));
hl.registerLanguage('xml', require('highlight.js/lib/languages/xml'));
hl.registerLanguage('http', require('highlight.js/lib/languages/http'));
hl.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'));
hl.registerLanguage('json', require('highlight.js/lib/languages/json'));
hl.registerLanguage('typescript', require('highlight.js/lib/languages/typescript'));

domready(function() {
  console.log("DOM is ready");
  hl.initHighlightingOnLoad();
})
