var parseLinkHeader = require('parse-link-header')

module.exports = function(){

  window.issuesEl = $("#issues")

  if (!issuesEl.length || !issuesEl.data() || !issuesEl.data().ghapi) {
    return
  }

  var issuesURL = issuesEl.data().ghapi+"/issues?per_page=1"
  console.log(issuesURL)

  $.getJSON(issuesURL)
  .done(function(issues, textStatus, xhr) {
    window.issues_xhr = xhr
    var label
    var count

    try {
      count = Number(parseLinkHeader(xhr.getResponseHeader("Link")).last.page)
    } catch (er) {
      count = issues.length
    }

    if (!count) {
      return
    }

    switch (count) {
      case 0:
        label = "No open issues"
        break;
      case 1:
        label = "One open issue"
        break;
      default:
        label = count + " open issues and PRs"
        break;
    }

    issuesEl.find(".original").hide()
    issuesEl.find(".open_issues_count").text(label)
    issuesEl.find(".enhanced").show()
  })

}
