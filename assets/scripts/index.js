window.$ = require("jquery");

// Syntax highlighting for package READMEs
var Highlight = require("highlight.js/lib/highlight");
var hl = new Highlight();
hl.registerLanguage("bash", require('highlight.js/lib/languages/bash'));
hl.registerLanguage("css", require('highlight.js/lib/languages/css'));
hl.registerLanguage("coffeescript", require('highlight.js/lib/languages/coffeescript'));
hl.registerLanguage("glsl", require('highlight.js/lib/languages/glsl'));
hl.registerLanguage("http", require('highlight.js/lib/languages/http'));
hl.registerLanguage("javascript", require('highlight.js/lib/languages/javascript'));
hl.registerLanguage("json", require('highlight.js/lib/languages/json'));
hl.registerLanguage("typescript", require('highlight.js/lib/languages/typescript'));
hl.registerLanguage("xml", require('highlight.js/lib/languages/xml'));
hl.initHighlightingOnLoad();

// require('npm-typeahead')({
//   npmUrl: '',// URL to re-direct the user to.
//   searchUrl: 'https://typeahead.npmjs.com', // URL for search npm-typeahead REST server.
//   $: $ // jQuery dependency.
// });

$(function () {
  console.log("DOM is ready");
})
