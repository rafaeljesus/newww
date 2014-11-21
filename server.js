var Hapi = require('hapi'),
    Hoek = require('hoek'),
    config = require('./config.js'),
    url = require('url'),
    MetricsClient = require('newww-metrics');

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
var couchDB = require('./adapters/couchDB');
couchDB.init(config.couch);

// configure metrics
var metrics = new MetricsClient(config.metrics);

server.pack.register(require('hapi-auth-cookie'), function (err) {
  if (err) throw err;

  var cache = server.cache('sessions', {
    expiresIn: config.session.expiresIn
  });

  server.app.cache = cache;

  server.auth.strategy('session', 'cookie', 'required', {
    password: config.session.password,
    appendNext: 'done',
    redirectTo: '/login',
    cookie: config.session.cookie,
    validateFunc: function (session, cb) {
      cache.get(session.sid, function (err, cached) {

        if (err) {
          return cb(err, false);
        }
        if (!cached) {
          return cb(null, false);
        }

        return cb(null, true, cached.item)
      })
    }
  });

  var plugins = require('./adapters/plugins');
  server.pack.register(plugins, function(err) {
    if (err) {
      // actually, if there's something wrong with plugin loading,
      // DO NOT PASS GO, DO NOT COLLECT $200. Throw the error.
      throw err;
    }

    server.route(require('./routes'))

    server.start(function() {
      metrics.addMetric({
        env: process.env.NODE_ENV,
        name: 'server.start'
      });

      log.info('Hapi server started @ ' + server.info.uri);
    });
  });
});
