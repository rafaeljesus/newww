
module.exports = function (request, reply) {

  var opts = { };
  var policy = request.params.policy || 'README';

  request.server.methods.corp.getPolicy(policy, function (err, content) {

    if (err) {
      request.logger.warn('could not find policy ' + policy);
      reply.view('errors/not-found', opts).code(404);
      return;
    }

    opts.md = content;

    request.timing.page = 'policy-' + policy;
    request.metrics.metric({name: 'policy-' + policy});

    return reply.view('company/corporate', opts);
  });
};
