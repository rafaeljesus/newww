var path = require('path');
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
  console.log(request)
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
