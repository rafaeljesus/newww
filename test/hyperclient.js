const HyperClient = require("../lib/hyperclient")

var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,
    expect = Code.expect;


var client = new HyperClient({
  host: "https://google.com"
})

describe("hyperclient", function () {

  it("makes a request wrapped in a promise", function (done) {
    var opts = {
      method: "GET",
      url: "https://google.com"
    }

    client.request(opts)
    .then(function(res) {
      expect(res).to.exist()
      done()
    })
  })

})
