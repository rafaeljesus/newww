var Hoek = require('hoek'),
  url = require('url');

exports.register = function(plugin, options, next) {
  plugin.ext('onPreResponse', function(request, next) {

    if (request.response && request.response.variety && request.response.variety.match(/view|plain/)) {

      options.graphics = require("@npm/graphics")

      if (options.canonicalHost) {
        if (request.url.query.page || request.url.query.q) {
          options.canonicalURL = url.resolve(options.canonicalHost, request.url.path);
        } else {
          options.canonicalURL = url.resolve(options.canonicalHost, request.url.pathname);
        }
      }
    }

    switch (request.response.variety) {
      case "view":
        request.response.source.context = Hoek.applyToDefaults(options, request.response.source.context);
        break;
      case "plain":
        request.response.source = Hoek.applyToDefaults(options, request.response.source);
        break;
    }

    next();
  });

  next();
};

exports.register.attributes = {
  name: 'bonbon',
  version: '1.0.0'
};
