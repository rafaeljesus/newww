var SECOND = 1000;

exports.register = function User (server, options, next) {

  var userMethods = require('./methods/user')(options, server);

  server.method('user.loginUser', userMethods.login);
  server.method('user.logoutUser', userMethods.logout);

  server.method('user.getUser', require('./methods/getUser'), {
    cache: { expiresIn: 5 * 60 * SECOND, segment: '##user' }
  });

  server.method('user.lookupUserByEmail', require('./methods/emailLookup'));

  server.method('user.signupUser', require('./methods/signupUser'));

  server.method('user.saveProfile', require('./methods/saveProfile'));

  server.method('user.changePass', require('./methods/changePass'));

  server.method('user.changeEmail', require('./methods/changeEmail'));

  var sessionMethods = require('./methods/sessions');

  server.method('user.setSession', sessionMethods.set);
  server.method('user.delSession', sessionMethods.del);

  next();
};

exports.register.attributes = {
  "name": "newww-service-user",
  "version": "0.0.1",
};
