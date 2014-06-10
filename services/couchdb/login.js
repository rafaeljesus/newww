module.exports = function (service, anonCouch) {
  return function (loginDetails, next) {
    anonCouch.login(loginDetails, function (er, cr, couchSession) {
      if (er) {
        return next (new Error(er));
      }

      if (cr.statusCode !== 200) {
        return next(new Error('Username and/or Password is wrong'));
      }
      // console.log(couchSession)
      service.methods.getUserFromCouch(loginDetails.name, function (err, data) {
        // console.log(data)
        return next(null, data);
      });
    });

  };
};