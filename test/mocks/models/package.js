var _ = require('lodash');

var Package = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.USER_API,
    presenter: true,
    debug: false,
    bearer: false,
    request: false
  }, opts);

  return this;
};

var fixtures = {
  hello: {
    "versions": ["1.3.0"],
    "name": "hello",
    "dependents": [
      "connect-orientdb",
      "graphdb-orient"
    ],
    "publisher": {
      "name": "ohai",
      "email": "ohai@email.com"
    },
    "dependencies": {
      "lodash": "*"
    },
    "devDependencies": {
      "async": "*",
      "tap": "0.4"
    },
    "stars": ['fakeuser'],
    "maintainers": [{
      "name": "ohai",
      "email": "ohai@email.com"
    }],
    "version": "1.3.0",
    "last_published_at": "2013-06-11T09:36:32.285Z"
  },
  notfound: null,
  unpublished: {}
};

Package.prototype.get = function (name, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  return callback(null, fixtures[name]);
};