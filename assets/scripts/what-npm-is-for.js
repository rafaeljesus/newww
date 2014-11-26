var $ = require("jquery");
window.malarkey = require("malarkey");

module.exports = function(){
  $(what_npm_is_for)
}

var what_npm_is_for = function() {
  var el = document.querySelector('#what-npm-is-for');
  if (!el) return;
  var initialText = el.textContent;
  var initialWord = initialText.match(/ (\w+)$/)[1];
  var pause = 800
  var opts = {
    speed: 40,
    loop: false,
    postfix: ''
  };

  malarkey(el, opts)
    .clear()
    .type(initialText).pause(pause).delete(initialWord.length)
    .type('browsers').pause(pause).delete(8)
    .type('mobile').pause(pause).delete(6)
    .type('angular').pause(pause).delete(7)
    .type('bower').pause(pause).delete(5)
    .type('gulp').pause(pause).delete(4)
    .type('browserify').pause(pause).delete(10)
    .type('grunt').pause(pause).delete(5)
    .type('tessel').pause(pause).delete(6)
    .type('JavaScript.');

}
