var bole      = require('bole'),
    Boom      = require('boom'),
    Hoek      = require('hoek'),
    npmHumans = require("npm-humans"),
    featureFlag = require("../lib/feature-flags.js"),
    toCommonLogFormat = require('hapi-common-log'),
    url       = require('url'),
    UserModel = require('../models/user');

exports.register = function(server, options, next) {

  var metrics = require('./metrics')();

  server.ext('onPreHandler', function(request, reply) {

    // Add feature flags to request
    request.features = {}
    Object.keys(process.env)
      .filter(function (key) { return key.match(/^feature_/i) })
      .forEach(function (key) {
        key = key.replace(/^feature_/i, "").toLowerCase()
        request.features[key] = featureFlag(key, request)
      })

    // Generate `request.packageName` for global and scoped package requests
    if (request.params.package || request.params.scope) {
      request.packageName = request.params.package ||
        request.params.scope + "/" + request.params.project;
    }

    request.metrics = metrics;
    request.redis = request.server.app.cache._cache.connection.client;
    request.logger = bole(request.id);
    request.timing = {
      start: Date.now(),
    };

    if (request.auth && request.auth.credentials) {
      UserModel.new(request).get(request.auth.credentials.name)
      .then(function(loggedInUser) {
        request.loggedInUser = loggedInUser;
      }).catch(function(err) {
        request.logger.warn(err);
      }).finally(completePreHandler);
    } else {
      completePreHandler();
    }

    function completePreHandler () {
      if (request.method !== "post") {
        return reply.continue();
      }

      if (request.payload.honey && request.payload.honey.length) {
        return reply(Boom.badRequest(request.path));
      }

      delete request.payload.honey;
      return reply.continue();
    }

  });

  server.ext('onPreResponse', function(request, reply) {

    var context = Hoek.reach(request, 'response.source.context')

    if (context) {
      context.stamp = request.server.stamp
      context.features = request.features
    }

    options.correlationID = request.id;

    if (request.response && request.response.variety && request.response.variety.match(/view|plain/)) {
      if (process.env.CANONICAL_HOST) {
        if (request.url.query.page || request.url.query.q) {
          options.canonicalURL = url.resolve(process.env.CANONICAL_HOST, request.url.path);
        } else {
          options.canonicalURL = url.resolve(process.env.CANONICAL_HOST, request.url.pathname);
        }
      }
    }

    switch (request.response.variety) {
      case "view":
        request.response.source.context = Hoek.applyToDefaults(options, request.response.source.context);
        request.response.source.context.user = request.loggedInUser;
        break;
      case "plain":
        if (typeof(request.response.source) === "object") {
          request.response.source = Hoek.applyToDefaults(options, request.response.source);
        }
        break;
    }

    // Allow npm employees to view JSON context for any page
    // by adding a `?json` query parameter to the URL
    if ('json' in request.query) {
      var isNpmEmployee = Hoek.contain(npmHumans, Hoek.reach(request, "loggedInUser.name"));

      if (process.env.NODE_ENV === "dev" || isNpmEmployee) {
        var ctx = Hoek.reach(request, 'response.source.context');

        if (context) {
          var ctx = Hoek.applyToDefaults({}, context);

          // If the `json` param is something other than an empty string,
          // treat it as a (deep) key in the context object.
          if (request.query.json.length > 1) {
            ctx = Hoek.reach(context, request.query.json);
          }
          return reply(ctx);
        }
      }
    }

    return reply.continue();
  });

  server.ext('onPostHandler', function(request, reply) {

    var latency = Date.now() - request.timing.start;
    metrics.metric({
      name:  'latency',
      value: latency,
      type:  request.timing.type || 'pageload',
      page:  request.timing.page,
    });

    // TODO log request info in as close to common log format as possible
    request.logger.info(toCommonLogFormat(request, {ipHeader: 'fastly-client-ip'}), latency + 'ms');

    return reply.continue();
  });

  return next();
};

exports.register.attributes = {
  name: 'bonbon',
  version: '1.0.0'
};
