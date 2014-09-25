var path = require('path'),
    log = require('bole')('ops');

module.exports = {
  ping: function (request, reply) {
    return reply('OK').code(200);
  },

  status: function (appVersion) {
    return function (request, reply) {
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
  },

  csplog: function (request, reply) {
    var data = request.payload;

    try {
      data = JSON.parse(data);
    } catch (ex) {
      data = {msg: data};
    }

    log.warn('content-security-policy validation', data);
    return reply('OK').code(200);
  }
}
