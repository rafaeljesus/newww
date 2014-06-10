var CouchLogin = require('couch-login'),
    Hapi = require('hapi'),
    SECOND = 1000;

exports.register = function Couch (service, options, next) {
  var adminCouch, anonCouch;

  if (options.couchAuth) {
    var ca = options.couchAuth.split(':'),
        name = ca.shift(),
        password = ca.join(':'),
        auth = { name: name, password: password };

    // the admin couch uses basic auth, or couchdb freaks out eventually
    // 10 JUN 2014 [RV]: Do we even need this?? Is adminCouch used *anywhere*?
    adminCouch = new CouchLogin(options.registryCouch, 'basic');
    adminCouch.strictSSL = false;
    adminCouch.login(auth, function (er, cr, data) {
      if (er) throw er;
    });
  }

  anonCouch = new CouchLogin(options.registryCouch, NaN);

  service.method('getPackageFromCouch', function (package, next) {
    anonCouch.get('/registry/' + package, function (er, cr, data) {
      next(er, data);
    });
  }, {
    cache: { expiresIn: 60 * SECOND, segment: '##package' }
  });

  service.method('getUserFromCouch', function (name, next) {
    anonCouch.get('/_users/org.couchdb.user:' + name, function (er, cr, data) {
      if (er || cr & cr.statusCode !== 200 || !data || data.error) {
        return next(Hapi.error.notFound(name))
      }

      return next(null, data)
    })
  }, {
    cache: { expiresIn: 60 * SECOND, segment: '##session' }
  });

  service.method('getBrowseData', require('./browse')(anonCouch), {
    cache: { expiresIn: 60 * SECOND, segment: '##browse' }
  });

  service.method('loginUser', require('./login')(service, anonCouch));

  service.method('signupUser', function (acct, next) {
    anonCouch.signup(acct, function (er, cr, data) {
      if (er || cr && cr.statusCode >= 400 || data && data.error) {
          var error = "Failed creating account.  CouchDB said: "
                    + ((er && er.message) || (data && data.error))

        return next(new Error(error));
      }

      return next(null, data);
    });
  });

  next();
}


