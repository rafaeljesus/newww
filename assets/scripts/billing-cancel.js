var $ = require("jquery");

module.exports = function() {
  $(function(){
    $(document).on("click", '#cancel-subscription-toggler', function(){
      $("#cancel-subscription").slideToggle()
      return false;
    })
  })
}
