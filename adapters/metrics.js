var Emitter = require('numbat-emitter'),
    os = require('os'),
    metrics;

var Metrics = module.exports = function Metrics (options) {
  if (metrics) {
    return metrics;
  }

  this.client = new Emitter({
    host: options.collector.host,
    port: options.collector.port,
    udp: options.collector.udp,
    node: os.hostname()
  });

  var self = this;

  metrics = {
    addMetric: function (obj) {
      self.client.metric(obj);
    },

    addCouchLatencyMetric: function (timer, action) {
      self.client.metric({
        name: 'latency',
        value: timer.end - timer.start,
        type: 'couch',
        action: action
      });
    },

    addPageLatencyMetric: function (timer, page) {
      self.client.metric({
        name: 'latency',
        value: timer.end - timer.start,
        type: 'pageload',
        page: page
      });
    }

  };

  return metrics;
}