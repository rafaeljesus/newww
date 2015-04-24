var SECOND = 1000;
var MINUTE = 60 * SECOND;
var HOUR = 60 * MINUTE;

exports.register = function User (server, options, next) {

  var sessionMethods = require('./methods/sessions');
  server.method('user.setSession', sessionMethods.set);
  server.method('user.delSession', sessionMethods.del);
  server.method('user.get', require('./methods/get'), {
    cache: {
      expiresIn: 4 * HOUR,
      segment: '##userget'
    }
  });

  next();
};

exports.register.attributes = {
  "name": "newww-service-user",
  "version": "1.0.0",
};
