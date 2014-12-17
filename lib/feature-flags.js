module.exports = function(feature) {

  // All features enabled outside production
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  // e.g. FEATURE_FOO
  return !!process.env["FEATURE_" + feature.toUpperCase()]

}
