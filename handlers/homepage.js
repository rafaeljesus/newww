module.exports = function (request, reply) {
  var Package = new request.server.models.Package()
  var ctx = {}

  Package.list({sort: "updated"})
  .then(function(updated){
    ctx.updated = updated
    return Package.list({sort: "dependents"})
  })
  .then(function(depended){
    ctx.depended = depended
    return reply.view('/homepage', ctx)
  })

}
