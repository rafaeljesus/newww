var Hapi = require('hapi'),
    Emitter = require('numbat-emitter'),
    os = require('os');

exports.register = function Metrics (service, options, next) {
  var emitter = new Emitter({
    host: options.collector.host,
    port: options.collector.port,
    node: os.hostname()
  });

  service.method('addMetric', function (obj) {
    emitter.metric(obj);
    return;
  });

  service.method('addCouchLatencyMetric', function (timer, action) {
    emitter.metric({
      name: 'latency',
      value: timer.end - timer.start,
      type: 'couch',
      action: action
    });
    return;
  });

  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};