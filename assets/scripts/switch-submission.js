var formToRequestObject = require("./form-to-request-object");

var Switch = function(el) {
  this.el = el;
  this.$el = $(el);
  this.form = this.$el.closest(".edit-pay-status");
};

Switch.prototype.bindEvents = function() {
  this.$el.on("click", function(e) {
    $.ajax(formToRequestObject(this.form))
      .done(function(data) {
        console.log(data);
      })
      .fail(function() {})
  }.bind(this));
};

module.exports = function() {
  $(function() {
    var checkboxes = $(".switch");

    $.each(checkboxes, function(idx, checkbox) {
      var input = new Switch(checkbox);
      input.bindEvents();
    });
  });

};
