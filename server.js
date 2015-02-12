require("./lib/environment")()

var _       = require('lodash'),
    assert  = require('assert'),
    config  = require('./config.js'),
    Hapi    = require('hapi'),
    replify = require('replify');

// set up the logger
var bole = require('bole'),
    log = bole('server');

bole.output({
  level: 'info',
  stream: process.stdout
});

// Demand configuration that we require.
assert(config && _.isObject(config), 'we require a configuration object');
assert(config.host && config.port, 'config must include `host` and `port`');
assert(config.user && _.isObject(config.user), 'config must include a `user` stanza');
assert(config.user.mail && _.isObject(config.user.mail), 'config.user must include a `mail` stanza');
assert(config.user.mail.mailTransportModule && _.isString(config.user.mail.mailTransportModule), 'config must specify a `mailTransportModule`');
assert(config.user.mail.mailTransportSettings && _.isObject(config.user.mail.mailTransportSettings), 'config must include `mailTransportSettings`');
assert(config.user.mail.emailFrom && _.isString(config.user.mail.emailFrom), 'config must include a `emailFrom` settins');

// set up the server
var server = new Hapi.Server(config.server);
server.connection(config.connection);
server.views(config.views);

// configure couch
var couchDB = require('./adapters/couchDB');
couchDB.init(config.couch);

// configure metrics as a side effect
var metrics = require('./adapters/metrics')(config.metrics);

server.register(require('hapi-auth-cookie'), function (err) {
  if (err) { throw err; }

  var cache = server.cache({
    expiresIn: config.session.expiresIn,
    segment: '|sessions'
  });

  server.app.cache = cache;

  server.auth.strategy('session', 'cookie', 'required', {
    password: config.session.password,
    appendNext: 'done',
    redirectTo: '/login',
    cookie: config.session.cookie,
    clearInvalid: true,
    validateFunc: function (session, cb) {
      cache.get(session.sid, function (err, item, cached) {

        if (err) {
          return cb(err, false);
        }
        if (!cached) {
          return cb(null, false);
        }

        return cb(null, true, item);
      });
    }
  });

  var plugins = require('./adapters/plugins');
  server.register(plugins, function(err) {
    if (err) {
      // actually, if there's something wrong with plugin loading,
      // DO NOT PASS GO, DO NOT COLLECT $200. Throw the error.
      throw err;
    }

    replify({ name: 'www-'+config.port }, server, { 'config': config,  });
    log.info('server repl socket at /tmp/rpl/www-'+config.port+'.sock');

    server.route(require('./routes/index'));

    server.models = {
      Collaborator: require('./models/collaborator'),
      Customer: require('./models/customer'),
      User: require('./models/user'),
      Package: require('./models/package')
    };

    server.start(function() {
      metrics.metric({
        env: process.env.NODE_ENV,
        name: 'server.start'
      });

      log.info('Hapi server started @ ' + server.info.uri);
    });
  });
});
