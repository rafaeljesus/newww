module.exports = function() {
  $(function(){
    if(localStorage.getItem('disable-banner') === 'true') {
      $('#homepage-banner').hide()
    }

    $('#close-banner').click(function (e) {
      localStorage.setItem('disable-banner', true)
      $('#homepage-banner').slideUp()
    })
  })
}
