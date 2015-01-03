
exports.register = function npmE (service, options, next) {

  service.method('npme.createCustomer', require('./methods/createCustomer')(options.license));

  service.method('npme.createTrial', require('./methods/createTrial')(options));

  service.method('npme.getCustomer', require('./methods/getCustomer')(options.license));

  service.method('npme.getLicenses', require('./methods/getLicenses')(options.license));

  service.method('npme.sendData', require('./methods/sendData')(options.license));

  service.method('npme.verifyTrial', require('./methods/verifyTrial')(options.license));

  next();
};

exports.register.attributes = {
  name: "newww-service-npme",
  version: "1.0.0"
};


