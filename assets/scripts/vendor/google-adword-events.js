var goog_snippet_vars;

/* <![CDATA[ */
// DO NOT CHANGE THE CODE BELOW.
var goog_report_conversion = function(url) {
  goog_snippet_vars();
  window.google_conversion_format = "3";
  window.google_is_call = true;
  var opt = new Object();
  opt.onload_callback = function() {
    if (typeof(url) != 'undefined') {
      window.location = url;
    }
  };
  var conv_handler = window['google_trackConversion'];
  if (typeof(conv_handler) == 'function') {
    conv_handler(opt);
  }
};
/* ]]> */

$(document).ready(function () {
  $('input[value="Agree to License"]').click(function (e) {
    goog_snippet_vars = function () {
      var w = window;
      w.google_conversion_id = 965451981;
      w.google_conversion_label = "z8e7CMaL92AQzcGuzAM";
      w.google_remarketing_only = false;
    };

    goog_report_conversion();
  });

  $('input[value="Contact me"').click(function (e) {
    goog_snippet_vars = function() {
      var w = window;
      w.google_conversion_id = 965451981;
      w.google_conversion_label = "RcIICJP0-2AQzcGuzAM";
      w.google_remarketing_only = false;
    };
  });
});

