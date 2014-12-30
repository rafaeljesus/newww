var bole      = require('bole'),
    Hapi      = require('hapi'),
    Hoek      = require('hoek'),
    npmHumans = require("npm-humans"),
    toCommonLogFormat = require('hapi-common-log'),
    url       = require('url');

exports.register = function(plugin, options, next) {

  var metrics = require('./metrics')();

  plugin.ext('onPreHandler', function(request, next) {

    request.metrics = metrics;
    request.logger = bole(request.id);
    request.timing = {
      start: Date.now(),
    };

    if (request.method !== "post") {
      return next();
    }

    if (request.payload.honey && request.payload.honey.length) {
      return next(Hapi.Error.badRequest(request.path));
    }

    delete request.payload.honey;

    return next();
  });

  plugin.ext('onPreResponse', function(request, next) {

    if ('json' in request.query) {
      var isNpmEmployee = Hoek.contain(npmHumans, Hoek.reach(request, "auth.credentials.name"));
      if (process.env.NODE_ENV === "dev" || isNpmEmployee) {
        var ctx = Hoek.reach(request, 'response.source.context');
        if (ctx) {
          var context = Hoek.applyToDefaults({}, ctx);
          return next(context);
        }
      }
    }

    options.correlationID = request.id;

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
        request.response.source.context.user = request.auth.credentials;
        break;
      case "plain":
        if (typeof(request.response.source) === "object") {
          request.response.source = Hoek.applyToDefaults(options, request.response.source);
        }
        break;
    }

    next();
  });

  plugin.ext('onPostHandler', function(request, next) {

    var latency = Date.now() - request.timing.start;
    metrics.metric({
      name:  'latency',
      value: latency,
      type:  request.timing.type || 'pageload',
      page:  request.timing.page,
    });

    // TODO log request info in as close to common log format as possible
    request.logger.info(toCommonLogFormat(request), latency + 'ms');

    next();
  });

  next();
};

exports.register.attributes = {
  name: 'bonbon',
  version: '1.0.0'
};
