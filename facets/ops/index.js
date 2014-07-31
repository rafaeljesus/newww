var path = require('path'),
    log = require('bole')('ops')
var appVersion;

exports.register = function Company (facet, options, next) {

  appVersion = options;

  facet.views({
    engines: { hbs: require('handlebars') },
    path: path.resolve(__dirname, 'templates'),
  });

  facet.route({
    path: "/ping",
    method: "GET",
    handler: ping
  });

  facet.route({
    path: "/status",
    method: "GET",
    handler: status
  });

  facet.route({
    path: "/-/csplog",
    method: "POST",
    handler: csplog
  });

  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};

// ===== functions =====

function ping (request, reply) {
  return reply('OK').code(200);
}

function status (request, reply) {
  var info = {
    status:   'OK',
    pid:      process.pid,
    app:      process.title,
    host:     process.env.SMF_ZONENAME,
    uptime:   process.uptime(),
    version:  appVersion
  };

  return reply(info).code(200);
}

function csplog (request, reply) {
  var data = request.payload;

  try {
    data = JSON.parse(data);
  } catch (ex) {
    data = {msg: data};
  }

  log.warn('content-security-policy validation', data);
  return reply('OK').code(200);
}