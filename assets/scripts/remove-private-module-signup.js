module.exports = function(){
  $(function () {
    var privateModuleCustomer = $('#user-info a').is('[data-is-paid=true]');
    if( privateModuleCustomer ){
      $('.private-module-info-container').remove();
    }
  });
};
