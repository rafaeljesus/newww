module.exports = function(type, text) {
  return function(request, reply) {
    var opts = { };
    opts.text = text;
    request.timing.page = 'static-' + type;
    reply.view('static', opts);
  };
};
