$(function(){
  if (AccountDock) {
    var billing = $("#billing");
    var customerId = billing.data("stripe-id");
    var handler = AccountDock.configure({
      key: 'ad_acco_9fef40229188e8c0',
      customer: customerId
    });
    billing.on('click', handler.open);
  }
});
