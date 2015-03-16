module.exports = function(request, reply) {
  var opts = {}
  return reply.view('enterprise/license-paid', opts);
};