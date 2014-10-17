var $ = require("jquery")
var template = require("../templates/hiring.hbs")

var fetchCompanies = function() {
  var container = $("#hiring-container")
  if (!container.length) return

  $.getJSON("https://npm-partners.herokuapp.com/hiring?limit=3")
    .done(function(companies) {
      container.html(template({companies: companies}))
    })
    .fail(function(xhr, status, error) {
      console.error("Could not fetch hiring data", error)
    })
}

$(fetchCompanies)
