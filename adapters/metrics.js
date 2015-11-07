var Emitter = require('numbat-emitter'),
  emitter;

module.exports = function constructEmitter(app) {
  if (emitter) {
    return emitter;
  }

  if (!process.env.METRICS_URL) {
    emitter = new StubMetricsEmitter();
  }
  else {
    emitter = new Emitter({
      uri: process.env.METRICS_URL,
      app: app,
      port: process.env.PORT || '0'
    });
  }

  return emitter;
};

function StubMetricsEmitter() {}
StubMetricsEmitter.prototype.metric = function() {};
