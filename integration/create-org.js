var tap = require('tap');
var urlOf = require('./lib/url');

require('./lib/sharedNemo').then(function(nemo) {
  nemo.state.desiredUsername = "test-org-" + Date.now();
  nemo.state.desiredOrgScope = "test-org-scope" + Date.now();
  require('./signup');

  tap.test('create org', {
    bail: true
  }, function(t) {
    return nemo.driver.get(urlOf('/org/create'))
      .then(() => nemo.view.createOrg.h1TextEquals('Create an Organization'))
      .then(() => t.pass("Got to the right page"))
      .then(() => nemo.view.createOrg.fullnameWaitVisible())
      .then(() => t.pass("Found form field"))
      .then(() => nemo.view.createOrg.fullname().sendKeys(nemo.state.desiredUsername + "-org"))
      .then(() => nemo.view.createOrg.orgScope().sendKeys(nemo.state.desiredOrgScope))
      .then(() => nemo.view.createOrg.createOrgFormSubmit().click())

      .then(() => nemo.view.createOrg.h1WaitVisible())
      .then(() => t.pass("Billing org page navigated to"))
      .then(() => nemo.view.createOrg.h1TextEquals('Billing information'))
      .then(() => nemo.view.createOrg.cardNumber().sendKeys('4242 4242 4242 4242'))
      .then(() => t.pass("card number entered"))
      .then(() => nemo.view.createOrg.cardCVC().sendKeys('434'))
      .then(() => t.pass("cvc entered"))
      .then(() => nemo.view.createOrg.cardExpMonth().sendKeys('8'))
      .then(() => t.pass("expiration month entered"))
      .then(() => nemo.view.createOrg.cardExpYear().sendKeys(new Date().getFullYear() + 3))
      .then(() => t.pass("exp year entered"))
      .then(() => nemo.view.createOrg.paymentFormSubmit().click())
      .then(() => nemo.view.createOrg.h2WaitVisible(30000))
      .then(() => t.pass("Packages header visible"))
      .then(() => nemo.view.createOrg.h2TextEquals('0 packages'))
      .then(() => nemo.view.nav.username().getText().then(text => t.equals(text, nemo.state.desiredUsername)))
      .then(() => t.pass("Username correct"))
      .then(() => nemo.view.createOrg.h1TextEquals("@" + nemo.state.desiredOrgScope))
      .then(() => t.pass("Org name correct"))
      .then(function() {
        if (!module.parent) {
          return nemo.driver.quit();
        }
      });
  });
});
