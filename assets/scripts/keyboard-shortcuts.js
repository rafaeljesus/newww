window.mousetrap = require("mousetrap")

module.exports = function(){
  $(function () {
    // Toggle display of hidden README content
    mousetrap.bind(['command+i', 'ctrl+i'], function() {
      $('.package-name-redundant, .package-description-redundant').toggle()
    })

    // Focus search input when / key is pressed (#513)
    mousetrap.bind(['/', '-'], function(e){
      $('#site-search').focus();
      // don't add '/' character to input element
      e.preventDefault();
    });
  })
}
