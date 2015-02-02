var fmt = require('util').format,
    moment = require('moment'),
    url = require('url'),
    ghurl = require('github-url-from-git'),
    gh = require('github-url-to-object'),
    avatar = require("../lib/avatar"),
    marky = require('marky-markdown');

module.exports = function presentPackage (data, request) {
  if (!request) {
    request = {
      logger: {
        error: console.error,
        info: console.log
      }
    };
  }

  var t = data.last_published_at;

  if (data.versions.indexOf(data.version) === -1) {
    request.logger.error('invalid package data: %s', data._id);
    return new Error('invalid package: '+ data._id);
  }

  data.fromNow = moment(t).fromNow();

  // check if publisher is in maintainers list
  data.publisherIsInMaintainersList = isPubInMaint(data);

  setLicense(data);

  data.showMaintainers = data.maintainers &&
                         data.maintainers.length > 1 &&
                         data.publisherIsInMaintainersList;

  data.versionsCount = data.versions && Object.keys(data.versions).length;
  data.singleVersion = data.versionsCount === 1;

  gravatarPeople(data);

  if (data.dependents) {
    data.dependents = processDependents(data.dependents, '/browse/depended/', data.name);
  }

  if (data.dependencies) {
    data.dependencies = processDependencies(data.dependencies);
  }

  // homepage: convert array to string
  if (data.homepage && Array.isArray(data.homepage)) {
    data.homepage = data.homepage[0];
  }

  // homepage: disallow non-string
  if (data.homepage && typeof data.homepage !== 'string') {
    delete data.homepage;
  }

  // homepage: discard if github repo URL
  if (data.homepage && url.parse(data.homepage).hostname.match(/^(www\.)?github\.com/i)) {
    delete data.homepage;
  }

  // repository: sanitize into https URL if it's a github repo
  if (data.repository && data.repository.url && ghurl(data.repository.url)) {
    data.repository.url = ghurl(data.repository.url);
  }

  // Create `npm install foo` command
  data.installCommand = fmt("npm install %s", data.name);
  if (data.preferGlobal) {
    data.installCommand += " -g";
  }

  // Infer GitHub API URL from bugs URL
  if (data.bugs && data.bugs.url && gh(data.bugs.url)) {
    data.ghapi = gh(data.bugs.url).api_url;
    data.pull_requests = {
      url: data.bugs.url.replace(/issues/, "pulls")
    };
  }

  // Get star count
  if (data.stars) {
    data.starCount = Object.keys(data.stars).length;
  }

  if (typeof data.readme === "string") {
    request.logger.info('sending ' + data.name + ' to marky-markdown');
    data.readme = marky(data.readme, {package: data}).html();
  }

  return data;
};

/* here's the potential situation: let's say I'm a hacker and I make a
package that does Something Evil™ then I add you as a maintainer `npm
adduser zeke evil-package` and then I publish the package and then I remove
myself from the package so it looks like YOU are the one who made the
package well, that's nasty so we blocked that from showing because
hypothetically your friends would be like, hey! this evil-package from zeke
looks awesome, let me use it! and then I get all their bank account numbers
and get super duper rich and become a VC and create LinkedIn for Cats */

function isPubInMaint (data) {
  if (data.maintainers && data.publisher) {
    for (var i = 0; i < data.maintainers.length; i++) {
      if (data.maintainers[i].name === data.publisher.name) {
        return true;
      }
    }
  }

  return false;
}

function gravatarPeople (data) {
  if (data.publisher) {
    data.publisher.avatar = avatar(data.publisher.email);
  }

  if (Array.isArray(data.maintainers)) {
    data.maintainers.forEach(function (maintainer) {
      maintainer.avatar = avatar(maintainer.email);
    });
  }
}

function setLicense (data) {
  var license = data.license;
  data.license = {};

  if (Array.isArray(license)) { license = license[0]; }

  if (typeof license === 'object') {
    if (license.type) { data.license.name = license.type; }
    if (license.name) { data.license.name = license.name; }
    if (license.url) { data.license.url = license.url; }
  }

  if (typeof license === 'string') {
    var parsedLicense = url.parse(license);
    if (parsedLicense && parsedLicense.protocol && parsedLicense.protocol.match(/^https?:$/)) {
      data.license.url = data.license.type = parsedLicense.href;
    } else {
      data.license.url = getOssLicenseUrlFromName(license);
      data.license.name = license;
    }
  }
}

function getOssLicenseUrlFromName (name) {
  var base = 'http://opensource.org/licenses/';

  var licenseMap = {
    'bsd': 'BSD-2-Clause',
    'mit': 'MIT',
    'x11': 'MIT',
    'mit/x11': 'MIT',
    'apache 2.0': 'Apache-2.0',
    'apache2': 'Apache-2.0',
    'apache 2': 'Apache-2.0',
    'apache-2': 'Apache-2.0',
    'apache': 'Apache-2.0',
    'gpl': 'GPL-3.0',
    'gplv3': 'GPL-3.0',
    'gplv2': 'GPL-2.0',
    'gpl3': 'GPL-3.0',
    'gpl2': 'GPL-2.0',
    'lgpl': 'LGPL-2.1',
    'lgplv2.1': 'LGPL-2.1',
    'lgplv2': 'LGPL-2.1'
  };

  return licenseMap[name.toLowerCase()] ?
         base + licenseMap[name.toLowerCase()] :
         base + name;
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
