var tap = require('tap');
var urlOf = require('./lib/url');

require('./lib/sharedNemo').then(function(nemo) {
  tap.test('sign up for on-site trial', {
    bail: true
  }, function(t) {
    return nemo.driver.get(urlOf('/onsite'))
      .then(() => nemo.view.onsite.firstnameWaitVisible())
      .then(() => t.pass("form field visible"))
      .then(() => nemo.view.onsite.firstname().sendKeys("Boops"))
      .then(() => nemo.view.onsite.lastname().sendKeys("boops"))
      .then(() => nemo.view.onsite.email().sendKeys("test+" + Date.now() + "@npmjs.com"))
      .then(() => nemo.view.onsite.phone().sendKeys("415-857-5309"))
      .then(() => nemo.view.onsite.company().sendKeys("yesallmen.com"))
      .then(() => nemo.view.onsite.numemployees().sendKeys("2"))
      .then(() => nemo.view.onsite.submit().click())
      .then(() => nemo.view.onsite.agreementWaitVisible())
      .then(() => t.pass("navigated to second page"))
      .then(() => nemo.view.onsite.agreement().sendKeys(" "))
      .then(() => nemo.view.onsite.submitAgreement().click())
      .then(() => nemo.view.onsite.h2WaitVisible())
      .then(() => nemo.view.onsite.h2TextEquals('time to check your email'))
      .then(() => t.pass('confirmation found'))
      .then(function() {
        if (!module.parent) {
          return nemo.driver.quit();
        }
      });
  });
});
