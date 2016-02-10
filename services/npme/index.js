
exports.register = function npmE(server, options, next) {

  server.method('npme.verifyTrial', require('./methods/verifyTrial'));

  return next();
};

exports.register.attributes = {
  name: "newww-service-npme",
  version: "1.0.0"
};


