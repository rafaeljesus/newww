var SECOND = 1000;

exports.register = function User (service, options, next) {

  var userMethods = require('./methods/user')(options, service);

  service.method('user.loginUser', userMethods.login);
  service.method('user.logoutUser', userMethods.logout);

  service.method('user.getUser', require('./methods/getUser'), {
    cache: { expiresIn: 60 * SECOND, segment: '##user' }
  });

  service.method('user.lookupUserByEmail', require('./methods/emailLookup'));

  service.method('user.signupUser', require('./methods/signupUser'));

  service.method('user.saveProfile', require('./methods/saveProfile'));

  service.method('user.changePass', require('./methods/changePass'));

  service.method('user.changeEmail', require('./methods/changeEmail')(service));

  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};