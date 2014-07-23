var fakeuser = require('./users').fakeuser,
    newEmail = 'new@fakeuser.com';


module.exports = function (cookieCrumb) {
  return {
    newEmail: {
      _id: fakeuser._id,
      name: fakeuser.name,
      password: '12345',
      email: newEmail,
      crumb: cookieCrumb
    },
    missingEmail: {
      _id: fakeuser._id,
      name: fakeuser.name,
      password: '12345',
      crumb: cookieCrumb
    },
    invalidEmail: {
      _id: fakeuser._id,
      name: fakeuser.name,
      password: '12345',
      email: 'blarg@boom',
      crumb: cookieCrumb
    },
    invalidPassword: {
      _id: fakeuser._id,
      name: fakeuser.name,
      password: 'password',
      email: newEmail,
      crumb: cookieCrumb
    }
  }
}