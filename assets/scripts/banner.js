module.exports = function() {
  $(function(){
    var ready = new Date() > new Date("2015-04-14T03:30:00-07:00")
    var disabled = localStorage.getItem('disable-private-modules-banner') || $('#user-info a').data('is-paid')

    if (
      !ready
      || disabled
      || location.pathname === "/private-modules"
      || location.pathname === "/settings/billing"
    ) {
      return
    }

    $('#notification-banner').removeClass("hidden")

    $('#notification-banner a').click(function (e) {
      localStorage.setItem('disable-private-modules-banner', true)

      if ($(this).hasClass("banner-close")) {
        $('#notification-banner').slideUp()
        e.preventDefault()
      }
    })

  })
}
