var fmt = require('util').format,
    moment = require('moment'),
    url = require('url'),
    isUrl = require('is-url'),
    ghurl = require('github-url-from-git'),
    gh = require('github-url-to-object'),
    avatar = require("../lib/avatar"),
    marky = require('marky-markdown');

module.exports = function (package) {

  var t = package.last_published_at;

  if (package.versions && package.versions.indexOf(package.version) === -1) {
    return new Error('invalid package: '+ package._id);
  }

  package.fromNow = moment(t).fromNow();

  // check if publisher is in maintainers list
  package.publisherIsInMaintainersList = isPubInMaint(package);

  setLicense(package);

  package.showMaintainers = package.maintainers &&
                         package.maintainers.length > 1 &&
                         package.publisherIsInMaintainersList;

  package.versionsCount = package.versions && Object.keys(package.versions).length;
  package.singleVersion = package.versionsCount === 1;

  gravatarPeople(package);

  if (package.dependents) {
    package.dependents = processDependents(package.dependents, '/browse/depended/', package.name);
  }

  if (package.dependencies) {
    package.dependencies = processDependencies(package.dependencies);
  }

  // homepage: convert array to string
  if (package.homepage && Array.isArray(package.homepage)) {
    package.homepage = package.homepage[0];
  }

  // homepage: disallow non-URLs
  if (package.homepage && !isUrl(package.homepage)) {
    delete package.homepage;
  }

  // homepage: discard if github repo URL
  if (package.homepage && url.parse(package.homepage).hostname.match(/^(www\.)?github\.com/i)) {
    delete package.homepage;
  }

  // repository: sanitize into https URL if it's a github repo
  if (package.repository && package.repository.url && ghurl(package.repository.url)) {
    package.repository.url = ghurl(package.repository.url);
  }

  // Create `npm install foo` command
  // Shorten to `npm i` for long package names
  var installWord = (package.name.length > 15) ? "i" : "install"
  var globalFlag = package.preferGlobal ? "-g" : ""
  package.installCommand = fmt("npm %s %s %s", installWord, globalFlag, package.name)
    .replace(/\s+/g, " ")
    .trim()

  // Infer GitHub API URL from bugs URL
  if (package.bugs && package.bugs.url && gh(package.bugs.url)) {
    package.ghapi = gh(package.bugs.url).api_url;
    package.pull_requests = {
      url: package.bugs.url.replace(/issues/, "pulls")
    };
  }

  // Get star count
  if (package.stars) {
    package.starCount = Object.keys(package.stars).length;
  }

  if (typeof package.readme === "string") {
    package.readme = marky(package.readme, {package: package}).html();
  }

  return package;
};

/* here's the potential situation: let's say I'm a hacker and I make a
package that does Something Evil™ then I add you as a maintainer `npm
adduser zeke evil-package` and then I publish the package and then I remove
myself from the package so it looks like YOU are the one who made the
package well, that's nasty so we blocked that from showing because
hypothetically your friends would be like, hey! this evil-package from zeke
looks awesome, let me use it! and then I get all their bank account numbers
and get super duper rich and become a VC and create LinkedIn for Cats */

function isPubInMaint (package) {
  if (package.maintainers && package.publisher) {
    for (var i = 0; i < package.maintainers.length; i++) {
      if (package.maintainers[i].name === package.publisher.name) {
        return true;
      }
    }
  }

  return false;
}

function gravatarPeople (package) {
  if (package.publisher) {
    package.publisher.avatar = avatar(package.publisher.email);
  }

  if (Array.isArray(package.maintainers)) {
    package.maintainers.forEach(function (maintainer) {
      maintainer.avatar = avatar(maintainer.email);
    });
  }
}

function setLicense (package) {
  var license = package.license;
  package.license = {};

  if (Array.isArray(license)) { license = license[0]; }

  if (typeof license === 'object') {
    if (license.type) { package.license.name = license.type; }
    if (license.name) { package.license.name = license.name; }
    if (license.url) { package.license.url = license.url; }
  }

  if (typeof license === 'string') {
    var parsedLicense = url.parse(license);
    if (parsedLicense && parsedLicense.protocol && parsedLicense.protocol.match(/^https?:$/)) {
      package.license.url = package.license.type = parsedLicense.href;
    } else {
      package.license.url = require("oss-license-name-to-url")(license);
      package.license.name = license;
    }
  }
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
