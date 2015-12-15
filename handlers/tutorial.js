var npa = require('npm-package-arg');
var PackageAgent = require("../agents/package");

module.exports = function(request, reply) {
  var name = request.packageName;
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
