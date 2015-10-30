var Emitter = require('numbat-emitter'),
  os = require('os'),
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
      node: os.hostname(),
      app:app, // optional.
    });
    // add port field to defaults to distinguish between multiple workers
    emitter.defaults.port = (process.env.PORT||'0');
  }

  return emitter;
};

function StubMetricsEmitter() {}
StubMetricsEmitter.prototype.metric = function() {};
