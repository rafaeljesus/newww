module.exports = function fallbackHandler (request, reply) {
  var name = request.params.p,
      opts = { user: request.auth.credentials };

  request.server.methods.registry.getPackage(name, function (err, package) {

    if (package && !package.error) {
      reply.redirect('/package/' + package._id);
    }

    request.timing.page = '404-not-found';
    request.metrics.metric({name: '404'});
    
    reply.view('errors/registry-not-found', opts).code(404);
  });
};
