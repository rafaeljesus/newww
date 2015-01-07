(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-47041310-1', 'auto');
ga('require', 'displayfeatures');
ga('send', 'pageview');

$(document).ready(function () {
  $(document).on('click', '.hiring-widget a', function (e) {
    ga('send', 'event', 'Hiring Ads', 'click', $(this).parent().data('id'));
  });

  $(document).on('click', '.ad a', function (e) {
    ga('send', 'event', 'Hiring Ads', 'click', $(this).attr("title"));
  });

  // how often are people going to the npm Enterprise page?
  $('nav a[href="/enterprise"]').click(function (e) {
    ga('send', 'event', 'npm Enterprise', 'click');
  });

});
