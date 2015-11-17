var path = require('path');
var Hapi = require('hapi');
var GenericPool = require('generic-pool').Pool;

module.exports = function(done) {

  var metrics = require('../../adapters/metrics')();
  var server = new Hapi.Server();
  server.connection();

  server.stamp = require("../../lib/stamp")()
  server.gitHead = require("../../lib/git-head")()
  server.methods = require('./server-methods')(server);

  server.cacheRedisPool = new GenericPool({
    min: 0,
    max: Infinity,
    create: function(cb) {
      cb(null, require('redis-mock').createClient());
    },
    destroy: function(client) {
      client.end();
    }
  });

  server.persistentRedis = require('redis-mock').createClient();

  server.register(require('hapi-auth-cookie'), function(err) {
    if (err) {
      throw err;
    }

    server.app.cache = server.cache({
      expiresIn: 30,
      segment: '|sessions' // Adding a '|' prefix to keep the cache keys same as in hapi 7.x and older
    });

    server.auth.strategy('session', 'cookie', 'required', {
      password: '12345',
      redirectTo: '/login'
    });

    server.register([
      {
        register: require('crumb'),
        options: {
          cookieOptions: {
            isSecure: true
          }
        }
      },
      require('inert'),
      require('vision'),
      require('../../adapters/bonbon'),
      hackishMockRedis,
      require('hapi-stateless-notifications')
    ], function(err) {
      if (err) {
        throw err;
      }

      server.views({
        engines: {
          hbs: require('handlebars')
        },
        relativeTo: path.resolve(__dirname, "..", ".."),
        path: './templates',
        helpersPath: './templates/helpers',
        layoutPath: './templates/layouts',
        partialsPath: './templates/partials',
        layout: 'default'
      });

      try {
        server.route(require('../../routes/index'));
      } catch (e) {
        process.nextTick(function() {
          throw e;
        });
      }

      server.start(function() {
        return done(server);
      });
    });
  });
};

function hackishMockRedis(server, options, next) {
  server.ext('onPreHandler', function(request, reply) {
    request.redis = require('redis-mock').createClient();
    reply.continue();
  });

  next();
}

hackishMockRedis.attributes = {
  name: "hackishMockRedis"
};
