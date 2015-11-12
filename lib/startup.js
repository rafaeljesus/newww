var P = require('bluebird');
var Hapi = require('hapi');
var path = require('path');
var redisConfig = require("url").parse(process.env.REDIS_URL);

module.exports = makeServer;

var TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;

function makeServer(config) {
  return P.resolve().then(function() {
    var server = new Hapi.Server({
      cache: {
        engine: require('catbox-redis'),
        host: redisConfig.hostname,
        port: redisConfig.port,
        password: redisConfig.auth ? redisConfig.auth.split(':')[1] : null,
      },
      connections: {
        router: {
          stripTrailingSlash: true
        },
        routes: {
          security: {
            hsts: {
              maxAge: 1000 * 60 * 60 * 24 * 30,
              includeSubdomains: true
            },
            xframe: true
          }
        }
      }
    });

    server.connection(config.connection);

    server.stamp = require("./stamp")();
    server.gitHead = require("./git-head")();

    // configure http request cache
    require("./cache").configure({
      redis: process.env.REDIS_URL,
      ttl: 500,
      prefix: "cache:"
    });

    return P.promisify(server.register, {context: server})(require('hapi-auth-cookie')).then(function() {
      var cache = server.cache({
        expiresIn: TWO_WEEKS,
        segment: '|sessions'
      });

      server.app.cache = cache;

      server.auth.strategy('session', 'cookie', 'required', {
        password: process.env.SESSION_PASSWORD,
        appendNext: 'done',
        redirectTo: '/login',
        cookie: process.env.SESSION_COOKIE,
        clearInvalid: true,
        validateFunc: function(session, cb) {
          P.promisify(cache.get, {context: cache})(session.sid).catch(function(err) {
            cb(err, false);
          }).spread(function(item, cached) {
            if (!cached) {
              cb(null, false);
            } else {
              cb(null, true, item);
            }
          });
        }
      });

    }).then(function() {
      var plugins = require('./../adapters/plugins');

      return P.promisify(server.register, {context: server})(plugins).then(function() {
        server.views({
          engines: {
            hbs: require('handlebars')
          },
          relativeTo: path.resolve(__dirname, '..'),
          path: './templates',
          helpersPath: './templates/helpers',
          layoutPath: './templates/layouts',
          partialsPath: './templates/partials',
          isCached: process.env.NODE_ENV != 'dev',
          layout: 'default'
        });

        server.route(require('./../routes/index'));
      }).then(function() {
        return P.promisify(server.start, {context: server})();
      }).then(function() {
        return server;
      });
    });
  });
}
