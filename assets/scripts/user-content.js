// for security reasons, generated-ids are now prefixed
// with user-content- in READMEs, this snippet
// checks whther someone has clicked on an
// auto-generated id.
var hashchange = require('green-mesa-hashchange')

module.exports = function() {
  $(user_content)
}

var user_content = function() {

  hashchange.update(function(hash) {
    var prefix = 'user-content-'

    if (hash.indexOf(prefix) === 0) {
      hashchange.updateHash(hash.replace(prefix, ''))
    } else {
      var anchor = $('#' + prefix + hash)
      if (anchor.length) $(document).scrollTop( anchor.offset().top )
    }
  })

  $(document).ready(function() {
    hashchange.update()
  })
}
