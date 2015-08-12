module.exports = function packageKeywords(keywords, count) {
  if (typeof keywords === 'string') {
    keywords = keywords.split(/\s*,?\s*/)
  }

  if (!count) {
    count = 100
  }

  if (Array.isArray(keywords)) {
    keywords = keywords.slice(0, count).map(function(kw) {
      kw = kw.replace(/</g, '&lt;').replace(/"/g, '&quot;')
      return '<a href="/browse/keyword/' + kw + '">' + kw + '</a>'
    }).join(', ')
  }

  return keywords;
}
