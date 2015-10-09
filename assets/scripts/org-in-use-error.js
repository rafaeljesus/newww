module.exports = function() {
  $(function() {
    var $continueBtn = $('input[value="continue"]');

    if ($continueBtn.data('inUseError')) {
      $continueBtn.attr('disabled', 'disabled');

      $('#orgScope').focus(function() {
        $continueBtn.removeAttr('disabled');
      });
    }
  });
};