module.exports = function(){
  $(function () {
    var privateModuleCustomer = $('#user-info a').data('is-paid');
    if( privateModuleCustomer ){
      $('.private-module-info-container').remove();
    }
  });
};
