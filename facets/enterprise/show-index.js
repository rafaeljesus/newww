module.exports = function npmE (request, reply) {
  var opts = {
    title: "npm Enterprise"
  };

  request.timing.page = 'enterprise';
  request.metrics.metric({name: 'enterprise'});
  return reply.view('enterprise/index', opts);
};
