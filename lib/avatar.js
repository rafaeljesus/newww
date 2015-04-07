var gravatar = require("gravatar").url;


module.exports = function(email) {
  if (!email) email = "";
  return {
    small: gravatar(email, {size:50, default: 'retro'}, true),
    medium: gravatar(email, {size:100, default: 'retro'}, true),
    large: gravatar(email, {size:496, default: 'retro'}, true),
  }
}
