var _ = require('lodash'),
    cache = require('../lib/cache'),
    fmt = require('util').format,
    gh = require('github-url-to-object'),
    isUrl = require('is-url'),
    marky = require('marky-markdown'),
    metrics = require('../adapters/metrics')(),
    normalizeLicenseData = require('normalize-license-data'),
    P = require('bluebird'),
    presentCollaborator = require("./collaborator"),
    presentUser = require("./user"),
    url = require('url');

var MINUTES = 60; // seconds
var CACHE_TTL = 5 * MINUTES;

module.exports = function (pkg) {

  delete pkg.maintainers;

  pkg.scoped = pkg.name.charAt(0) === "@";
  pkg.encodedName = pkg.name.replace("/", "%2F");

  if (pkg.versions && pkg.versions.indexOf(pkg.version) === -1) {
    return Error('invalid pkg: '+ pkg.name);
  }

  pkg.license = normalizeLicenseData(pkg.license);
  if (!pkg.license) {
    delete pkg.license;
  }

  pkg.versionsCount = pkg.versions && Object.keys(pkg.versions).length;
  pkg.singleVersion = pkg.versionsCount === 1;

  if (pkg.publisher) {
    pkg.publisher = presentUser(pkg.publisher);
  }

  /* here's the potential situation: let's say I'm a hacker and I make a
  package that does Something Evil™ then I add you as a collaborator `npm
  adduser isaacs evil-pkg` and then I publish the package and then I remove
  myself from the package so it looks like YOU are the one who made the
  package well, that's nasty so we blocked that from showing because
  hypothetically your friends would be like, hey! this evil-pkg from isaacs
  looks awesome, let me use it! and then I get all their bank account numbers
  and get super duper rich and become a VC and create LinkedIn for Cats */

  pkg.lastPublisherIsACollaborator = Boolean(pkg.publisher) &&
    Boolean(pkg.publisher.name) &&
    Boolean(typeof pkg.collaborators === "object") &&
    Boolean(pkg.collaborators[pkg.publisher.name]);

  pkg.showCollaborators = pkg.collaborators &&
    Object.keys(pkg.collaborators).length &&
    pkg.lastPublisherIsACollaborator;

  if (pkg.collaborators) {
    Object.keys(pkg.collaborators).forEach(function(name){
      var collaborator = pkg.collaborators[name];
      collaborator = presentCollaborator(collaborator);
    });
  }

  if (pkg.dependents) {
    pkg.dependents = processDependents(pkg.dependents, '/browse/depended/', pkg.name);
  }

  if (pkg.dependencies) {
    pkg.dependencies = processDependencies(pkg.dependencies);
  }

  // homepage: convert array to string
  if (pkg.homepage && Array.isArray(pkg.homepage)) {
    pkg.homepage = pkg.homepage[0];
  }

  // homepage: disallow non-URLs
  if (pkg.homepage && !isUrl(pkg.homepage)) {
    delete pkg.homepage;
  }

  // homepage: discard if github repo URL
  if (pkg.homepage && url.parse(pkg.homepage).hostname.match(/^(www\.)?github\.com/i)) {
    delete pkg.homepage;
  }

  // repository: sanitize into https URL if it's a github repo
  if (pkg.repository && pkg.repository.url && gh(pkg.repository.url)) {
    pkg.repository.url = gh(pkg.repository.url).https_url;
  }

  // Create `npm install foo` command
  // Shorten to `npm i` for long pkg names
  var installWord = (pkg.name.length > 15) ? "i" : "install";
  var globalFlag = pkg.preferGlobal ? "-g" : "";
  pkg.installCommand = fmt("npm %s %s %s", installWord, globalFlag, pkg.name)
    .replace(/\s+/g, " ")
    .trim();

  // Infer GitHub API URL from bugs URL
  if (pkg.bugs && pkg.bugs.url && gh(pkg.bugs.url)) {
    pkg.ghapi = gh(pkg.bugs.url).api_url;
    pkg.pull_requests = {
      url: pkg.bugs.url.replace(/issues/, "pulls")
    };
  }

  // Get star count
  if (pkg.stars) {
    pkg.starCount = Object.keys(pkg.stars).length;
  }

  var actions = {
    readme: processReadme(pkg),
    description: processDescription(pkg)
  };

  return P.props(actions)
  .then(function (results) {
    pkg.readme = results.readme;
    pkg.description = results.description;
    return pkg;
  });
};

function processReadme (pkg) {
  if (!_.isString(pkg.readme)) {
    return P.resolve('');
  }

  var cacheKey = pkg.name + '_readme';

  return new P(function(resolve, reject) {
    cache.getKey(cacheKey, function (err, readme) {
      if (err) {
        return reject(err);
      }

      if (readme) {

        metrics.metric({
          name: 'cache.readme.hit',
          package: pkg.name,
          value: 1
        });

        return resolve(readme);
      } else {

        readme = marky(pkg.readme, {package: pkg}).html();
        cache.setKey(cacheKey, CACHE_TTL, readme);

        metrics.metric({
          name: 'cache.readme.miss',
          package: pkg.name,
          value: 1
        });

        return resolve(readme);
      }
    });
  });
}

function processDescription (pkg) {
  if (typeof pkg.description !== "string") {
    return P.resolve('');
  }

  // Parse description as markdown
  var cacheKey = pkg.name + '_desc';

  return new P(function (resolve, reject) {
    cache.getKey(cacheKey, function (err, description) {
      if (err) { return reject(err); }

      if (description) {
        return resolve(description);
      } else {
        description = marky.parsePackageDescription(pkg.description);
        cache.setKey(cacheKey, CACHE_TTL, description);
        return resolve(description);
      }
    });
  });
}

function processDependents (items, urlRoot, name) {
  if (!items.length) { return items; }

  items = items.map(function (i) {
    return {
      name: i,
      url: '/package/' + i
    };
  });

  var l = items.length || 0;
  var MAX_SHOW = 20;

  if (l > MAX_SHOW) {
    items = items.sort(function (a, b) {
      return Math.random() * 2 - 1;
    }).slice(0, MAX_SHOW);
    items.push({
      url: urlRoot + name,
      name: 'and ' + (l - MAX_SHOW) + ' more'
    });
  }

  return items;
}

function processDependencies (dependencies, max) {
  var MAX_DEPS = max || 50;
  var deps = Object.keys(dependencies || {});
  var len = deps.length;
  if (len > MAX_DEPS) {
    deps = deps.slice(0, MAX_DEPS);
    deps.push({
      noHref: true,
      text: 'and ' + (len - MAX_DEPS) + ' more'
    });
  }
  return deps;
}
