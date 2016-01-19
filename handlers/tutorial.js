var npa = require('npm-package-arg');
var PackageAgent = require("../agents/package");

module.exports = function(request, reply) {
  var scope = request.params.scope;
  var name = scope ? scope + '/' + request.params.project : request.params.project;
  var Package = new PackageAgent(request.loggedInUser);

  Package.get(name)
    .then(function(pkg) {
      var context = {
        package: pkg
      };
      reply.view('package/tutorial', context);
    }, function(err) {
      return reply(err);
    });
};
