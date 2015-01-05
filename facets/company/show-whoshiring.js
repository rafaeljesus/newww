module.exports = function (request, reply) {
  var timer = { start: Date.now() };

  var opts = {
    user: request.auth.credentials
  };

  request.timing.page = 'whoshiring';
  request.metrics.metric({name: 'whoshiring'});

  reply.view('company/whoshiring', opts);
};
