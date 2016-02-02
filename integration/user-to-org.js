var tap = require('tap');
var urlOf = require('./lib/url');
var pass = require('./lib/pass');
var P = require('bluebird');

require('./lib/sharedNemo').then(function(nemo) {
  nemo.state.desiredUsername = "test-org-" + Date.now();
  require('./signup');

  tap.test('convert user to org', {
    bail: true
  }, function(t) {
    return nemo.driver.get(urlOf('/org/create')).then(() => P.all([
        nemo.view.createOrg.h1TextEquals('Create an Organization').then(() => t.pass("Got to the right page")),
        nemo.view.createOrg.fullnameWaitVisible().then(() => t.pass("Found form field")),
        nemo.view.createOrg.fullname().sendKeys(nemo.state.desiredUsername + "-org"),
        nemo.view.createOrg.orgScope().sendKeys(nemo.state.desiredUsername),
        nemo.view.createOrg.createOrgFormSubmit().click()
      ]).then(function() {
        return P.all([
          nemo.view.createOrg.hintBlockWaitVisible().then(() => t.pass("Transfer user hint block shown")),
          nemo.view.createOrg.transferLink().click()
        ]);
      }).then(function() {
        return P.all([
          nemo.view.createOrg.h1WaitVisible().then(() => t.pass("Transfer page navigated to")),
          nemo.view.createOrg.h1TextEquals('Transfer your username').then(() => t.pass("Got to transfer page")),
          nemo.view.createOrg.newUserInput().sendKeys(nemo.state.desiredUsername + "-admin"),
          nemo.view.createOrg.transferSubmit().click()
        ]);
      }).then(function() {
        return P.all([
          nemo.view.createOrg.h1WaitVisible().then(() => t.pass("Billing org page navigated to")),
          nemo.view.createOrg.h1TextEquals('Billing information'),
          nemo.view.createOrg.cardNumber().sendKeys('4242 4242 4242 4242').then(() => t.pass("card number entered")),
          nemo.view.createOrg.cardCVC().sendKeys('434').then(() => t.pass("cvc entered")),
          nemo.view.createOrg.cardExpMonth().sendKeys('8').then(() => t.pass("expiration month entered")),
          nemo.view.createOrg.cardExpYear().sendKeys(new Date().getFullYear() + 3).then(() => t.pass("exp year entered")),
          nemo.view.createOrg.paymentFormSubmit().click()
        ]);
      }).then(function() {
        return P.all([
          nemo.view.createOrg.membersTabWaitVisible().then(() => t.pass("Org members page navigated to")),
          nemo.view.createOrg.membersTab().click()
        ]);
      }).then(function() {
        return P.all([
          nemo.view.createOrg.orgInfoFirstUsernameWaitVisible().then(() => t.pass("Username visible")),
          nemo.view.nav.username().getText().then(textEquals(t, nemo.state.desiredUsername + '-admin')).then(() => t.pass("Username changed")),
          nemo.view.createOrg.h1TextEquals('@' + nemo.state.desiredUsername).then(() => t.pass("Org name matches username")),
          nemo.view.createOrg.orgInfoFirstUsernameWaitVisible().then(() => t.pass("Username visible")),
          nemo.view.createOrg.orgInfoFirstUsername().getText().then(function(text) {
            t.equal(nemo.state.desiredUsername + "-admin", text);
          }),
        ]);
      }).then(function() {
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
