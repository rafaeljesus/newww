module.exports = {
  incomplete: {
    name: 'fakeusercli',
    password: '12345'
  },
  badEmail: {
    name: 'fakeusercli',
    password: '12345',
    verify: '12345',
    email: 'goawaynsa'
  },
  badUsernameDot: {
    name: '.fakeusercli',
    password: '12345',
    verify: '12345',
    email: 'fakeusercli@boom.com'
  },
  badUsernameCaps: {
    name: 'FAkeusercli',
    password: '12345',
    verify: '12345',
    email: 'fakeusercli@boom.com'
  },
  badUsernameEncodeURI: {
    name: 'blärgh',
    password: '12345',
    verify: '12345',
    email: 'fakeusercli@boom.com'
  },
  invalidPassMatch: {
    name: 'fakeusercli',
    password: '12345',
    verify: '12355',
    email: 'fakeusercli@boom.com'
  },
  good: {
    name: 'fakeusercli',
    password: '12345',
    verify: '12345',
    email: 'fakeusercli@boom.com'
  },
  goodPassWithUmlaut: {
    name: 'fakeusercli',
    password: 'one two threë',
    verify: 'one two threë',
    email: 'fakeusercli@boom.com'
  }
}