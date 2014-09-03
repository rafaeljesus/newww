module.exports = function (name, conf, confUrl, from) {

  var text = 'You are receiving this because you have (or someone else has) '
        + 'requested that the email address of the \''
        + name
        + '\' npm user account be changed from\r\n'
        + '    <' + conf.email1 + '>\r\n'
        + 'to:\r\n'
        + '    <' + conf.email2 + '>\r\n\r\n'
        + 'Please click the following link, or paste into your browser '
        + 'to complete the process.\r\n\r\n'
        + '    ' + confUrl + '\r\n\r\n'
        + 'If you received this in error, you can safely ignore it.\r\n\r\n'
        + 'The request will expire shortly.\r\n\r\n'
        + 'You can reply to this message, or email\r\n'
        + '    ' + from + '\r\n'
        + 'if you have any questions.\r\n\r\n'
        + 'npm loves you.\r\n'

  return text;
}