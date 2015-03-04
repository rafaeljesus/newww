var bob = require('./users').fakeusercouch,
    newEmail = 'new@fakeuser.com';

module.exports = function (cookieCrumb) {
  return {
    newEmail: {
      _id: bob._id,
      name: bob.name,
      password: '12345',
      email: newEmail,
      crumb: cookieCrumb
    },
    missingEmail: {
      _id: bob._id,
      name: bob.name,
      password: '12345',
      crumb: cookieCrumb
    },
    invalidEmail: {
      _id: bob._id,
      name: bob.name,
      password: '12345',
      email: 'blarg@boom',
      crumb: cookieCrumb
    },
    invalidPassword: {
      _id: bob._id,
      name: bob.name,
      password: 'password',
      email: newEmail,
      crumb: cookieCrumb
    }
  };
};