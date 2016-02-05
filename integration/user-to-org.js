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
    return nemo.driver.get(urlOf('/org/create'))
      .then(() => nemo.view.createOrg.h1TextEquals('Create an Organization'))
      .then(() => t.pass("Got to the right page"))
      .then(() => nemo.view.createOrg.fullnameWaitVisible())
      .then(() => t.pass("Found form field"))
      .then(() => nemo.view.createOrg.fullname().sendKeys(nemo.state.desiredUsername + "-org"))
      .then(() => nemo.view.createOrg.orgScope().sendKeys(nemo.state.desiredUsername))
      .then(() => nemo.view.createOrg.createOrgFormSubmit().click())
      .then(() => nemo.view.createOrg.hintBlockWaitVisible())
      .then(() => t.pass("Transfer user hint block shown"))
      .then(() => nemo.view.createOrg.transferLink().click())
      .then(() => nemo.view.createOrg.h1WaitVisible())
      .then(() => t.pass("Transfer page navigated to"))
      .then(() => nemo.view.createOrg.h1TextEquals('Transfer your username'))
      .then(() => t.pass("Got to transfer page"))
      .then(() => nemo.view.createOrg.newUserInput().sendKeys(nemo.state.desiredUsername + "-admin"))
      .then(() => nemo.view.createOrg.transferSubmit().click())
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
      .then(() => nemo.view.createOrg.membersTabWaitVisible(30000))
      .then(() => t.pass("Org members page navigated to"))
      .then(() => nemo.view.createOrg.membersTab().click())
      .then(() => nemo.view.createOrg.orgInfoFirstUsernameWaitVisible())
      .then(() => t.pass("Username visible"))
      .then(() => nemo.view.nav.username().getText())
      .then(text => t.equals(text, nemo.state.desiredUsername + '-admin'))
      .then(() => t.pass("Username changed"))
      .then(() => nemo.view.createOrg.h1TextEquals('@' + nemo.state.desiredUsername))
      .then(() => t.pass("Org name matches username"))
      .then(() => nemo.view.createOrg.orgInfoFirstUsernameWaitVisible())
      .then(() => t.pass("Username visible"))
      .then(() => nemo.view.createOrg.orgInfoFirstUsername().getText())
      .then(text => t.equal(nemo.state.desiredUsername + "-admin", text))
      .then(function() {
        if (!module.parent) {
          return nemo.driver.quit();
        }
      });
  });
});

