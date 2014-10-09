var $ = require("jquery")
var fmt = require("util").format

module.exports = function() {

  $(function() {
    var el = $("#email")

    if (!el.length) return

    var email = el.data("email")
      .split("%")
      .slice(1)
      .map(function(x) {
        return String.fromCharCode(parseInt(x, 16))
      })
      .join("")

    el.html(fmt("<a href=\"mailto:%s\">%s</a>", email, email))
  })

}
