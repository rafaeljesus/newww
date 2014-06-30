module.exports = function (request, reply) {

  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.getRandomWhosHiring(),
    companies: request.server.methods.getAllWhosHiring(),
    title: 'Who\'s Hiring'
  };

  reply.view('whoshiring', opts);
};