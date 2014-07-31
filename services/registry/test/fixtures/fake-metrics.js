exports.register = function Metrics (service, options, next) {

  service.method('metrics.addMetric', function (obj) {
    return;
  });

  service.method('metrics.addCouchLatencyMetric', function (timer, action) {
    return;
  });

  next();
};

exports.register.attributes = {
  name: 'newww-service-metrics',
  version: '0.0.1'
};