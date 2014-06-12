var path = require('path');
var internals = {};

exports.register = function Company (facet, options, next) {

  facet.views({
    engines: { hbs: require('handlebars') },
    path: path.resolve(__dirname, 'templates'),
  });

  facet.route({
    path: "/",
    method: "GET",
    handler: function(request, reply) {

      var opts = {
        user: request.auth.credentials
      }

      reply.view('index', opts);
    }
  });

  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};