module.exports = function(request, reply) {
  var opts = {}
  return reply.view('enterprise/license-error', opts);
};