var tap = require('tap');
var urlOf = require('./lib/url');
var pass = require('./lib/pass');
var P = require('bluebird');

require('./lib/sharedNemo').then(function(nemo) {
  tap.test('sign up for on-site trial', {
    bail: true
  }, function(t) {
    return P.resolve(nemo.driver.get(urlOf('/onsite'))).then(function() {
      return P.all([
        nemo.view.onsite.firstnameWaitVisible().then(pass(t, "form field visible")),
        nemo.view.onsite.firstname().sendKeys("Boops"),
        nemo.view.onsite.lastname().sendKeys("boops"),
        nemo.view.onsite.email().sendKeys("test+" + Date.now() + "@npmjs.com"),
        nemo.view.onsite.phone().sendKeys("415-857-5309"),
        nemo.view.onsite.company().sendKeys("yesallmen.com"),
        nemo.view.onsite.numemployees().sendKeys("2")
      ]);
    }).then(function() {
      return nemo.view.onsite.submit().click();
    }).then(function() {
      return P.all([
        nemo.view.onsite.agreementWaitVisible().then(pass(t, "navigated to second page")),
        nemo.view.onsite.agreement().sendKeys(" "),
        nemo.view.onsite.submitAgreement().click()
      ]);
    }).then(function() {
      return P.all([
        nemo.view.onsite.h2WaitVisible(),
        nemo.view.onsite.h2TextEquals('time to check your email').then(pass(t, 'confirmation found'))
      ]);
    }).then(function() {
      if (!module.parent) {
        return nemo.driver.quit();
      }
    }).catch(t.error).then(t.end);
  });
});
