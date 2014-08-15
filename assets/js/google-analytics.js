(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-53856291-1', 'auto');
ga('send', 'pageview');

$(document).ready(function () {
  $('.hiring a').click(function (e) {
    var id = $(this).parent().data('id')
    ga('send', 'event', 'Hiring Ads', 'click', id)
  })

  $('.npme-group a, .npme-details a').click(function (e) {
    ga('send', 'event', 'npm Enterprise', 'click')
  })

})