var http = require("request")
var _ = require("lodash")
var avatar = require("../../lib/avatar")
var humans = require("npm-humans")

module.exports = function(request, reply) {

  var ctx = {}

  http("http://registry.npmjs.org/" + request.params.package, function(err, res, body) {
    var package = _.pick(JSON.parse(body), ["name", "description", "dist-tags"])

    package.collaborators = Object.keys(humans).map(function(username){
      var human = _.clone(humans[username])
      human.fullname = human.name
      human.name = human.username
      delete human.username
      human.access = _.sample(["read-only", "read-write"])
      human.read_only = (human.access === "read-only")
      return human
    })

    package.collaborators.forEach(function(collaborator) {
      collaborator.avatar = avatar(collaborator.email)
    })

    ctx.package = package

    return reply.view('package/access', ctx);
  })

}
