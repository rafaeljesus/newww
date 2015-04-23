$(function(){
  if (typeof twttr === "function") {
    var pid = $("[data-twitter-pid]").data('twitterPid');
    if (pid) {
      twttr.conversion.trackPid(pid, {
        tw_sale_amount: 0,
        tw_order_quantity: 0
      });
    }
  }
});
