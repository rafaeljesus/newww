var Hoek = require('hoek'),
    Hapi = require('hapi'),
    url = require('url');

exports.register = function(plugin, options, next) {

  plugin.ext('onPreHandler', function(request, next) {

    if (request.method !== "post") {
      return next();
    }

    if (request.payload.honey && request.payload.honey.length) {
      return next(Hapi.Error.badRequest(request.path));
    }

    delete request.payload.honey;

    return next();
  })

  plugin.ext('onPreResponse', function(request, next) {

    // Return raw context object if `json` query param is present
    // Remove `user` property from context to minimize risk
    if ('json' in request.query) {
      var ctx = Hoek.reach(request, 'response.source.context');
      if (ctx) {
        var context = Hoek.applyToDefaults({}, ctx);
        delete context.user;
        return next(context);
      }
    }

    if (request.response && request.response.variety && request.response.variety.match(/view|plain/)) {
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
        if (typeof(request.response.source) === "object") {
          request.response.source = Hoek.applyToDefaults(options, request.response.source);
        }
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
