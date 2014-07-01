var Hapi = require('hapi'),
    config = require('./config.js'),
    uuid = require('node-uuid');

// set up the logger
var bole = require('bole'),
    pretty = require('bistre')(),
    log = bole('server');

bole.output({
  level: 'info',
  stream: pretty
});

pretty.pipe(process.stdout);

// set up the server
var server = new Hapi.Server(config.host, config.port, config.server)

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
      plugin: require('./facets/company'),
      options: config.payments
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
      plugin: require('./services/couchdb'),
      options: config.couch
    },
    require('./services/whoshiring')
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

var murmurhash = require('murmurhash');

function setSession (request) {
  return function (user, next) {
    var sid = murmurhash.v3(user.name, 55).toString(16);

    user.sid = sid;

    request.server.app.cache.set(sid, user, 0, function (err) {
      if (err) {
        var errId = uuid.v1();
        log.error(errId + ' ' + Hapi.error.internal('there was an error setting the cache'));
        return next(Hapi.error.internal(errId));
      }

      request.auth.session.set({sid: sid});
      return next(null);
    });
  }
}

function delSession (request) {
  return function (user, next) {
    var sid = murmurhash.v3(user.name, 55).toString(16);

    user.sid = sid;

    request.server.methods.logoutUser(function () {

      request.server.app.cache.drop(sid, function (err) {
        if (err) {
          var errId = uuid.v1();
          log.error(errId + ' ' + Hapi.error.internal('there was an error clearing the cache'));
          return next(Hapi.error.internal(errId));
        }

        request.auth.session.clear();
        return next(null);
      });
    });
  }
}