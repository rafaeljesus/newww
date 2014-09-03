module.exports = function (name, u, from) {

  var text = "You are receiving this because you (or someone else) have "
      + "requested the reset of the '"
      + name
      + "' npm user account.\r\n\r\n"
      + "Please click on the following link, or paste this into your "
      + "browser to complete the process:\r\n\r\n"
      + "    " + u + "\r\n\r\n"
      + "If you received this in error, you can safely ignore it.\r\n"
      + "The request will expire in an hour.\r\n\r\n"
      + "You can reply to this message, or email\r\n    "
      + from + "\r\nif you have questions."
      + " \r\n\r\nnpm loves you.\r\n"

  return text;

}