module.exports = function (type, text) {
  return function (request, reply) {
    var opts = { user: request.auth.credentials },
        timer = { start: Date.now() };

    opts.text = text;

    request.timing.page = 'static-' + type;
    request.metrics.metric({name: 'static-' + type});

    reply.view('static', opts);
  };
};
