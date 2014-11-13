var $ = require("jquery");
window.malarkey = require("malarkey");

module.exports = function(){
  $(function() {
    var elem = document.querySelector('#what-npm-is-for');
    var duration = 1000
    var opts = {
      speed: 30,
      loop: true,
      postfix: ''
    };
    malarkey(elem, opts)
      .pause(duration).delete()
      .type('node').pause(duration).delete()
      .type('browsers').pause(duration).delete()
      .type('angular').pause(duration).delete()
      .type('bower').pause(duration).delete()
      .type('gulp').pause(duration).delete()
      .type('browserify').pause(duration).delete()
      .type('grunt').pause(duration).delete()
      .type('tessel').pause(duration).delete()
      .type('javascript');
  })
}
