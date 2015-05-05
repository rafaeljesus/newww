
var template = require("../templates/profile-package.hbs");

module.exports = function() {
  $(function(){
    var container = $(".collaborated-packages > .fetch-more-packages");

    var offset = 1;

    $(".fetch-more-packages").click(function (e) {
      e.preventDefault();
      var text = $(".fetch-more-packages").text();
      $(".fetch-more-packages").text('loading...');

      var name = $("h1").text();

      $.getJSON("/profile/" + name + "/packages?offset=" + offset)
        .done(function (packages) {
          var pkgs = template({packages: packages});
          container.before(pkgs);

          if (packages.hasMore) {
            offset += 1;
            $(".fetch-more-packages").text(text);
          } else {
            $(".fetch-more-packages").remove();
          }
        })
        .fail(function(xhr, status, error) {
          console.error("Could not fetch package data", error);
        });
    });
  });
};