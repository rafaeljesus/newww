// Add active class to links that point to the current page
module.exports = function(){
  $(function () {
    $("a[href='" + location.pathname + "']").addClass("active")
  })  
}
