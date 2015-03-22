"use strict"

const http     = require("request")
const extend   = require("lodash").extend
const merge    = require("lodash").merge
const isString = require("lodash").isString
const isUrl    = require("is-url")

var HyperClient = module.exports = class HyperClient {

  constructor(options) {
    extend(this, options)

    if (!this.logger) {
      this.logger = {
        error: console.error,
        info: console.log
      };
    }

    if (options.request && options.request.bearer) {
      this.bearer = options.request.bearer
    }
  }

  request(options) {

    options.json = true

    if (this.bearer) {
      if (!options.headers) options.headers = {}
      merge(options.headers, {bearer: this.bearer})
    }

    if (this.host && isString(options.url) && !isUrl(options.url)) {
      options.url = this.host + options.url
    }

    return new Promise(function(resolve, reject) {
      http(options, function(err, resp, body) {
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

  static new(options) {
    return new HyperClient(options);
  }

}
