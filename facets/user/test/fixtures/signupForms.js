module.exports = {
  incomplete: {
    name: 'blargh',
    password: '12345'
  },
  badEmail: {
    name: 'blargh',
    password: '12345',
    verify: '12345',
    email: 'goawaynsa'
  },
  badUsernameDot: {
    name: '.blargh',
    password: '12345',
    verify: '12345',
    email: 'blargh@boom.com'
  },
  badUsernameCaps: {
    name: 'BLargh',
    password: '12345',
    verify: '12345',
    email: 'blargh@boom.com'
  },
  badUsernameEncodeURI: {
    name: 'blärgh',
    password: '12345',
    verify: '12345',
    email: 'blargh@boom.com'
  },
  invalidPassMatch: {
    name: 'blargh',
    password: '12345',
    verify: '12355',
    email: 'blargh@boom.com'
  },
  good: {
    name: 'blargh',
    password: '12345',
    verify: '12345',
    email: 'blargh@boom.com'
  },
  goodPassWithUmlaut: {
    name: 'blargh',
    password: 'one two threë',
    verify: 'one two threë',
    email: 'blargh@boom.com'
  }
}