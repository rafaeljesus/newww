
exports.register = function email (server, options, next) {

  server.method('email.send', require('./methods/send'));

  return next();
};

exports.register.attributes = {
  name: "newww-service-email",
  version: "1.0.0"
};


