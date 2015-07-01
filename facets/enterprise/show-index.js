module.exports = function npmE (request, reply) {
  var opts = {
    title: "npm Enterprise"
  };

  request.timing.page = 'enterprise';
  return reply.view('enterprise/index', opts);
};
