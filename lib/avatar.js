var gravatar = require("gravatar").url;

module.exports = function(email) {
  if (!email) email = "";
  return {
    small: gravatar(email, {size:50, default:"https://www.npmjs.com/static/images/wombat-avatar-small.png"}, true),
    medium: gravatar(email, {size:100, default:"https://www.npmjs.com/static/images/wombat-avatar-small.png"}, true),
    large: gravatar(email, {size:496, default:"https://www.npmjs.com/static/images/wombat-avatar-large.png"}, true),
  }
}
