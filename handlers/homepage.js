module.exports = function (request, reply) {
  var Package = require("../models/package").new(request)
  var Download = require("../models/download").new(request)
  var context = {
    explicit: require("npm-explicit-installs")
  }

  Package.list({sort: "modified"})
    .then(function(modified){
      context.modified = modified
      return Package.list({sort: "dependents"})
    })
    .then(function(dependents){
      context.dependents = dependents
      return Download.getAll()
    })
    .then(function(downloads){
      context.downloads = downloads
      return Package.count()
    })
    .then(function(count){
      context.totalPackages = count
      return reply.view('homepage', context)
    })

}
