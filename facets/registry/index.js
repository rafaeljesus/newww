var path = require('path');
var internals = {};

exports.register = function Regsitry (facet, options, next) {

  facet.views({
    engines: { hbs: require('handlebars') },
    path: path.resolve(__dirname, 'templates')
  });

  facet.route({
    path: "/package/{package}/{version?}",
    method: "GET",
    handler: require('./show-package')
  });

  facet.route({
    path: "/browse/{p*}",
    method: "GET",
    handler: require('./show-browse')
  })

  facet.route({
    path: "/keyword/{kw}",
    method: "GET",
    handler: function (request, reply) {
      return reply.redirect('/browse/keyword/' + request.params.kw).code(301);
    }
  });

  facet.route({
    path:"/search",
    method: "GET",
    handler: require('./show-search')(options)
  });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
