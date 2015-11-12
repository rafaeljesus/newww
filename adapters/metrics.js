var Emitter = require('numbat-emitter'),
  emitter;

module.exports = function constructEmitter() {
  if (emitter) {
    return emitter;
  }

  if (!process.env.METRICS_URL) {
    emitter = new StubMetricsEmitter();
  }
  else {
    emitter = new Emitter({
      uri: process.env.METRICS_URL,
      app: 'newww',
      port: process.env.PORT || '0'
    });
  }

  return emitter;
};

function StubMetricsEmitter() {}
StubMetricsEmitter.prototype.metric = function() {};
