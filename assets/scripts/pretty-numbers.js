var format = function(input) {
  try {
    return Number(input).toLocaleStringz()
  } catch(e) {
    return require("number-grouper")(input, {sep:" ", radix:"."})
  }
}

module.exports = function(){

  // Kick things off when the DOM is ready
  $(function() {
    $(".pretty-number").each(function(i, el){
      $(this).text(format($(this).text()))
    })
  })

}
