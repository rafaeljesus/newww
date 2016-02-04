var tap = require('tap');
var urlOf = require('./lib/url');
var pass = require('./lib/pass');

tap.test("Sign up a user", function(t) {
  return require('./lib/sharedNemo').then(function(nemo) {
    var desiredUsername = nemo.state.desiredUsername || 'test-' + Date.now();
    t.pass("Signing up " + desiredUsername);
    return nemo.driver.get(urlOf('/'))
      .then(() => nemo.view.nav.signupLink().click())
      .then(() => nemo.view.signup.usernameWaitVisible().sendKeys(desiredUsername))
      .then(() => nemo.view.signup.password().sendKeys('test123'))
      .then(() => nemo.view.signup.verify().sendKeys('test123'))
      .then(() => nemo.view.signup.email().sendKeys('blackhole+' + desiredUsername + '@npmjs.com'))
      .then(() => nemo.view.signup.makeItSo().click())
      .then(() => nemo.view.page.h1WaitVisible())
      .then(() => nemo.view.page.h1TextEquals("edit your profile"))
      .then(t.pass)
      .then(() => nemo.view.nav.username().getText().then(text => {
        t.ok(text, 'username is shown');
        nemo.state.username = text;
        t.pass("signed up " + text);
      }))
      .then(function() {
        if (!module.parent) {
          return nemo.driver.quit();
        }
      });
  });
});
