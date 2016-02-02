var tap = require('tap');
var urlOf = require('./lib/url');
var P = require('bluebird');

require('./lib/sharedNemo').then(function(nemo) {
  nemo.state.desiredUsername = "test-org-" + Date.now();
  nemo.state.desiredOrgScope = "test-org-scope" + Date.now();
  require('./signup');

  tap.test('create org', {
    bail: true
  }, function(t) {
    return nemo.driver.get(urlOf('/org/create'))
      .then(() => P.all([
          nemo.view.createOrg.h1TextEquals('Create an Organization').then(() => t.pass("Got to the right page")),
          nemo.view.createOrg.fullnameWaitVisible().then(() => t.pass("Found form field")),
          nemo.view.createOrg.fullname().sendKeys(nemo.state.desiredUsername + "-org"),
          nemo.view.createOrg.orgScope().sendKeys(nemo.state.desiredOrgScope)
        ])
          .then(() => nemo.view.createOrg.createOrgFormSubmit().click())
          .then(() => P.all([
              nemo.view.createOrg.h1WaitVisible().then(() => t.pass("Billing org page navigated to")),
              nemo.view.createOrg.h1TextEquals('Billing information'),
              nemo.view.createOrg.cardNumber().sendKeys('4242 4242 4242 4242').then(() => t.pass("card number entered")),
              nemo.view.createOrg.cardCVC().sendKeys('434').then(() => t.pass("cvc entered")),
              nemo.view.createOrg.cardExpMonth().sendKeys('8').then(() => t.pass("expiration month entered")),
              nemo.view.createOrg.cardExpYear().sendKeys(new Date().getFullYear() + 3).then(() => t.pass("exp year entered"))
            ]))
          .then(() => nemo.view.createOrg.paymentFormSubmit().click())
          .then(() => P.all([
              nemo.view.createOrg.h2WaitVisible(8000).then(() => t.pass("Packages header visible")),
              nemo.view.createOrg.h2TextEquals('0 packages'),
              nemo.view.nav.username().getText().then(textEquals(t, nemo.state.desiredUsername)).then(() => t.pass("Username correct")),
              nemo.view.createOrg.h1TextEquals("@" + nemo.state.desiredOrgScope).then(() => t.pass("Org name correct")),
            ])).then(function() {
          if (!module.parent) {
            return nemo.driver.quit();
          }
        }));
  });
});

function textEquals(t, expected) {
  return function(text) {
    t.equals(expected, text);
  };
}
