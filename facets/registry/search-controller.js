var elasticsearch = require('elasticsearch'), 
config = require('../../config'),
client = new elasticsearch.Client({
  host: config.search.url
});

module.exports = function(request, reply){
  var searchQuery = {
    fields : ['name', 'keywords','description','author','version', 'stars', 'dlScore', 'dlDay', 'dlWeek'],
    body: { 
      "query" :{ 
      "dis_max": {
        "tie_breaker": 0.7,
        "boost": 1.2,
        "queries": [
        {
          "function_score": {
            "query": {
              "match": {
                "name.untouched": request.query.q
              }
            },
            "boost_factor": 100
          }
        },
        {
          "bool": {
            "should": [
            {"match_phrase": {"name": request.query.q} },
            {"match_phrase": {"keywords": request.query.q} },
            {"match_phrase": {"description": request.query.q} },
            {"match_phrase": {"readme": request.query.q} }
            ],
            "minimum_should_match": 1,
            "boost": 50
          }
        },
        {
          "function_score": {
            "query": {
              "multi_match": {
                "query": request.query.q,
                "fields": ["name^4", "keywords", "description", "readme"]
              }
            },
            "functions": [
            {
              "script_score": {
                "script": "(doc['dlScore'].isEmpty() ? 0 : doc['dlScore'].value)"
              }
            },
            {
              "script_score": {
                "script": "doc['stars'].isEmpty() ? 0 : doc['stars'].value"
              }
            }
            ],
            "score_mode": "sum",
            "boost_mode": "multiply"
          }
        }
        ]
      }
    }
  }
};
  client.search(searchQuery, function (error, response){
    if (error) { 
      reply.view("search"); 
      return;
    }
    console.log("showing results"); 
    console.log(response);
    console.log(response.hits);
    reply.view("search", {
      hits: response.hits
    });  
  }); 

}
