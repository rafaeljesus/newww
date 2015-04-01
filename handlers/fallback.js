var validatePackageName = require('validate-npm-package-name');

module.exports = function (request, reply) {

  var route = request.params.p;
  var opts = { };

  request.server.methods.corp.getPage(route, function(er, content) {

    if (content) {
      opts.md = content;
      return reply.view('company/corporate', opts);
    }

    // Bail now if there's no way this package exists
    if (!validatePackageName(route).validForOldPackages) {
      return reply.view('errors/not-found', opts).code(404);
    }

    return reply.redirect('/package/' + route).code(302);
  });
};
