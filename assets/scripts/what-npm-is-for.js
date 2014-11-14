var $ = require("jquery");
window.malarkey = require("malarkey");

module.exports = function(){
  $(function() {

    // Start by retyping the text content present in
    // the element at load time
    var elem = document.querySelector('#what-npm-is-for');
    var initialText = elem.textContent;

    var pause = 1200
    var opts = {
      speed: 50,
      loop: false,
      postfix: ''
    };

    malarkey(elem, opts)
      .clear()
      .type(initialText).pause(pause).delete(10)
      .type('node').pause(pause).delete(4)
      .type('browsers').pause(pause).delete(8)
      .type('angular').pause(pause).delete(7)
      .type('bower').pause(pause).delete(5)
      .type('gulp').pause(pause).delete(4)
      .type('browserify').pause(pause).delete(10)
      .type('grunt').pause(pause).delete(5)
      .type('tessel').pause(pause).delete(6)
      .type('you.').pause(600).delete(1)
      .type(', Buddy.');
  })
}
