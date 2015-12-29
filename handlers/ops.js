var utils = require('../lib/utils');

module.exports = {
  ping: function(request, reply) {
    return reply('ok').code(200);
  },

  status: function(appVersion) {
    return function(request, reply) {
      var info = {
        status: 'ok',
        pid: process.pid,
        app: process.title,
        host: process.env.SMF_ZONENAME,
        uptime: process.uptime(),
        version: appVersion,
        gitHead: require('../lib/git-head')()
      };

      return reply(info).code(200);
    };
  },

  csplog: function(request, reply) {
    if (!(request.payload && request.payload['csp-report'] && /^safari-extension:/.test(request.payload['csp-report']['source-file']))) {
      request.logger.warn('csp report');
      request.logger.warn(request.payload);
    }
    return reply('ok').code(200);
  }

};
