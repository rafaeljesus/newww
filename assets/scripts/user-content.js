// for security reasons, generated-ids are now prefixed
// with user-content- in READMEs, this snippet
// checks whther someone has clicked on an
// auto-generated id.
var $ = require("jquery")

module.exports = function() {
  $(user_content)
}

var user_content = function() {
  $(".content").on('click', 'a', function() {
    var match = $(this).attr('href').match(/^#(.*)$/)
    var prefix = 'user-content-'

    if (!match) return true // link was not anchor.

    var anchor = $('#' + prefix + match[1] + ' a')

    // we found a corresponding anchor #user-content-foo.
    if (anchor.length) {
      window.location.hash = prefix + match[1]
      return false
    }

    return true
  })
}
