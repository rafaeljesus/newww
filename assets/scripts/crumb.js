module.exports = function() {
  $(function() {
    try {
      window.crumb = $("[data-crumb]").data().crumb
    } catch (e) {
      return console.error("unable to find a CSRF token in the DOM")
    }
  })
}
