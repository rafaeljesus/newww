var $ = require("jquery")
var templates = {
  sidebar: require("../templates/hiring-sidebar.hbs"),
  full: require("../templates/hiring-full.hbs"),
}

var fetchCompanies = function() {
  var container = $(".hiring-container")
  if (!container.length) return

  if (!container.data() || !container.data().template) {
    return console.error("container must specify a template")
  }

  var template = templates[container.data().template]

  $.getJSON("https://partners.npmjs.com/hiring")
    .done(function(companies) {
      container.html(template({companies: companies}))
    })
    .fail(function(xhr, status, error) {
      console.error("Could not fetch hiring data", error)
    })
}

$(fetchCompanies)
