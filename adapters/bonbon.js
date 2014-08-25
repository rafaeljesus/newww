var Hoek = require('hoek'),
    url = require('url');

exports.register = function (plugin, options, next) {
  plugin.ext('onPreResponse', function (request, next) {
    if (request.response.variety === 'view') {

      if (options.canonicalHost) {
        options.canonicalHref = url.resolve(options.canonicalHost, url.parse(request.url).path);
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
