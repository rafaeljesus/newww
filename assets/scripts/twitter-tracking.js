/*
  l5xz2: billing page viewed
  l5xyy: private npm purchased
  l5ybn: email verified
*/

$(function(){
  if (typeof twttr === "function") {
    var pid = $("[data-twitter-pid]").data('twitterPid');
    if (pid) {
      console.log("tracking twitter conversion: " + pid);
      twttr.conversion.trackPid(pid);
    }
  }
});
