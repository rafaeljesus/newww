
exports.register = function Errors (service, options, next) {

  service.method('errors.showError', require('./methods/showError'));

  next();
};

exports.register.attributes = {
  name: "newww-service-errors",
  version: "1.0.0",
};