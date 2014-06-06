var Lab = require('lab'), 
    describe = Lab.experiment, 
    before = Lab.before, 
    it = Lab.test, 
    expect = Lab.expect;

var Hapi = require('hapi');
var server;   
var fakeSearch = require('./fixtures/fake.json'); 

//set up server
before(function (done) { 
  var serverOptions  = { 
      views: {
        engines: {hbs: 'handlebars'}, 
        partialsPath: '../../hbs-partials', 
        helpersPath: '../../hbs-helpers'
      }
}; 
  server = Hapi.createServer(serverOptions); 
});

describe('Rendering the view', function () {
  var source; 
  it('Should use the index template to render the view', function (done) {
  //simulate a search for a given module, results are in fakeSearch  
  var options =  { 
      url: '/search?q=' + 'express'
    };
    
    server.ext('onPreResponse', function (request, next){
      source = request.response.source;
      next(); 
     });
    //render the template with express   
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200); 
      expect(source.template).to.equal('index'); 
      done(); 
    }); 
  }); 
  
  it('Should have the proper number of results', function (done) {
    console.log(source.context.hits); 
   }); 
});  

