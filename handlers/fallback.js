var validatePackageName = require('validate-npm-package-name')

// 1. Try to render a static page
// 2. Look for a package with the given name
// 3. 404

module.exports = function (request, reply) {

  var route = request.params.p;
  var opts = {user: request.auth.credentials};
  var loggedInUser = request.auth.credentials;
  var bearer = loggedInUser && loggedInUser.name;
  var Package = new request.server.models.Package({bearer: bearer});

  request.server.methods.corp.getPage(route, function(er, content) {

    if (content) {
      opts.md = content;
      return reply.view('company/corporate', opts);
    }

    // Bail now if there's no way this package exists
    if (!validatePackageName(route).validForOldPackages) {
      return reply.view('errors/not-found', opts).code(404);
    }

    Package.get(route)
      .then(function(package){
        return reply.redirect('/package/' + package.name);
      })
      .catch(function(err){
        if (validatePackageName(route).validForNewPackages) {
          opts.package = {name: route};
        }
        return reply.view('errors/not-found', opts).code(404);
      });

  });
}
