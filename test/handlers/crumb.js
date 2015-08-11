module.exports = function(server, callback) {
  server.inject({
    method: "get",
    url: "/login"
  }, function(resp) {
    callback(resp.headers['set-cookie'][0].split("; ")[0].replace("crumb=", ""))
  })
}
