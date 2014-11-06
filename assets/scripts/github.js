var parseLinkHeader = require('parse-link-header')

var github = module.exports = function(){
  $(github.init)
  return github
}

github.init = function(){
  github.issues = {
    element: $("#issues")
  }
  github.pull_requests = {
    element: $("#pull_requests")
  }

  // If there's an #issues element on the page, look for the repo's
  // GitHub API base URL in a data attribute
  if (github.issues.element.length &&
      github.issues.element.data() &&
      github.issues.element.data().ghapi) {

    // Set up API URLs
    github.issues.api_url = github.issues.element.data().ghapi+"/issues?per_page=1"
    github.pull_requests.api_url = github.issues.element.data().ghapi+"/pulls?per_page=1"

    // Start with pull requests
    github.getPullRequests()
  }
}

github.getPullRequests = function() {
  $.getJSON(github.pull_requests.api_url)
  .done(function(pull_requests, textStatus, xhr) {
    try {
      github.pull_requests.count = Number(parseLinkHeader(xhr.getResponseHeader("Link")).last.page)
    } catch (er) {
      github.pull_requests.count = pull_requests.length
    }
    github.getIssues()
  })
}

github.getIssues = function(){
  $.getJSON(github.issues.api_url)
  .done(function(issues, textStatus, xhr) {

    // The GitHub API Issues count is actually issues + PRs
    // Substract PRs from this count to get an accurate count of regular issues
    try {
      github.issues.count = Number(parseLinkHeader(xhr.getResponseHeader("Link")).last.page) - github.pull_requests.count
    } catch (er) {
      github.issues.count = issues.length - github.pull_requests.count
    }

    github.render()
  })
}

github.render = function() {
  var label
  switch (github.issues.count) {
    case undefined:
    case null:
    case false:
    case "":
      return
      break
    case 0:
      label = "No open issues"
      break
    case 1:
      label = "One open issue"
      break
    default:
      label = github.issues.count + " open issues"
      break
  }

  github.issues.element.find(".original").hide()
  github.issues.element.find("a").text(label)
  github.issues.element.find(".enhanced").show()

  switch (github.pull_requests.count) {
    case undefined:
    case null:
    case false:
    case "":
      return
      break
    case 0:
      label = "No open pull requests"
      break
    case 1:
      label = "One open pull request"
      break
    default:
      label = github.pull_requests.count + " open pull requests"
      break
  }

  github.pull_requests.element.find("a").text(label)
  github.pull_requests.element.show()

}
