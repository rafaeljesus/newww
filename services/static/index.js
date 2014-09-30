var SECOND = 1000;

exports.register = function (service, options, next) {

  service.method('static.getPage', require('./methods/getPage'), {
    cache: {
      staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
      staleIn: 60 * 60 * SECOND, // refresh after an hour
      segment: '##staticpage'
    }
  });

  service.method('static.getPolicy', require('./methods/getPolicy'), {
    cache: {
      staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
      staleIn: 60 * 60 * SECOND, // refresh after an hour
      segment: '##staticpolicy'
    }
  });

  next();
}

exports.register.attributes = {
  name: 'newww-service-static',
  version: '1.0.0'
};