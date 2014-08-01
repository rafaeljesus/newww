var CouchLogin = require('couch-login');

module.exports = {

  anonCouch: this.anonCouch,

  adminCouch: this.adminCouch,

  init: function (options) {
    if (options.couchAuth) {
      var ca = options.couchAuth.split(':'),
          name = ca.shift(),
          password = ca.join(':'),
          auth = { name: name, password: password };

      // the admin couch uses basic auth, or couchdb freaks out eventually
      this.adminCouch = new CouchLogin(options.registryCouch, 'basic');
      this.adminCouch.strictSSL = false;
      this.adminCouch.login(auth, function (er, cr, data) {
        if (er) throw er;
      });
    }

    this.anonCouch = new CouchLogin(options.registryCouch, NaN);
  }
}
