var SECOND = 1000;
var MINUTE = 60 * SECOND;

exports.register = function (service, options, next) {

  service.method('static.getPage', require('./methods/getPage'), {
    cache: {
      expiresIn: 5 * MINUTE,
      segment: '##staticpage'
    }
  });

  service.method('static.getPolicy', require('./methods/getPolicy'), {
    cache: {
      expiresIn: 5 * MINUTE,
      segment: '##staticpolicy'
    }
  });

  next();
}

exports.register.attributes = {
  name: 'newww-service-static',
  version: '1.0.0'
};