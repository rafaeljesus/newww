"use strict"

const http = require("nets")

var HyperClient = module.exports = class HyperClient {

  constructor(opts) {
    this.host = opts.host
  }

  request(opts) {
    // TODO: handle relative URL
    // TODO: default to GET
    return new Promise(function(resolve, reject) {
      http(opts, function(err, resp, body) {
        console.log("here?")
        if (err) { return reject(err) }

        if (resp.statusCode > 399) {
          err = Error('Error ' + resp.statusCode + ": " + body)
          err.statusCode = resp.statusCode
          return reject(err)
        }

        return resolve(body)
      })
    })
  }

}
