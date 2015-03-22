"use strict"

const HyperClient = require("../lib/hyperclient")
const expect      = require("code").expect
const nock        = require("nock")

var client = new HyperClient({
  host: "https://google.com"
})

describe("hyperclient", function () {

  describe("constructor", function() {

    it("finds bearer token if given a request option")
    it("accepts a custom logger")
    it("borrows console.log and console.error if no logger is specified")

  })

  describe("request", function() {

    it("makes a request wrapped in a promise", function (done) {

      var mock = nock("https://google.com")
        .get("/")
        .reply(200)

      var opts = {
        method: "GET",
        url: "https://google.com/"
      }

      client.request(opts)
      .then(function(res) {
        mock.done()
        expect(res).to.exist()
        done()
      })
    })

    it("sets default HTTP method to GET", function (done) {
      var mock = nock("https://google.com")
        .get("/home")
        .reply(200)

      var opts = {url: "/home"}

      client.request(opts)
        .then(function(res) {
          mock.done()
          done()
        })
    })

    it("supports relative URLs", function (done) {

      var mock = nock("https://google.com")
        .get("/some/nested/page")
        .reply(200)

      var opts = {
        url: "/some/nested/page"
      }

      client.request(opts)
        .then(function(res) {
          mock.done()
          done()
        })
    })

    it("injects bearer token into request headers")

    it("treats a string as a GET URL")

    it("sets json to true")

    it("rejects if statusCode > 400")

  })

  describe("generic request functions", function(){
    it("client.get")
    it("client.put")
    it("client.post")
    it("client.delete")
  })

})
