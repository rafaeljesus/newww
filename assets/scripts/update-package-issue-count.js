module.exports = function(){

  window.issuesEl = $("#issues")

  if (issuesEl.length && issuesEl.data().ghapi) {
    $.getJSON(issuesEl.data().ghapi+"/issues", function(issues) {
      if (!issues.length) return
      window.issues = issues
      window.pulls = issues.filter(function(i) { return i.pull_request })
      var count = issues.length - pulls.length
      var label

      switch (count) {
        case 0:
          label = "No open issues"
          break;
        case 1:
          label = "One open issue"
          break;
        default:
          label = count + " open issues"
          break;
      }

      // switch (pulls.length) {
      //   case 0:
      //     break;
      //   case 1:
      //     label += " and one pull request"
      //     break;
      //   default:
      //     label += " and " + pulls.length + " pull requests"
      //     break;
      // }

      issuesEl.find(".original").hide()
      issuesEl.find(".open_issues_count").text(label)
      issuesEl.find(".enhanced").show()
    })
  }
}
