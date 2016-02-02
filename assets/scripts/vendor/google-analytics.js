(function(i, s, o, g, r, a, m) {
  i['GoogleAnalyticsObject'] = r;i[r] = i[r] || function() {
      (i[r].q = i[r].q || []).push(arguments)
  }, i[r].l = 1 * new Date();a = s.createElement(o),
  m = s.getElementsByTagName(o)[0];
  a.async = 1;
  a.src = g;m.parentNode.insertBefore(a, m)
})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

ga('create', $('meta[name="x-npm:ga:id"]').attr('content'), 'auto');
ga('require', 'displayfeatures');
ga('send', 'pageview');

$(document).ready(function() {
  $(document).on('click', '.hiring-widget a', function(e) {
    ga('send', 'event', 'Hiring Ads', 'click', $(this).parent().data('id'));
  });

  $(document).on('click', '.ad a', function(e) {
    ga('send', 'event', 'Hiring Ads', 'click', $(this).attr("title"));
  });

  try {
    var promotionDimensionMap = JSON.parse($('meta[name="x-npm:ga:dimensions"]').attr('content'));

    var getAnalyticsDataForElement = function (element) {
      var analyticsData = {};
      var promotionId = $(element).data('promotion-id');
      var promotionSpot = $(element).data('promotion-spot');

      analyticsData[promotionDimensionMap[promotionSpot]] = String(promotionId);

      return analyticsData;
    };

    $('.promotion').each(function (index, element) {
      ga('send', 'event', 'promotion', 'viewed', $(element).data('promotion-id'), getAnalyticsDataForElement(element));
    });

    $(document).on('click', '.promotion a', function (event) {
      ga('send', 'event', 'promotion', 'clicked', $(element).data('promotion-id'), getAnalyticsDataForElement(element));
    });
  } catch (e) {
    console.error(e);
  }

  // how often are people going to the npm Enterprise page?
  $('nav a[href="/enterprise"]').click(function(e) {
    ga('send', 'event', 'npm Enterprise', 'click');
  });

  $(document).on("click", "[data-event-trigger='click']", function(e) {
    ga('send', 'event', $(this).data("eventName"), 'click');
  });

});
