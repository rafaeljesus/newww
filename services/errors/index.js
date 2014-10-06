
exports.register = function Errors (service, options, next) {

  service.method('errors.showError', require('./methods/showError'));

  service.method('errors.generateWarning', require('./methods/generateWarning'));

  next();
};

exports.register.attributes = {
  name: "newww-service-errors",
  version: "1.0.0",
};