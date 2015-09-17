var SECOND = 1000;
var MINUTE = 60 * SECOND;

exports.register = function(server, options, next) {

  server.method('corp.getPage', require('./methods/getPage').static, {
    cache: {
      expiresIn: 5 * MINUTE,
      segment: '##staticpage',
      generateTimeout: false,
    }
  });

  server.method('corp.getPolicy', require('./methods/getPage').policy, {
    cache: {
      expiresIn: 5 * MINUTE,
      segment: '##staticpolicy',
      generateTimeout: false,
    }
  });

  return next();
}

exports.register.attributes = {
  name: 'newww-service-corp',
  version: '1.0.0'
};