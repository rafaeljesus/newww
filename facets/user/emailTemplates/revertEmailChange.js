module.exports = function (rev, revUrl, host, from) {

  var text = 'You are receiving this because you have (or someone else has) '
        + 'requested that the email address of the \''
        + rev.name
        + '\' npm user account be changed from\r\n'
        + '    <' + rev.email1 + '>\r\n'
        + 'to:\r\n'
        + '    <' + rev.email2 + '>\r\n\r\n'
        + '\r\n'
        + 'If this was intentional, you can safely ignore this message.  '
        + 'However, a confirmation email was sent to <' + rev.email2 + '> '
        + 'with a link that must be clicked '
        + 'to complete the process.\r\n\r\n'
        + 'IMPORTANT: If this was NOT intentional, then your account '
        + 'MAY have been compromised.  Please click the following link '
        + 'to revert the change immediately:\r\n'
        + '    ' + revUrl + '\r\n\r\n'
        + 'And then visit ' + host + '/ and change your '
        + 'password right away.\r\n\r\n'
        + 'You can reply to this message, or email\r\n'
        + '    ' + from + '\r\n'
        + 'if you have any questions.\r\n\r\n'
        + 'npm loves you.\r\n';

  return text;
}