module.exports = function (request, reply) {
  var Package = new request.server.models.Package()
  var context = {
    explicit: require("npm-explicit-installs")
  }

  Package.list({sort: "updated"})
  .then(function(updated){
    context.updated = updated
    return Package.list({sort: "dependents"})
  })
  .then(function(depended){
    context.depended = depended
    return reply.view('/homepage', context)
  })

}
