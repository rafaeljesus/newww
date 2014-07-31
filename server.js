var Hapi = require('hapi'),
    Hoek = require('hoek'),
    config = require('./config.js'),
    uuid = require('node-uuid'),
    murmurhash = require('murmurhash');

// set up the logger
var bole = require('bole'),
    log = bole('server');

bole.output({
  level: 'info',
  stream: process.stdout
});

// set up the server
var server = new Hapi.Server(config.host, config.port, config.server)

// configure couch
var couchDB = require('./couchDB');
couchDB.init(config.couch);

server.route({
  path: '/favicon.ico',
  method: 'GET',
  handler: { file: './favicon.ico' }
})

server.route({
  path: '/static/{path*}',
  method: 'GET',
  handler: {
    directory: {
      path: './static',
      listing: false,
      index: false
    }
  }
});

server.ext('onPreResponse', function (request, next) {

  if (request.response.variety === 'view') {
    request.response.source.context = Hoek.applyToDefaults({stamp: config.stamp}, request.response.source.context);
  }

  // adds CSP header :-)
  var header = "default-src 'self'; img-src *; script-src 'self' https://ssl.google-analytics.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://typeahead.npmjs.com/; report-uri /-/csplog;"

  if (request.path === '/joinwhoshiring') {
    header = "default-src 'self'; img-src *; script-src 'self' 'unsafe-eval' https://ssl.google-analytics.com https://checkout.stripe.com; frame-src https://checkout.stripe.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://typeahead.npmjs.com/; report-uri /-/csplog;";
  }

  if (request.path === '/npme-beta') {
    header = "default-src 'self'; img-src *; script-src 'self' 'unsafe-eval' https://ssl.google-analytics.com https://js.hs-analytics.net https://js.hsforms.net/forms/current.js https://forms.hubspot.com https://internal.hubapi.com https://api.hubapi.com;; style-src 'self' 'unsafe-inline'; connect-src 'self' https://typeahead.npmjs.com/; report-uri /-/csplog;";
  }

  if (request.response.isBoom) {
    request.response.output.headers['Content-Security-Policy'] = header;
  } else {
    request.response.header('Content-Security-Policy',header);
  }

  next();
});

server.pack.register(require('hapi-auth-cookie'), function (err) {
  if (err) throw err;

  var cache = server.cache('sessions', {
    expiresIn: config.session.expiresIn
  });

  server.app.cache = cache;

  server.auth.strategy('session', 'cookie', 'try', {
    password: config.session.password,
    appendNext: 'done',
    cookie: config.session.cookie,
    validateFunc: function (session, callback) {
      cache.get(session.sid, function (err, cached) {

        if (err) {
          return callback(err, false);
        }
        if (!cached) {
          return callback(null, false);
        }

        return callback(null, true, cached.item)
      })
    }
  });

  // make it easier for setting/clearing sessions throughout the app
  server.method('setSession', setSession);
  server.method('delSession', delSession);

  server.pack.register([
    {
      plugin: require('crumb'),
      options: { isSecure: true }
    },
    {
      plugin: require('./facets/company'),
      options: config.company
    },
    {
      plugin: require('./facets/registry'),
      options: config.search
    },
    {
      plugin: require('./facets/user'),
      options: config.user
    },
    {
      plugin: require('./facets/ops'),
      options: require('./package.json').version
    },
    {
      plugin: require('./services/user'),
      options: config.couch
    },
    require('./services/registry'),
    require('./services/whoshiring'),
    {
      plugin: require('./services/metrics'),
      options: config.metrics
    },
    {
      plugin: require('./services/downloads'),
      options: config.downloads
    }
  ], function(err) {
    if (err) {
      // actually, if there's something wrong with plugin loading,
      // DO NOT PASS GO, DO NOT COLLECT $200. Throw the error.
      throw err;
    }

    server.start(function() {
      log.info('Hapi server started @ ' + server.info.uri);
    });
  });
})

// ======== functions =========

function setSession (request) {
  return function (user, next) {
    var sid = murmurhash.v3(user.name, 55).toString(16),
        timer = { start: Date.now() };

    user.sid = sid;

    request.server.app.cache.set(sid, user, 0, function (err) {
      if (err) {
        var errId = uuid.v1();
        log.error(errId + ' ' + Hapi.error.internal('there was an error setting the cache'));

        request.server.methods.metrics.addMetric({name: 'setSessionError'});
        return next(Hapi.error.internal(errId));
      }

      timer.end = Date.now();
      request.server.methods.metrics.addMetric({
        name: 'latency',
        value: timer.end - timer.start,
        type: 'redis',
        action: 'setSession'
      });

      request.auth.session.set({sid: sid});
      return next(null);
    });
  }
}

function delSession (request) {
  return function (user, next) {
    var sid = murmurhash.v3(user.name, 55).toString(16),
        timer = { start: Date.now() };

    user.sid = sid;

    request.server.methods.couch.logoutUser(user.token, function () {

      request.server.app.cache.drop(sid, function (err) {
        if (err) {
          var errId = uuid.v1();
          log.error(errId + ' ' + Hapi.error.internal('there was an error clearing the cache'));
          request.server.methods.metrics.addMetric({name: 'delSessionError'});
          return next(Hapi.error.internal(errId));
        }

        timer.end = Date.now();
        request.server.methods.metrics.addMetric({
          name: 'latency',
          value: timer.end - timer.start,
          type: 'redis',
          action: 'delSession'
        });

        request.auth.session.clear();
        return next(null);
      });
    });
  }
}