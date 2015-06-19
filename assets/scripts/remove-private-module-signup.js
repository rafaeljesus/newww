module.exports = function(){
  $(function () {
    var loggedIn = $('#user-info a').has('[data-is-paid=true]');
    if( loggedIn ){
      $('.private-module-info-container').remove();
    }
  });
};
