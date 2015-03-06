var Package = require('../models/package')
var merge = require('lodash').merge
var omit = require('lodash').omit
var chunk = require('chunk')
var fmt = require('util').format
var URL = require('url')
var defaultCount = 36

var browse = module.exports = {}

browse.packagesByKeyword = function(request, reply) {
  var context = {
    keyword: request.params.keyword
  }
  var options = {
    keyword: context.keyword,
    count: defaultCount,
    offset: Math.abs(parseInt(request.query.offset, 10)) || 0
  }

  Package.new(request)
  .list(options)
  .then(function(result){
    context.items = chunk(result.results, 3)
    paginate(request, options, result, context)
    return reply.view('browse/keyword', context);
  })
}

browse.mostDependedUponPackages = function(request, reply) {
  var context = {}
  var options = {
    sort: 'dependents',
    count: defaultCount,
    offset: Math.abs(parseInt(request.query.offset)) || 0
  }

  Package.new(request)
  .list(options)
  .then(function(result){
    context.items = chunk(result.results, 3)
    paginate(request, options, result, context)
    return reply.view('browse/depended', context);
  })
}

browse.packageDependents = function(request, reply) {
  var context = {
    package: request.params.package
  }
  var options = {
    dependency: context.package,
    count: defaultCount,
    offset: Math.abs(parseInt(request.query.offset)) || 0
  }

  Package.new(request)
  .list(options)
  .then(function(result){
    context.items = chunk(result.results, 3)
    paginate(request, options, result, context)
    return reply.view('browse/package-dependents', context);
  })
}

browse.mostStarredPackages = function(request, reply) {
  var context = {}
  var options = {
    sort: 'stars',
    count: defaultCount,
    offset: Math.abs(parseInt(request.query.offset)) || 0
  }

  Package.new(request)
  .list(options)
  .then(function(result){
    context.items = chunk(result.results, 3)
    paginate(request, options, result, context)
    return reply.view('browse/starred', context);
  })
}

browse.recentlyUpdatedPackages = function(request, reply) {
  var context = {}
  var options = {
    sort: 'modified',
    count: defaultCount,
    offset: Math.abs(parseInt(request.query.offset)) || 0
  }

  Package.new(request)
  .list(options)
  .then(function(result){
    context.items = chunk(result.results, 3)
    paginate(request, options, result, context)
    return reply.view('browse/recently-updated', context);
  })
}

browse.recentlyCreatedPackages = function(request, reply) {
  var context = {}
  var options = {
    sort: 'created',
    count: defaultCount,
    offset: Math.abs(parseInt(request.query.offset)) || 0
  }

  Package.new(request)
  .list(options)
  .then(function(result){
    context.items = chunk(result.results, 3)
    paginate(request, options, result, context)
    return reply.view('browse/recently-created', context);
  })
}

var paginate = function paginate(request, options, result, context) {
  if (result.hasMore || options.offset > 0) {
    context.pages = {}
    var url = omit(request.url, 'search')
    if (options.offset > 0) {
      url.query.offset = Math.max(options.offset-options.count, 0)
      context.pages.prev = URL.format(url)
    }
    if (result.hasMore) {
      url.query.offset = result.offset
      context.pages.next = URL.format(url)
    }
  }
}
