var $ = require("jquery");
var strftime = require("prettydate").strftime;

module.exports = function() {
  $(function(){
    $("[data-date]").each(function(i, el){
      var date = new Date($(this).data().date)

      if (!date.getYear()) {
        return console.error("Invalid date", date)
      }

      var fmt = $(this).data().dateFormat || "%Y-%m-%d"
      $(this).text(strftime(date, fmt))
    })
  })
}
