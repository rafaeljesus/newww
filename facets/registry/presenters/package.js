var marked = require('marked'),
    fmt = require('util').format,
    sanitizer = require('sanitizer'),
    gravatar = require('gravatar').url,
    moment = require('moment'),
    url = require('url'),
    ghurl = require('github-url-from-git'),
    similarity = require('similarity'),
    gh = require('github-url-to-object'),
    cheerio = require('cheerio'),
    log = require('bole')('registry-package-presenter');

module.exports = function package (data, cb) {

  if (data.time && data['dist-tags']) {
    var v = data['dist-tags'].latest
    var t = data.time[v]
    if (!data.versions[v]) {
      log.error('invalid package data: %s', data._id)
      return cb(new Error('invalid package: '+ data._id))
    }
    data.version = v
    // check to see if there's a newer version of the readme than
    // the one in the latest package
    if (data.versions[v].readme && data.time[v] === data.time.modified) {
      data.readme = data.versions[v].readme
      data.readmeSrc = null
    }
    data.fromNow = moment(t).fromNow()
    data._npmUser = data.versions[v]._npmUser || null

    // check if publisher is in maintainers list
    data.publisherIsInMaintainersList = isPubInMaint(data)

    setLicense(data, v)
  }

  data.showMaintainers = data.maintainers && data.publisherIsInMaintainersList

  if (data.showMaintainers && data.maintainers.length === 1) {
    data.singleMaintainer = true
  }

  if (data.readme && !data.readmeSrc) {
    data.readmeSrc = data.readme
    parseReadme(data, function (er, readme) {
      if (er) {
        return cb(er);
      }

      data.readme = readme;
    })
  }

  gravatarPeople(data)

  data.starredBy = getRandomAssortment(Object.keys(data.users || {}).sort(), '/browse/star/', data.name)
  data.dependents = getRandomAssortment(data.dependents, '/browse/depended/', data.name)

  data = elevateLatestVersionInfo(data);

  if (data.dependencies) {
    data.dependencies = processDependencies(data.dependencies);
  }

  // homepage: convert array to string
  if (data.homepage && Array.isArray(data.homepage)) {
    data.homepage = data.homepage[0]
  }

  // homepage: disallow non-string
  if (data.homepage && typeof data.homepage !== 'string') {
    delete data.homepage
  }

  // homepage: discard if github repo URL
  if (data.homepage && url.parse(data.homepage).hostname.match(/^(www\.)?github\.com/i)) {
    delete data.homepage
  }

  // repository: sanitize into https URL if it's a github repo
  if (data.repository && data.repository.url && ghurl(data.repository.url)) {
    data.repository.url = ghurl(data.repository.url)
  }

  // Create `npm install foo` command
  data.installCommand = fmt("npm install %s", data.name)
  if (data.preferGlobal) {
    data.installCommand += " -g"
  }

  // Infer GitHub API URL from bugs URL
  if (data.bugs && data.bugs.url && gh(data.bugs.url)) {
    data.ghapi = gh(data.bugs.url).api_url
    data.pull_requests = {
      url: data.bugs.url.replace(/issues/, "pulls")
    }
  }

  // Get star count
  if (data.users) {
    data.starCount = Object.keys(data.users).length
  }

  removeSuperfluousContentFromReadme(data)

  return cb(null, data);
}

function urlPolicy (pkgData) {
  var gh = pkgData && pkgData.repository ? ghurl(pkgData.repository.url) : null
  return function (u, effect, ltype, hints) {
    if (u.scheme_ === null && u.domain_ === null) {
      if (!gh) return null
      // temporary fix for relative links in github readmes, until a more general fix is needed
      var v = url.parse(gh)
      if (u.path_) {
        if (hints && hints.XML_TAG === 'a') {
          // if the tag is an anchor, we can link to the github html
          v.pathname = v.pathname + '/blob/master/' + u.path_;
        } else {
          // else we link to the raw file
          v.pathname = v.pathname + '/raw/master/' + u.path_;
        }
      }
      u = {
        protocol: v.protocol,
        host: v.host,
        pathname: v.pathname,
        query: u.query_,
        hash: u.fragment_
      }
    } else {
      u = {
        protocol: u.scheme_ + ':',
        host: u.domain_ + (u.port_ ? ':' + u.port_ : ''),
        pathname: u.path_,
        query: u.query_,
        hash: u.fragment_
      }
    }
    u = url.parse(url.format(u))
    if (!u) return null
    if (u.protocol === 'http:' &&
        (u.hostname && u.hostname.match(/gravatar.com$/))) {
      // use encrypted gravatars
      return url.format('https://secure.gravatar.com' + u.pathname)
    }
    return url.format(u)
  }
}

