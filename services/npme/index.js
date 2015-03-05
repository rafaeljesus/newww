
exports.register = function npmE (server, options, next) {

  server.method('npme.createCustomer', require('./methods/createCustomer')(options.license));

  server.method('npme.createLicense', require('./methods/createLicense')(options.license));

  server.method('npme.createTrial', require('./methods/createTrial')(options));

  server.method('npme.getCustomer', require('./methods/getCustomer')(options.license));

  server.method('npme.getLicenses', require('./methods/getLicenses')(options.license));

  server.method('npme.getLicense', require('./methods/getLicense')(options.license));

  server.method('npme.sendData', require('./methods/sendData')(options.license));

  server.method('npme.updateCustomer', require('./methods/updateCustomer')(options.license));

  server.method('npme.verifyTrial', require('./methods/verifyTrial')(options.license));

  return next();
};

exports.register.attributes = {
  name: "newww-service-npme",
  version: "1.0.0"
};


