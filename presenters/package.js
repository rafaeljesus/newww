var fmt = require('util').format,
    url = require('url'),
    isUrl = require('is-url'),
    gh = require('github-url-to-object'),
    normalizeLicenseData = require('normalize-license-data'),
    marky = require('marky-markdown'),
    presentUser = require("./user"),
    presentCollaborator = require("./collaborator");

module.exports = function (package) {

  delete package.maintainers

  package.scoped = package.name.charAt(0) === "@"
  package.encodedName = package.name.replace("/", "%2F")

  if (package.versions && package.versions.indexOf(package.version) === -1) {
    return Error('invalid package: '+ package.name);
  }

  package.license = normalizeLicenseData(package.license);
  if (!package.license) {
    delete package.license;
  }

  package.versionsCount = package.versions && Object.keys(package.versions).length;
  package.singleVersion = package.versionsCount === 1;

  if (package.publisher) {
    package.publisher = presentUser(package.publisher);
  }

  /* here's the potential situation: let's say I'm a hacker and I make a
  package that does Something Evil™ then I add you as a collaborators `npm
  adduser zeke evil-package` and then I publish the package and then I remove
  myself from the package so it looks like YOU are the one who made the
  package well, that's nasty so we blocked that from showing because
  hypothetically your friends would be like, hey! this evil-package from zeke
  looks awesome, let me use it! and then I get all their bank account numbers
  and get super duper rich and become a VC and create LinkedIn for Cats */

  package.lastPublisherIsACollaborator = Boolean(package.publisher)
    && Boolean(package.publisher.name)
    && Boolean(typeof package.collaborators === "object")
    && Boolean(package.collaborators[package.publisher.name])

  package.showCollaborators = package.collaborators
    && Object.keys(package.collaborators).length
    && package.lastPublisherIsACollaborator;

  if (package.collaborators) {
    Object.keys(package.collaborators).forEach(function(name){
      var collaborator = package.collaborators[name];
      collaborator = presentCollaborator(collaborator);
    })
  }

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
  if (package.repository && package.repository.url && gh(package.repository.url)) {
    package.repository.url = gh(package.repository.url).https_url;
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

  // Process README
  if (typeof package.readme === "string") {
    package.readme = marky(package.readme, {package: package}).html();
  }

  // Parse description as markdown
  if (typeof package.description === "string") {
    package.description = marky.parsePackageDescription(package.description)
  }

  return package;
};

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
