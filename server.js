var Hapi = require('hapi'),
    Hoek = require('hoek'),
    config = require('./config.js'),
    MetricsClient = require('./adapters/metrics');

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

  // adds the server info stamp to the bottom of each template
  if (request.response.variety === 'view') {
    request.response.source.context = Hoek.applyToDefaults({stamp: config.stamp}, request.response.source.context);
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

  server.pack.register(config.plugins, function(err) {
    if (err) {
      // actually, if there's something wrong with plugin loading,
      // DO NOT PASS GO, DO NOT COLLECT $200. Throw the error.
      throw err;
    }

    server.start(function() {
      log.info('Hapi server started @ ' + server.info.uri);
    });
  });
});
