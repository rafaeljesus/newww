var metrics = require('../../adapters/metrics')();

module.exports = function About (options) {
  return function (request, reply) {
    var timer = { start: Date.now() };

    var deps = [];
    for(var i in options.package.dependencies) {
      var obj = {};
      obj.name = i;
      obj.version = options.package.dependencies[i];
      deps.push(obj);
    }

    var contributors = [];

    options.contributors.trim().split('\n').forEach(function (c) {
      if (c.indexOf('<') !== -1) {
        contributors.push(c.split('<')[0]);
      }
    });

    var opts = {
      user: request.auth.credentials,
      title: 'About',
      hiring: request.server.methods.hiring.getRandomWhosHiring(),
      package: options.package,
      dependencies: deps,
      HEAD: options.HEAD,
      HEADabbrev: options.HEAD && options.HEAD.substr(0,6),
      registry: options.registry,
      registryCouch: options.registryCouch,
      nodev: process.version,
      contributors: contributors,
    }

    timer.end = Date.now();
    metrics.addPageLatencyMetric(timer, 'about');
    metrics.addMetric({name: 'about'});
    reply.view('about', opts);
  };
};