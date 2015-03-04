module.exports = function (cookieCrumb) {
  return {
    incomplete: {
      name: 'fakeusercli',
      password: '12345',
      crumb: cookieCrumb
    },
    badEmail: {
      name: 'fakeusercli',
      password: '12345',
      verify: '12345',
      email: 'goawaynsa',
      crumb: cookieCrumb
    },
    badUsernameDot: {
      name: '.fakeusercli',
      password: '12345',
      verify: '12345',
      email: 'fakeusercli@boom.com',
      crumb: cookieCrumb
    },
    badUsernameCaps: {
      name: 'FAkeusercli',
      password: '12345',
      verify: '12345',
      email: 'fakeusercli@boom.com',
      crumb: cookieCrumb
    },
    badUsernameEncodeURI: {
      name: 'blärgh',
      password: '12345',
      verify: '12345',
      email: 'fakeusercli@boom.com',
      crumb: cookieCrumb
    },
    invalidPassMatch: {
      name: 'fakeusercli',
      password: '12345',
      verify: '12355',
      email: 'fakeusercli@boom.com',
      crumb: cookieCrumb
    },
    good: {
      name: 'newuser',
      password: '12345',
      verify: '12345',
      email: 'fakeusercli@boom.com',
      crumb: cookieCrumb
    },
    goodPassWithUmlaut: {
      name: 'newuser',
      password: 'one two threë',
      verify: 'one two threë',
      email: 'fakeusercli@boom.com',
      crumb: cookieCrumb
    },
    alreadyExists: {
      name: 'bob',
      password: '12345',
      verify: '12345',
      email: 'bob@boom.me',
      crumb: cookieCrumb
    }
  };
};