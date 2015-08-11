module.exports = function() {
  $(function() {
    $(".autoselect-wrapper input").on("click", function() {
      $(this).select()
    })
  })
}
