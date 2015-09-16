var formToRequestObject = require("./form-to-request-object");

module.exports = function() {
  $(function() {
    var eut = $(".org-edit-user-table");

    eut.on("click", "input[type=checkbox].switch", function(e) {
      var checkbox = $(this);
      var checked = checkbox.prop("checked");
      var form = checkbox.closest("form");

      $.ajax(formToRequestObject(form))
        .done(function(data) {})
        .fail(function() {
          if (checked) {
            checkbox.removeAttr("checked");
          } else {
            checkbox.attr("checked", "checked");
          }
        });
    });
  });

};
