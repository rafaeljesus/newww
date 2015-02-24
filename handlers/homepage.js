var Promise = require('bluebird');

module.exports = function (request, reply) {
  var Package = new request.server.models.Package()
  var Download = new request.server.models.Download()
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
    .catch(function(err){
      if (err.code === 'ETIMEDOUT') {
        return null;
      } else {
        Promise.reject(err)
      }
    })
    .then(function(downloads){
      context.downloads = downloads
      return reply.view('homepage', context)
    })

}
