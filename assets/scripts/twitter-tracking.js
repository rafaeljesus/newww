$(function(){
  if (typeof twttr === "function") {
    var pid = $("[data-twitter-pid]").data('twitterPid');
    if (pid) {
      console.log("tracking twitter conversion: " + pid);
      twttr.conversion.trackPid(pid);
    }
  }
});
