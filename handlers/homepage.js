module.exports = function (request, reply) {
  var Package = new request.server.models.Package()
  var ctx = {}

  Package.getRecentlyUpdated()
  .then(function(updated){
    ctx.updated = updated
    return Package.getMostDependedUpon()
  })
  .then(function(depended){
    ctx.depended = depended
    return reply.view('/homepage', ctx)
  })
  .catch(function(err){
    return "whoa"
  })
  
})
