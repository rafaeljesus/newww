var SECOND = 1000;

exports.register = function User(server, options, next) {

  var sessionMethods = require('./methods/sessions');
  server.method('user.setSession', sessionMethods.set);
  server.method('user.delSession', sessionMethods.del);
  next();
};

exports.register.attributes = {
  "name": "newww-service-user",
  "version": "1.0.0",
};
