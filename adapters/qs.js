const Qs = require('qs');

exports.register = function(server, options, next) {

  const onPostAuth = function(request, reply) {

    if (typeof request.payload === 'object' &&
      !Buffer.isBuffer(request.payload)) {

      request.payload = Qs.parse(request.payload);
    }

    return reply.continue();
  };

  server.ext('onPostAuth', onPostAuth);

  next();

};

exports.register.attributes = {
  name: 'qs',
  version: '1.0.0'
};
