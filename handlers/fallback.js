// 1. Try to render a static page
// 2. Look for a package with the given name
// 3. 404

module.exports = function (request, reply) {

  var route = request.params.p;
  var opts = {user: request.auth.credentials};

  request.server.methods.corp.getPage(route, function(er, content) {

    if (content) {
      opts.md = content;
      return reply.view('company/corporate', opts);
    }

    request.server.methods.registry.getPackage(route, function(err, package) {

      if (package) {
        return reply.redirect('/package/' + package._id);
      }

      // Add package to view context if path is a valid package name
      if (require('validate-npm-package-name')(request.params.p).valid) {
        opts.package = {name: request.params.p};
      }

      return reply.view('errors/not-found', opts).code(404);
    });
  });
}
