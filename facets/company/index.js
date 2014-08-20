var path = require('path');
var internals = {};

exports.register = function Company (facet, options, next) {
  facet.views({
    engines: { hbs: require('handlebars') },
    path: path.resolve(__dirname, 'templates'),
    layoutPath: path.resolve(__dirname, '../../templates/layouts'),
    layout: 'default',
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
    config: {
      handler: require('./show-whoshiring-payments')(options.stripe),
      plugins: {
        blankie: {
          scriptSrc: ['self', 'unsafe-eval', 'https://ssl.google-analytics.com', 'https://checkout.stripe.com'],
          frameSrc: 'https://checkout.stripe.com'
        }
      }
    }
  });

  facet.route({
    path: "/npme-beta",
    method: "GET",
    config: {
      handler: require('./show-npme-beta'),
      plugins: {
        blankie: {
          scriptSrc: ['self', 'unsafe-eval', 'https://ssl.google-analytics.com', 'https://js.hs-analytics.net', 'https://js.hsforms.net/forms/current.js', 'https://forms.hubspot.com', 'https://internal.hubapi.com', 'https://api.hubapi.com']
        }
      }
    }
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
