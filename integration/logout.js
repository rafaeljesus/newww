var tap = require('tap');
var urlOf = require('./lib/url');
var P = require('bluebird');

require('./signup');

tap.test("Log out a user", function(t) {
  return require('./lib/sharedNemo').then(function(nemo) {
    return nemo.driver.get(urlOf('/'))
      .then(() => nemo.view.nav.logoutLink().click())
      .then(() => nemo.view.nav.loginLinkWaitVisible())
      .then(() => {
        if (!module.parent) {
          nemo.driver.quit();
        }
      });
  });
});
