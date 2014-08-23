module.exports = function schemeless (prop) {
  var schemey = new RegExp("^https?:\/\/", "i")
  if (typeof(prop) === "string" && prop.match(schemey)) {
    return prop
      .replace(schemey, '')
      .replace(/\/$/, '')
  } else {
    return prop
  }
}
