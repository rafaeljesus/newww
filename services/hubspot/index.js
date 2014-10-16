
exports.register = function Hubspot (service, options, next) {

  service.method('hubspot.postForm', require('./methods/postForm')(options));

  service.method('hubspot.getCustomer', require('./methods/getCustomer')(options));

  service.method('hubspot.createCustomer', require('./methods/createCustomer')(options));

  next();
};

exports.register.attributes = {
  name: "newww-service-hubspot",
  version: "1.0.0"
}


