(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-47041310-1', 'auto');
ga('require', 'displayfeatures');
ga('send', 'pageview');

$(document).ready(function () {
  $('.ad a').click(function (e) {
    ga('send', 'event', 'Hiring Ads', 'click', $(this).attr("title"))
  })

  $('.npme-group a, .npme-details a').click(function (e) {
    ga('send', 'event', 'npm Enterprise', 'click')
  })

})
