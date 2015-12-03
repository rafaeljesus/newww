var bole = require('bole');

exports.register = function(server, options, next) {

  server.ext('onPreResponse', function(request, reply) {

    var response = request.response;

    if (!response.isBoom) {
      return reply.continue();
    }

    var logger = bole(request.id);
    response.correlationID = request.id

    if (response.statusCode === 404 || response.output.statusCode == 404) {
      return reply.view('errors/not-found', response).code(404)
    } else {
      logger.warn(response);
      return reply.view('errors/internal', response).code(500);
    }
  });

  next();

};

exports.register.attributes = {
  name: 'error-handler',
  version: '1.0.0'
};
