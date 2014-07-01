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

  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};