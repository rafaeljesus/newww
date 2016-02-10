
exports.register = function npmE(server, options, next) {

  server.method('npme.getLicenses', require('./methods/getLicenses'));

  server.method('npme.getLicense', require('./methods/getLicense'));

  server.method('npme.sendData', require('./methods/sendData'));

  server.method('npme.updateCustomer', require('./methods/updateCustomer'));

  server.method('npme.verifyTrial', require('./methods/verifyTrial'));

  return next();
};

exports.register.attributes = {
  name: "newww-service-npme",
  version: "1.0.0"
};


