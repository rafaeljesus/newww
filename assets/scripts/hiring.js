var $ = require("jquery")
var chunk = require("chunk")
var templates = {
  sidebar: require("../templates/hiring-sidebar.hbs"),
  full: require("../templates/hiring-full.hbs"),
  vanilla: require("../templates/hiring-vanilla.hbs"),
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

      // Break companies into an array of arrays
      // So the columnar layout works better
      if (container.data().template === "full") {
        companies = chunk(companies, 3)  
      }

      window.companies = companies

      container.html(template({
        companies: companies
      }))
    })
    .fail(function(xhr, status, error) {
      console.error("Could not fetch hiring data", error)
    })
}

$(fetchCompanies)
