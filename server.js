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

  server.pack.register([
    require('./facets/company'),
    require('./facets/registry'),
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
