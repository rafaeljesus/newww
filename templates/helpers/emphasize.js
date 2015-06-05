module.exports = function (phrase, keyword) {
  return phrase.replace("_" + keyword + "_", "<strong><em>"+keyword+"</em></strong>");
};