function parseReadme (data, cb) {
  var p
  if (typeof data.readmeFilename !== 'string' ||
      (data.readmeFilename.match(/\.(m?a?r?k?d?o?w?n?)$/i) &&
       !data.readmeFilename.match(/\.$/))) {
    try {
      p = marked.parse(data.readme);
    } catch (er) {
      return cb(new Error('error parsing readme'));
    }
    p = p.replace(/<([a-zA-Z]+)([^>]*)\/>/g, '<$1$2></$1>');
  } else {
    var p = data.readme
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
    p = '<pre>' + sanitizer.sanitize(p, urlPolicy(p)) + '</pre>'
  }
  return cb(null, sanitizer.sanitize(p, urlPolicy(data)));
}


/* here's the potential situation: let's say I'm a hacker and I make a
package that does Something Evil™ then I add you as a maintainer `npm
adduser zeke evil-package` and then I publish the package and then I remove
myself from the package so it looks like YOU are the one who made the
package well, that's nasty so we blocked that from showing because
hypothetically your friends would be like, hey! this evil-package from zeke
looks awesome, let me use it! and then I get all their bank account numbers
and get super duper rich and become a VC and create LinkedIn for Cats */

function isPubInMaint (data) {
  if (data.maintainers && data._npmUser) {
    for (var i = 0; i < data.maintainers.length; i++) {
      if (data.maintainers[i].name === data._npmUser.name) {
        return true
      }
    }
  }

  return false
}

function gravatarPeople (data) {
  gravatarPerson(data.author)

  if (data._npmUser) gravatarPerson(data._npmUser)

  if (data.maintainers) data.maintainers.forEach(function (m) {
    gravatarPerson(m)
  })
  if (Array.isArray(data.contributors)) {
    data.contributors.forEach(function (m) {
      gravatarPerson(m)
    })
  }
}

function setLicense (data, v) {
  var latestInfo = data.versions[v], license

  if (latestInfo.license)
    license = latestInfo.license
  else if (latestInfo.licenses)
    license = latestInfo.licenses
  else if (latestInfo.licence)
    license = latestInfo.licence
  else if (latestInfo.licences)
    license = latestInfo.licences
  else
    return

  data.license = {}

  if (Array.isArray(license)) license = license[0]

  if (typeof license === 'object') {
    if (license.type) data.license.name = license.type
    if (license.name) data.license.name = license.name
    if (license.url) data.license.url = license.url
  }

  if (typeof license === 'string') {
    var parsedLicense = url.parse(license)
    if (parsedLicense && parsedLicense.protocol && parsedLicense.protocol.match(/^https?:$/)) {
      data.license.url = data.license.type = parsedLicense.href
    } else {
      data.license.url = getOssLicenseUrlFromName(license)
      data.license.name = license
    }
  }
}

function getOssLicenseUrlFromName (name) {
  var base = 'http://opensource.org/licenses/'

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
  }

  return licenseMap[name.toLowerCase()]
         ? base + licenseMap[name.toLowerCase()]
         : base + name
}

function gravatarPerson (p) {
  if (!p || typeof p !== 'object') {
    return
  }
  p.avatar = gravatar(p.email || '', {s:50, d:'retro'}, true)
  p.avatarMedium = gravatar(p.email || '', {s:100, d:'retro'}, true)
  p.avatarLarge = gravatar(p.email || '', {s:496, d:'retro'}, true)
}

function getRandomAssortment (items, urlRoot, name) {
  var l = items.length || 0;
  var MAX_SHOW = 20;

  if (l > MAX_SHOW) {
    items = items.sort(function (a, b) {
      return Math.random() * 2 - 1
    }).slice(0, MAX_SHOW);
    items.push({
      url: urlRoot + name,
      name: 'and ' + (l - MAX_SHOW) + ' more'
    })
  }

  return items;
}

function elevateLatestVersionInfo (data) {

  var l = data['dist-tags'] && data['dist-tags'].latest && data.versions && data.versions[data['dist-tags'].latest]
  if (l) {
    Object.keys(l).forEach(function (k) {
      data[k] = data[k] || l[k]
    })
  }

  return data;
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

function removeSuperfluousContentFromReadme (data) {
  if (typeof data.readme !== "string") return
  var $ = cheerio.load(data.readme)

  // Gratuitous Logos
  $("p:has(img[alt='Express Logo'])").addClass("superfluous");
  $("p:has(img[src*='gulp-2x.png'])").addClass("superfluous");

  // Badges
  [
    'badges.github.io',
    'ci.testling.com',
    'coveralls.io',
    'david-dm.org',
    'img.shields.io',
    'nodei.co',
    'saucelabs.com',
    'travis-ci.org'
  ].forEach(function(host){
    $("p:has(img[src*='//"+host+"'])").addClass("superfluous")
  })

  // Unruly H1s
  $("h1[id*='lo-dash']").addClass("superfluous")

  // H1 that closely matches package name
  var h1 = $('h1:not(.superfluous)').first()
  if (
    similarity(data.name, h1.text()) > 0.6 ||
    ~h1.text().toLowerCase().indexOf(data.name.toLowerCase())
  ) {
    h1.addClass("superfluous")
  }

  // p that closely matches package description
  var p = $('p:not(.superfluous)').first()
  if (similarity(data.description, p.text()) > 0.6) {
    p.addClass("superfluous")
  }

  data.readme = $.html()
}
