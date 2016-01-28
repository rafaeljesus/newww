var _ = require('lodash');
var cache = require('../lib/cache');
var decorate = require('../presenters/package');
var fmt = require('util').format;
var P = require('bluebird');
var request = require('../lib/external-request');
var qs = require('qs');
var USER_API = process.env.USER_API || "https://user-api-example.com";
var VError = require('verror');

var Package = module.exports = function(loggedInUser) {

  if (!(this instanceof Package)) {
    return new Package(loggedInUser);
  }

  this.bearer = loggedInUser && loggedInUser.name;

  return this;
};

Package.prototype.generatePackageOpts = function generatePackageOpts(name) {
  var opts = {
    url: fmt("%s/package/%s", USER_API, name.replace("/", "%2F")),
    json: true
  };

  if (this.bearer) {
    opts.headers = {
      bearer: this.bearer
    };
  }

  return opts;
};

Package.prototype.get = function(name) {
  var opts = this.generatePackageOpts(name);

  return cache.getP(opts).then(maybeUpgradeRRPackageData).tap(assertPackageIsWellFormed).then(decorate);

};

Package.prototype.dropCache = function dropCache(name) {
  return cache.dropP(this.generatePackageOpts(name));
};

Package.prototype.update = function(name, body) {

  var url = fmt("%s/package/%s", USER_API, name.replace("/", "%2F"));
  var opts = {
    method: "POST",
    url: url,
    json: true,
    body: _.pick(body, 'private') // remove all other props
  };

  // hapi is converting the private boolean to a string
  // so... yeah.
  if (opts.body && 'private' in opts.body) {
    opts.body.private = (String(opts.body.private) === "true");
  }

  if (this.bearer) {
    opts.headers = {
      bearer: this.bearer
    };
  }

  return this.dropCache(name)
    .then(function() {
      return new P(function(resolve, reject) {
        request(opts, function(err, resp, body) {
          if (err) {
            return reject(err);
          }
          if (resp.statusCode > 399) {
            err = new Error('error updating package ' + name);
            err.statusCode = resp.statusCode;
            return reject(err);
          }
          return resolve(body);
        });
      });
    })
    .then(function(_package) {
      return _package ? decorate(_package) : {
        package: name,
        updated: true
      };
    });
};

Package.prototype.list = function(options, ttl) {
  var url = fmt("%s/package?%s", USER_API, qs.stringify(options));

  var opts = {
    url: url,
    json: true,
    ttl: ttl || 500 // seconds
  };

  return cache.getP(opts).then(function upgradeRRResponse(result) {
    if (Array.isArray(result)) {
      return {
        results: result
      };
    } else {
      return result;
    }
  });
};

Package.prototype.count = function() {
  var url = fmt("%s/package/-/count", USER_API);
  var opts = {
    url: url,
    json: true
  };

  return cache.getP(opts);
};

Package.prototype.star = function(pkg) {

  var self = this;
  var url = fmt("%s/package/%s/star", USER_API, encodeURIComponent(pkg));
  var opts = {
    url: url,
    json: true,
  };

  if (self.bearer) {
    opts.headers = {
      bearer: self.bearer
    };
  }

  return this.dropCache(pkg)
    .then(function() {
      return new P(function(resolve, reject) {

        request.put(opts, function(err, resp) {
          if (err) {
            return reject(err);
          }
          if (resp.statusCode > 399) {
            err = new Error('error starring package ' + pkg);
            err.statusCode = resp.statusCode;
            return reject(err);
          }

          return resolve(pkg + ' starred by ' + self.bearer);
        });
      });
    });
};

Package.prototype.unstar = function(pkg) {

  var self = this;
  var url = fmt("%s/package/%s/star", USER_API, encodeURIComponent(pkg));
  var opts = {
    url: url,
    json: true,
  };

  if (self.bearer) {
    opts.headers = {
      bearer: self.bearer
    };
  }

  return this.dropCache(pkg)
    .then(function() {
      return new P(function(resolve, reject) {

        request.del(opts, function(err, resp) {
          if (err) {
            return reject(err);
          }

          if (resp.statusCode > 399) {
            err = new Error('error unstarring package ' + pkg);
            err.statusCode = resp.statusCode;
            return reject(err);
          }

          return resolve(pkg + ' unstarred by ' + self.bearer);
        });
      });
    });
};

function maybeUpgradeRRPackageData(pkg) {
  if (Object.keys(pkg).length === 1) {
    pkg = pkg[Object.keys(pkg)[0]];
    // registry-relational returns several important fields
    // stored on the latest release, rather than the top level.
    if (pkg['dist-tags'] && pkg['dist-tags'].latest && pkg.versions[pkg['dist-tags'].latest]) {
      _.extend(pkg, pkg.versions[pkg['dist-tags'].latest]);
    }
  }

  return pkg;
}

function assertPackageIsWellFormed(pkg) {
  if (!pkg || !pkg.name) {
    throw new VError("Package is not well formed: %j", pkg);
  }
}
