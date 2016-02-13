var http = require('http');

var server = http.createServer(function(req, res) {
  res.setHeader('content-type', 'application/json');
  if (/promotions/.test(req.url)) {
    res.end(JSON.stringify({
      "above-chrome": [{
        "id": 334,
        "html": "<p class=\"promotion-notice\">this is the default above the chrome</p>",
        "title": "Default Above Chrome",
        "stylesheet": ".promotion-notice {\r\n    color: red;\r\n}"
      }, {
        "id": 1334,
        "html": "<p class=\"promotion-notice\">this is the alternate above the chrome</p>",
        "title": "Default Above Chrome",
        "stylesheet": ".promotion-notice {\r\n    color: red;\r\n}"
      }],
      "below-header": [{
        "id": 341,
        "html": "<p class=\"promotion-notice\">this is the default below header location</p>",
        "title": "Default Below Header",
        "stylesheet": ".promotion-notice { color: green; }"
      }, {
        "id": 1341,
        "html": "<p class=\"promotion-notice\">this is the alternate below header location</p>",
        "title": "Default Below Header",
        "stylesheet": ".promotion-notice { color: green; }"
      }],
      "package-page": [{
        "id": 470,
        "html": "<div class=\"marketing\"><h3 id=\"-\"><a href=\"http://npm.me/u3\" title=\"Use this behind your firewall.\"><img src=\"https://partners.npmjs.com/mktg/20160113/onsite-taupe-342.png\" alt=\"Use this behind your firewall.\" style=\"min-width: 100%; max-width: 100%; position: relative; top: -10px;\"></a></h3>\r\n<p>\r\n<strong>Use this behind your firewall.</strong> Host your own private npm registry.  <a href=\"http://npm.me/u3\" title=\"npm On-Site\">Try npm On-Site »</a></p>\r\n</div>",
        "title": "2016-01-20 with banner",
        "stylesheet": ".marketing {\r\nmargin: 0px;\r\nmargin-left: -10px !important;\r\nmargin-bottom: 40px !important;\r\npadding: 0px 0px !important;\r\nfont-size: 15px;\r\nbackground: rgba(0, 0, 0, 0.02);\r\nborder-radius: 2px;\r\nborder: 1px solid rgba(0, 0, 0, 0.2);\r\ncolor: rgba(0, 0, 0, 0.4);\r\n}\r\n\r\n.marketing a {\r\ncolor: #cb3837;\r\n}\r\n\r\n.marketing p {\r\nline-height: 22.5px;\r\nmargin-left: 10px;\r\nmargin-right: 10px;\r\n}"
      }, {
        "id": 1470,
        "html": "<div class=\"marketing\"><h3 id=\"-\"><a href=\"http://npm.me/u3\"><img src=\"https://partners.npmjs.com/mktg/20160113/onsite-taupe-342.png\" alt=\"Use this behind your firewall.\" style=\"min-width: 100%; max-width: 100%; position: relative; top: -10px;\"></a></h3>\r\n<p>\r\n<strong>OMG AREN'T WOMBATS CUTE!</strong> Host your own private npm registry.  <a href=\"http://npm.me/u3\" title=\"npm On-Site\">Try npm On-Site »</a></p>\r\n</div>",
        "title": "2016-01-20 with banner",
        "stylesheet": ".marketing {\r\nmargin: 0px;\r\nmargin-left: -10px !important;\r\nmargin-bottom: 40px !important;\r\npadding: 0px 0px !important;\r\nfont-size: 15px;\r\nbackground: rgba(0, 0, 0, 0.02);\r\nborder-radius: 2px;\r\nborder: 1px solid rgba(0, 0, 0, 0.2);\r\ncolor: rgba(0, 0, 0, 0.4);\r\n}\r\n\r\n.marketing a {\r\ncolor: #cb3837;\r\n}\r\n\r\n.marketing p {\r\nline-height: 22.5px;\r\nmargin-left: 10px;\r\nmargin-right: 10px;\r\n}"
      }]
    }));
  } else if (/pages/.test(req.url)) {
    res.end(JSON.stringify({
      "id": 228,
      "html": "Hello, World!",
      "title": "npm Private Packages",
      "slug": "private-packages",
      "stylesheets": ["https://assets.npmjs.com/uploads/assets/npm-theme.css?v=2016-2-1-13-57-29"],
      "scripts": ["https://assets.npmjs.com/uploads/assets/theme.js?v=2016-2-1-13-57-29"]
    }));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({}));
  }
});

server.listen(8888)
