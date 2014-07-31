var Hapi = require('hapi'),
    Hoek = require('hoek'),
    config = require('./config.js');

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
