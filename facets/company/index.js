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

  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};