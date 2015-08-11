window.malarkey = require("malarkey");

module.exports = function() {
  $(what_npm_is_for)
}

var what_npm_is_for = function() {
  var el = document.querySelector('#what-npm-is-for');
  if (!el) return;
  var initialText = el.textContent;
  var pause = 800
  var opts = {
    speed: 40,
    loop: false,
    postfix: ''
  };

  var typist = malarkey(el, opts)

  typist
    // .clear()
    // .type(initialText).pause(pause).delete(initialText.length)
    .pause(2400).delete(initialText.length)
    .type('browsers').pause(pause).delete(8)
    .type('io.js').pause(pause).delete(5)
    .type('mobile').pause(pause).delete(6)
    .type('angular').pause(pause).delete(7)
    .type('react').pause(pause).delete(5)
    .type('bower').pause(pause).delete(5)
    .type('jquery').pause(pause).delete(6)
    .type('nodebots').pause(pause).delete(8)
    .type('gulp').pause(pause).delete(4)
    .type('browserify').pause(pause).delete(10)
    .type('grunt').pause(pause).delete(5)
    .type('cordova').pause(pause).delete(7)
    .type('docpad').pause(pause).delete(6)
    .type('tessel').pause(pause).delete(6)
    .type('javascript.').pause(1200)
    .call(function() {
      $(el).addClass("disabled")
    });

}
