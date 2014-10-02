
exports.register = function Error (service, options, next) {

  service.method('error.generateError', require('./methods/generateError'));

  service.method('error.generateWarning', require('./methods/generateWarning'));

  next();
};

exports.register.attributes = {
  name: "newww-service-error",
  version: "1.0.0",
};