module.exports = function(request, reply) {
  var opts = { };

  request.timing.page = 'whoshiring';
  reply.view('company/whoshiring', opts);
};
