module.exports = function() {

  $.fn.setupValidation = function() {
    var userName = $("[data-user-name]").data("user-name");
    var $continueBtn = $('.org-create-submit-btn');

    if ($continueBtn.data('inUseError')) {
      $continueBtn.attr('disabled', 'disabled');
    }

    $.each(this, function() {
      var $this = $(this);

      if ($this.data("validate") === "org-scope") {
        $(this).on("keyup", function(e) {
          if ($(this).val() !== userName) {
            $continueBtn.removeAttr('disabled');
          } else {
            $continueBtn.attr('disabled', 'disabled');
          }
        });
      }
    });
  };

  $(function() {
    $("[data-validate]").setupValidation();
  });
};