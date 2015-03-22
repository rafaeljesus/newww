"use strict"

const HyperClient = require("../lib/hyperclient")
const fmt = require('util').format
const decorate = require(__dirname + '/../presenters/collaborator')

module.exports = class Collaborator extends HyperClient {

  list(pkg, callback) {
    let opts = {
      url: `${this.host}/package/${pkg.replace("/", "%2F")}/collaborators`
    }

    return this.request(opts)
    .then(function(collaborators){
      Object.keys(collaborators).forEach(function(username){
        collaborators[username] = decorate(collaborators[username], pkg)
      })
      return Promise.resolve(collaborators)
    })
  }

  add(pkg, collaborator) {
    let opts = {
      method: "PUT",
      url: `${this.host}/package/${pkg.replace("/", "%2F")}/collaborators`,
      body: collaborator
    }

    return this.request(opts)
    .then(function(collaborator){
      return Promise.resolve(decorate(collaborator))
    })
  }

  update(pkg, collaborator) {
    let opts = {
      method: "POST",
      url: `${this.host}/package/${pkg.replace("/", "%2F")}/collaborators/${collaborator.name}`,
      body: collaborator
    }

    return this.request(opts)
    .then(function(collaborator){
      return Promise.resolve(decorate(collaborator))
    })
  }


  del(pkg, collaboratorName) {
    let opts = {
      method: "DELETE",
      url: `${this.host}/package/${pkg.replace("/", "%2F")}/collaborators/${collaboratorName}`
    }

    return this.request(opts)
    .then(function(collaborator){
      return Promise.resolve(decorate(collaborator))
    })
  }

}
