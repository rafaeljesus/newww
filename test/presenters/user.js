var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect,
    present = require(__dirname + "/../../presenters/user"),
    users = require(__dirname + "/../fixtures/users")

describe("metadata", function () {

  it("is an object with key-value pairs", function(done){
    var user = present(users.fakeuser)
    expect(user.meta).to.exist
    expect(user.meta).to.be.an("Object")
    done()
  })

  // it("removes meta pairs with empty values", function(done){
  //
  // })
  //
  // describe("github", function () {
  //
  //   it("removes leading @ from username if present", function(done){
  //
  //   })
  //
  //   it("extracts username if value is a URL", function(done){
  //
  //   })
  //
  //   it("generates a URL to the user's profile page", function(done){
  //
  //   })
  //
  // })
  //
  // describe("twitter", function () {
  //
  //   it("removes leading @ from username if present", function(done){
  //
  //   })
  //
  //   it("extracts username if value is a URL", function(done){
  //
  //   })
  //
  //   it("generates a URL to the user's profile page", function(done){
  //
  //   })
  //
  // })
  //
  // describe("email", function () {
  //
  //   it("generates a mailto URL", function(done){
  //
  //   })
  //
  // })

})
