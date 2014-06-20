var Hapi = require('hapi'),
    config = require('./config.js')

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
    appendNext: true,
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
    require('./facets/company'),
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
    }
  ], function(err) {
    if (err) throw err;

    server.start(function() {
        console.log('Hapi server started @ ' + server.info.uri);
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
        return next(Hapi.error.internal('there was an error setting the cache'));
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

    request.server.app.cache.drop(sid, function (err) {
      if (err) {
        return next(Hapi.error.internal('there was an error clearing the cache'));
      }

      request.server.methods.logoutUser(function () {
        request.auth.session.clear();
        return next(null);
      });
    });
  }
}