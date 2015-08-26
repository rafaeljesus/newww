var assert = require('assert'),
  Emitter = require('numbat-emitter'),
  os = require('os'),
  emitter;

var metrics = module.exports = function constructEmitter(app) {
  if (emitter) return emitter;

  emitter = new Emitter({
    uri: process.env.METRICS_URL || 'udp://localhost:3333',
    node: os.hostname(),
    app:app, // optional.
  });

  // add port field to defaults to distinguish between multiple workers
  emitter.defaults.port = (process.env.PORT||'0')

  return emitter;
};
