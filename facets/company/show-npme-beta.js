

module.exports = function npmE (request, reply) {
  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.getRandomWhosHiring(),
    title: "npm-Enterprise beta"
  };

  if (request.path.indexOf('thanks') !== -1) {
    return reply.view('npme-beta-thanks', opts);
  }

  return reply.view('npme-beta', opts);
}