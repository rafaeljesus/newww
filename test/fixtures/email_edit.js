var bob = require('./users').bob,
    newEmail = 'new@boom.me';

module.exports = function (cookieCrumb) {
  return {
    newEmail: {
      name: bob.name,
      password: '12345',
      email: newEmail,
      crumb: cookieCrumb
    },
    missingEmail: {
      name: bob.name,
      password: '12345',
      crumb: cookieCrumb
    },
    invalidEmail: {
      name: bob.name,
      password: '12345',
      email: 'blarg@boom',
      crumb: cookieCrumb
    },
    invalidPassword: {
      name: bob.name,
      password: 'password',
      email: newEmail,
      crumb: cookieCrumb
    }
  };
};