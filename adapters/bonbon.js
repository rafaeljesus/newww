var bole              = require('bole'),
    Boom              = require('boom'),
    CustomerModel     = require('../models/customer'),
    Hoek              = require('hoek'),
    humans            = require('npm-humans'),
    featureFlag       = require('../lib/feature-flags.js'),
    toCommonLogFormat = require('hapi-common-log'),
    url               = require('url'),
    UserModel         = require('../models/user');

exports.register = function(server, options, next) {

  var metrics = require('./metrics')();

  server.ext('onPreHandler', function(request, reply) {

    // Add feature flags to request
    request.features = {};
    Object.keys(process.env)
      .filter(function (key) { return key.match(/^feature_/i) })
      .forEach(function (key) {
        key = key.replace(/^feature_/i, "").toLowerCase();
        request.features[key] = featureFlag(key, request);
      });

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

    if (request.auth && request.auth.credentials && !request.path.match(/static/)) {
      UserModel.new(request).get(request.auth.credentials.name, function(err, user) {
        if (err) { request.logger.warn(err); }
        request.loggedInUser = user;
        request.customer = user && new CustomerModel(user.name);
        completePreHandler();
      });
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

    var options = {
      correlationID: request.id,
      stamp: request.server.stamp,
      features: request.features,
    };

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

    // Allow npm humans to view JSON context for any page
    // by adding a `?json` query parameter to the URL
    if ('json' in request.query &&
        Hoek.reach(request, 'response.source.context') &&
        (process.env.NODE_ENV === "dev" || Hoek.reach(request, "loggedInUser.name") in humans)
    ) {
      if (request.query.json.length > 1) {
        // deep reference: ?json=profile.packages
        return reply(Hoek.reach(request.response.source.context, request.query.json));
      } else {
        // the whole enchilada: ?json
        return reply(request.response.source.context);
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
