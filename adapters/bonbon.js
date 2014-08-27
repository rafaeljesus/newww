var Hoek = require('hoek'),
    url = require('url');

exports.register = function (plugin, options, next) {
  plugin.ext('onPreResponse', function (request, next) {
    if (request.response.variety === 'view') {

      if (options.canonicalHost) {
        if (request.url.query.page || request.url.query.q) {
          options.canonicalURL = url.resolve(options.canonicalHost, request.url.path);
        } else {
          options.canonicalURL = url.resolve(options.canonicalHost, request.url.pathname);
        }

      }

      request.response.source.context = Hoek.applyToDefaults(options, request.response.source.context);
    }

    next();
  });

  next();
};

exports.register.attributes = {
  name: 'bonbon',
  version: '1.0.0'
};
