$(function(){
  if (typeof twttr === "function") {
    var pid = $("[data-twitter-pid]").data('twitterPid');
    if (pid) {
      twttr.conversion.trackPid(pid);
    }
  }
});
