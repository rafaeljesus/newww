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
    handler: require('./show-homepage')
  });

  facet.route({
    path: "/about",
    method: "GET",
    handler: require('./show-about')(options)
  });

  facet.route({
    path: "/whoshiring",
    method: "GET",
    handler: require('./show-whoshiring')
  });

  facet.route({
    path: "/joinwhoshiring",
    method: ["GET", "POST"],
    handler: require('./show-whoshiring-payments')(options.stripe)
  });

  facet.route({
    path: "/npme-beta",
    method: "GET",
    handler: require('./show-npme-beta')
  });

  facet.route({
    path: "/npme-beta-thanks",
    method: "GET",
    handler: require('./show-npme-beta')
  });

  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};