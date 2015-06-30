module.exports = {
  "results": [
    {
      "name": "vastl",
      "description": "Vasteam web project build tool",
      "readme": "# Vasteam web project build tools #\n\n    v0.1.1\n\n\nvastl 是一个前端工程化模板插件集合；\n目前包含插件：ftp、copy(复制)、prefix(css属性前缀)、clean(临时文件清理)、offline(离线包) \n\n\n## Install ##\n    npm install -g vastl\n\n\n## Command-line Usage\n\n###初始化\n\n    vastl init [-n projectName]\n\n\n自动生成项目模板, 有项目名参数则创建对于项目名目录，否则在当前目录创建项目模板。\n\n```\nprojectName/\n  ├─src             #开发目录\n  │  ├─ img\n  │  ├─ sass\n  │  └─ jade\n  ├─dist             #发布目录\n\n  ├─config.rb        # compass 配置\n  └─project.js       # 项目配置\n```\n\n\n###Ftp插件\n可配置多个ftp服务器， 以参数形式指定发布到哪个服务器, 默认将使用 default配置。 具体见 `project.js` 。\n\n    vastl ftp[:server]\n\n\n### 离线包插件\n\n    vastl offline\n\n\n\n###  copy插件 默认配置为（src > dist） \n\n    vastl copy\n\n### clean插件 (默认配置：清理 `['.tmp/', '.sass-cache/', '.offline/']` )\n\n    vastl clean\n\n\n### prefixer 插件 \n\n重编译dist中的css文件 为css3属性加上指定浏览器前缀。\n\n因为prepros完整compass支持模式下无法启用 自带prefixer\n\n    vastl prefix\n\n\n\n##配置说明\n\n工程以及所包行插件配置文件 : `project.js` \n\n所有插件均允许有多个配置参数, 比如ftp插件\n\n```\nftp:{\n\tdefault: {\n\t\thost: '192.168.199.186',\n      port: '21',\n      user: 'pi',\n      pass: 'raspberry',\n      remotePath:'/home/pi/ftp/',\n      from: dist,\n      glob:['css/*.css','img/*.{jpg,gif,png,ico}','html/*.html'],\n      //任务执行完毕后执行的回调\n      callback: function(){}\n\t},\n\tftp-server-dev:{\n\t},\n\tftp-server-demo:{\n\t}\n}\n\n```\n\n\n## todo\n\n- imgmin",
      "version": "0.1.1",
      "publisher": {
        "name": "everyonme",
        "email": null,
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:12.101Z"
    },
    {
      "name": "no-recursion-merge-sort",
      "description": "Super simple and non-recursive JSON parse/stringify library",
      "readme": "grin\n=========\n\n[![Build Status](https://travis-ci.org/calvinmetcalf/grin.svg)](https://travis-ci.org/calvinmetcalf/grin)\n\nSimple non-recursive implementation of merge sort. Originally based on [this Java implementation](http://andreinc.net/2010/12/26/bottom-up-merge-sort-non-recursive/), now mostly written by [@calvinmetcalf](https://github.com/calvinmetcalf).\n\nStatus, should work, does modify the array in place, will not work on sparse arrays exactly like native but that's ok.\n\nUsage\n----\n\n    $ npm install grin\n    \n\nThen in code:\n\n```js\nvar sort = require('grin');\nvar arr = [3, 2, 1, 4, 10];\n\n// [1, 10, 2, 3, 4]\nvar sortedNaturally = sort(arr);\n\n// [1, 2, 3, 4, 10]\nvar sortedNumerically = sort(arr, function (a, b) { return a - b; });\n\n```\n\nTesting\n------\n\nUnit tests:\n\n    $ npm test\n    \nCoverage tests:\n\n    $ npm run coverage\n",
      "version": "1.0.1",
      "publisher": {
        "name": "cwmma",
        "email": "calvin.metcalf@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:12.547Z"
    },
    {
      "name": "edflib",
      "description": "an npm module for reading Edf files",
      "readme": "EDFLib\n======\n\nEDFLib is a C++ libaray for reading EDF files. It comes with bindings for Node.js and Matlab.  Python bindings would be nice too, but that's still on the horizon.\n\nInstallation\n=======\n\n###node\ncd into the /node folder in /src and run node-gyp to compile the C++ source files.\n\n```\ncd src/node\nnode-gyp build\n\n```\n\n###matlab\ncd into the matlab folder in /src and run GNU Make to compile the C++ source files.\n```\ncd src/matlab\nmake\n```\n\nLicense\n=======\n\nCopyright (c) 2014 Jonathan Brennecke\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in\nall copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\nTHE SOFTWARE.\n",
      "version": "1.0.0",
      "publisher": {
        "name": "jonbrennecke",
        "email": "jpbrennecke@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:13.363Z"
    },
    {
      "name": "kroid-explorer",
      "description": "explorer ========",
      "readme": "explorer\n========\n",
      "version": "0.1.0",
      "publisher": {
        "name": "kroid",
        "email": "kroid@yandex.ru",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:13.923Z"
    },
    {
      "name": "sharkfly",
      "description": "Manage of International Codes",
      "readme": "sharkfly\n========\n\nManage of International Country Codes\n\n More Information: \n https://github.com/axelgalicia/sharkfly",
      "version": "0.0.9",
      "publisher": {
        "name": "agalicia",
        "email": "axelmania@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:32.273Z"
    },
    {
      "name": "copyapi",
      "description": "Client Library for the Copy.com OAuth-based RESTful JSON API",
      "readme": "README.md",
      "version": "0.0.2",
      "publisher": {
        "name": "tlhunter",
        "email": "tlhunter@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:33.263Z"
    },
    {
      "name": "js-xmlify",
      "description": "Helper functions to deal with XML data structures and metadata in node.js",
      "readme": "# js-xmlify\n\nUse npm to install the package:\n\n    npm install js-xmlify\n\nBefore rendering a JavaScript object in XML, you may do:\n\n    var xmlify = require('js-xmlify');\n    var data; // your JavaScript object (or array)\n    xmlify.prerender(data); // object is modified inline\n    \n    // render data as XML, e.g., using 'js2xmlparser'\n\nIn case you parsed data from XML to a JavaScript object, you may do:\n\n    var xmlify = require('js-xmlify');\n    var data; // read and parse XML document, e.g., using 'xml2js'\n    xmlify.postparse(data); // object is modified inline\n",
      "version": "0.0.9",
      "publisher": {
        "name": "johannesw",
        "email": "mail@jojow.de",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:41.428Z"
    },
    {
      "name": "strain",
      "description": "defines callable, method-chained js components",
      "readme": "# strain\n\n![Build Status](https://api.travis-ci.org/justinvdm/strain.png)\n\ndefines callable, method-chained js components, inspired by [d3](https://github.com/mbostock/d3)'s pretty api.\n\n\n```javascript\nvar strain = require('strain');\n\n\nvar thing = strain()\n  .prop('foo')\n    .default(22)\n  .prop('bar')\n    .default(3)\n\n  .meth('foobar', function() {\n    console.log(this.foo() + this.bar());\n  });\n\n\nvar subthing = strain(thing)\n  .prop('bar')\n    .default(23)\n    .get(function(v) {\n      return v * 2;\n    })\n    .set(function(v) {\n      return v + 1;\n    })\n\n  .init(function(arg) {\n    console.log('init! ' + arg);\n  })\n\n  .invoke(function() {\n    console.log('invoke!');\n  });\n\n\nvar t = subthing('arg!')  // init! arg!\n  .foobar()  // 70\n  .bar(42)\n  .foobar();  // 108\n\n\nt();  // invoke!\n```\n\n\n## install\n\nnode:\n\n```\n$ npm install strain\n```\n\nbrowser:\n\n```\n$ bower install strain\n```\n\n```html\n<script src=\"/bower_components/strain/strain.js\"></script>\n```\n\n\n## api\n\n### `strain([parent])`\n\ncreates a new type.\n\n```javascript\nvar eventable = strain(EventEmitter);\n\neventable()\n  .on('foo', function() {\n    console.log('bar');\n  })\n  .emit('foo');  // bar\n```\n\nif `parent` is specified, properties on the parent are attached to the type, prototype properties on the parent are accessible via the type's prototype, and the parent is attached to the new type as `_super_`.\n\n\n### `.extend()`\n\ncreates a child type from the calling type. shorthand for `strain(<type>)`.\n\n```javascript\nvar thing = strain.extend();\nvar subthing = thing.extend();\n```\n\n\n### `.new()`\n\ncreates a new instance of the type.\n\n```javascript\nstrain()\n  .init(function(arg) {\n    console.log(arg);\n  })\n  .new('foo');  // foo\n```\n\n\n### `.static(name, value)`\n\ndefines a new property directly on the calling type.\n\n```javascript\nvar thing = strain()\n  .static('foo', 23)\n  .static('bar', function() {\n    console.log('bar!');\n  })\n  .bar()  // bar!\n  .bar();  // bar!\n\nconsole.log(thing.foo);  // 23\n```\n\nif `value` is a function that does not return a value or returns `undefined`, the type is returned instead to allow for further method chaining.\n\n\n### `.static(fn)`\n\ndefines a new method directly on the calling type from a named function.\n\n```javascript\nvar thing = strain()\n  .static(function bar() {\n    console.log('bar!');\n  })\n  .bar()  // bar!\n  .bar();  // bar!\n```\n\nif `fn` does not return a value or returns `undefined`, the type is returned instead to allow for further method chaining.\n\n\n### `.prop(name)`\n\ndefines or re-references a new gettable and settable property on a type.\n\n```javascript\nvar t = strain().prop('foo')();\nconsole.log(t.foo());  // 23\n```\n\nre-referencing a property allows [`.default`](#defaultv), [`.set`](#setfn) and [`.get`](#getfn) to be applied to a property after it has been defined (possibly by a parent type), without breaking method chaining for the type currently being defined.\n\n\n### `.default(v)`\n\nsets the default value of the most recently referenced property.\n\n```javascript\nvar thing = strain()\n  .prop('foo')\n  .prop('bar').default(23)\n  .prop('foo').default(42);\n\nconsole.log(thing().foo());  // 42\nconsole.log(thing().bar());  // 23\n```\n\nnote that setting mutable values using [`.default`](#defaultv) means that all instances of the type will be affected by modifications to the value. [`.init`](#initfn) or [`.defaults`](#defaultsfn) could be used if you need to create mutables per-instance.\n\n\n### `.get(fn)`\n\nsets the coercion function to use when getting the most recently referenced property.\n\n```javascript\nvar thing = strain()\n  .prop('foo')\n  .prop('bar').get(function(v) {\n    return v + 1;\n  })\n  .prop('foo').get(function(v) {\n    return v * 2;\n  });\n\nconsole.log(thing().bar(23).bar());  // 24\nconsole.log(thing().foo(42).foo());  // 84\n```\n\n\n### `.set(fn)`\n\nsets the coercion function to use when setting the most recently referenced property.\n\n```javascript\nvar thing = strain()\n  .prop('foo')\n  .prop('bar').set(function(v) {\n    return v + 1;\n  })\n  .prop('foo').set(function(v) {\n    return v * 2;\n  });\n\nconsole.log(thing().bar(23).bar());  // 24\nconsole.log(thing().foo(42).foo());  // 84\n```\n\n\n### `.meth(name, fn)`\n\ndefines a new method on a type.\n\n```javascript\nvar thing = strain()\n  .meth('foo', function() {\n    return 23;\n  })\n  .meth('bar', function() {\n    console.log(this.foo());\n  })();\n\n\nthing()\n  .bar()  // 23\n  .bar()  // 23\n  .bar();  // 23\n```\n\nif `fn` does not return a value or returns `undefined`, the type's instance is returned instead to allow for further method chaining.\n\n\n### `.meth(fn)`\n\ndefines a new method on a type from a *named* function.\n\n```javascript\nvar thing = strain()\n  .meth(function foo() {\n    console.log('bar');\n  })();\n\n\nthing().foo();  // bar\n```\n\n\n### `.defaults(obj)`\n\nsets the default values of properties for each new instance using a data object.\n\n```javascript\nvar thing = strain()\n  .prop('foo')\n  .defaults({foo: 23});\n\nconsole.log(thing().foo());  // 23\n```\n\n\n### `.defaults(fn)`\n\nsets the default values of properties for each new instance using a function that returns a data object.\n\n```javascript\nvar thing = strain()\n  .prop('foo')\n  .defaults(function() {\n    return {foo: 23};\n  });\n\nconsole.log(thing().foo());  // 23\n```\n\nthe given function is invoked at initialisation time for each new instance.\n\n\n### `.init(fn)`\n\ndefines a function to be called on initialisation. shorthand for `.meth('_init_', fn)`.\n\n```javascript\nvar thing = strain().init(function() {\n  this.foo = 'bar'\n});\n\n\nconsole.log(thing().foo);  // bar\n```\n\n\n### `.invoke(fn)`\n\ndefines the function that is called when the instance is called. shorthand for `.meth('_invoke_', fn)`.\n\n```javascript\nvar t = strain().invoke(function() {\n  return 23;\n})();\n\n\nconsole.log(t());  // 23\n```\n\n### `.instanceof(instance, type)`\n\ndetermines whether the ``instance`` is an instance of ``type``, regardless of whether ``instance`` and ``type`` are strain-based or not.\n\n```javascript\nvar foo = strain();\nvar bar = function() {};\nconsole.log(strain.instanceof(foo(), foo));  // true\nconsole.log(strain.instanceof(new bar(), bar));  // true\n```\n\n\n### `<instance>.prop(name[, value])`\n\ngets or sets a property by its name.\n\n\n```javascript\nvar thing = strain().prop('foo')\nconsole.log(thing().prop('foo', 'bar').prop('foo'));  // bar\n```\n\n### `<instance>.props()`\n\nreturns a shallow copy of the strain instances's properties as a data object.\n\n\n```javascript\nvar thing = strain()\n  .prop('foo')\n  .prop('bar');\n\nvar t = thing()\n  .foo(2)\n  .bar(3);\n\nconsole.log(t.props());  // { foo: 2, bar: 3 }\n```\n\n### `<instance>.toJSON()`\n\nan alias to [`.props`](#instanceprops) for stringifying the strain instance with [`JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).\n\n```javascript\nvar thing = strain()\n  .prop('foo')\n  .prop('bar');\n\nvar t = thing()\n  .foo(2)\n  .bar(3);\n\nconsole.log(JSON.stringify(t));  // {\"foo\":2,\"bar\":3}\n```\n\n\n### `<instance>.invoke([arg1[, arg2[, ...]]])`\n\ncalls the instance with the given args.\n\n\n```javascript\nstrain()\n  .invoke(function(arg) {\n    console.log(arg);\n  })\n  .new()\n  .invoke('foo');  // foo\n```\n\n\n### `<instance>.instanceof(type)`\n\ndetermines whether calling instance is an instance of the given type.\n\n\n```javascript\nfunction thing() {}\nvar subthing = strain(thing);\nvar t = subthing();\nconsole.log(t.instanceof(thing));  // true\nconsole.log(t.instanceof(t));  // false\n```\n\nthis is a workaround, since there is no easy, portable way to construct a callable with a properly set up prototype chain in js.\n",
      "version": "0.8.3",
      "publisher": {
        "name": "justinvdm",
        "email": "justinvdm@lavabit.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:41.855Z"
    },
    {
      "name": "gel-minifier",
      "description": "minifies gel files",
      "readme": "#gel-minifier\n\nminifies gel expressions\n\n#Install\n\n    npm install gel-minifier\n\n#Usage\n\n    var gelMinifier = require('gel-minifier')(function(expression){\n        // eg. return gel.tokenise(expression);\n    });\n\n    var minified = gelMinifier('(&& 1 2)');",
      "version": "1.0.1",
      "publisher": {
        "name": "mauricebutler",
        "email": "maurice.butler@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:43.239Z"
    },
    {
      "name": "rest_base",
      "description": "A package containing the base nessecities for creating a rest API, using bunyan for logging, and express for the http front end.",
      "readme": "node-rest_base\n==============\n\nbase library that includes features that I want in every node rest API project I make.\n",
      "version": "0.0.1",
      "publisher": {
        "name": "rltvty",
        "email": "rltvty@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:44.406Z"
    },
    {
      "name": "soq",
      "description": "Simple Object Query Interface for JSON Array",
      "readme": "#SOQ\n**Simple Object Query Interface for JSON Array**\n\n##Synopsis\n\nIt's not going to be anther JSON Database. SOQ is made to find pure JSON Objects in a more elegant and unobstructive way. It may be extended to act as middle layer between client and server DB.\n\n##Query Language\nWe accept a simple string a query conditions. And at least you shuold tell the query object which type of objects you want to find.\n\n\tvar query = Query.build({\n\t\ttype: \"vehicle\",\n\t\tconditions: \"name = 'Ford'\"\n\t});\n\t\nIn fact, the query interface have learned a bunch of condition types:\n\n* =\n* \\>=\n* \\>\n* \\<=\n* \\<\n* !=\n* BEGINS_WITH\n* ENDS_WITH\n* MATCH\n* TYPE_IS\n\nAnd these condition operators are straightfoward.\n\nIt also should be noted that the value of a condition can be:\n\n* Numbers: 1,2,3,0.5,1.4…\n* Strings: \"Hello\", \"Nice\",…\n* Reserved Words: true, false, null, undefined\n\t\nWhat's more you can pass mutiple conditions:\n\n\t…\n\tconditions: \"name = 'Ford' and age > 3 or price < 1000\"\n\t…\n\t\nMaybe you are wondering the priority of condtions. Yes, we don't support group conditions with parenthesises currently, which I have added into my TODO list. Anyway, I simply treat the former condition as the one with higher priority for now.\n\n##Store\nIn most of time, you don't deal with Query class directly. A Store Class is provided as gateway to access your data;\n\nA simple use case:\n\n\tvar store = new Store();\n\tstore.add({\n\t\t\"name\": \"Ford\",\n\t\t\"type\": \"vehicle\"\n\t}).add({\n\t\t\"name\": \"BMW\",\n\t\t\"type\": \"vehicle\"\n    }).add({\n\t\t\"name\": \"Bike\",\n\t\t\"type\": \"other\"\n    });\n\nAnd then, we find what we want in this store:\n\n    var r = store.find({\n      type: \"vehicle\",\n      conditions: \"name BEGINS_WITH 'B'\"\n    });\n    //result is always in form of an array\n    //r[0].name == \"BMW\"\n\nAlso a getting-all-of-we-have method:\n\t\n\tvar all = store.all(\"vehicle\");\n\t//all.length === 2\n\nFeel free to modify the objects you find in the store. But in the future, updating a record will be taken seriously with a specialized update method.\n\nRemoving a record:\n\t\n\tstore.remove(r[0]);//BMW is gone from our store!\n\t\nMore examples can be found at */spec/*\n\t\n##TODO\n\n* Data source support for store\n* Improving performance of Collection internal\n* Improving traversal of logic tree by reducing the context gradually\n\n##Changes\n* 2012-3-12 16:24\n\t* Better support for reserved words\n* 2012-3-14 21:50\n\t* Group conditions\n\t\n##Contacts\nYou can find me:\n\n* http://robinqu.me/\n* http://twitter.com/robinqu\n* http://weibo.com/robinqu\n\t",
      "version": "0.0.1",
      "publisher": {
        "name": "RobinQu",
        "email": "robinqu@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:14.481Z"
    },
    {
      "name": "audio-utils",
      "description": "Audio utilities like fundamental frequency detection, populate buffer with sinusoidal curves",
      "readme": "audio-utils\n===========\n\nAudio utilities like fundamental frequency detection, populate buffer with sinusoidal curves\n\n\n\n",
      "version": "1.0.1",
      "publisher": {
        "name": "eventhorizon",
        "email": null,
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:14.640Z"
    },
    {
      "name": "bundle-style",
      "description": "use require('style.css') in javascript and bundle-style to bundle them all",
      "readme": "bundle-style\n============\n\nuse require('style.css') in javascript and bundle-style to bundle them all\n",
      "version": "0.1.10",
      "publisher": {
        "name": "undozen",
        "email": "undoZen@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:15.379Z"
    },
    {
      "name": "nonstop-hub",
      "description": "HTTP server/site for hosting and management of nonstop packages and bootstrappers",
      "readme": "## continua hub\n\nREADME coming soon ...",
      "version": "0.1.0",
      "publisher": {
        "name": "arobson",
        "email": "asrobson@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:16.553Z"
    },
    {
      "name": "set-dateout",
      "description": "Run a function at the specified JavaScript date",
      "readme": "# set-dateout\n\nLike `setTimeout`, but for dates in the far future.\n(specifically, this module overcomes the 32-bit integer overflow issue)\n\n\n## Install\n\n```shell\n$ npm install set-dateout\n```\n\n\n## Use\n\n```javascript\nvar setDateout = require('set-dateout');\n\nsetDateout(function (){\n  console.log('yeah!! it\\'s a new century, baby!!');\n}, new Date('January 1, 2100'));\n```\n\n\n## License\n\nMIT\n\n> solution modified from http://stackoverflow.com/a/18182660\n",
      "version": "2.0.1",
      "publisher": {
        "name": "balderdashy",
        "email": "mike@balderdashdesign.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:17.787Z"
    },
    {
      "name": "async-mustache",
      "description": "Asyncronous view functions",
      "readme": "# async-mustache.js - Asyncronous view functions\n\n\nA wrapper around https://github.com/janl/mustache.js/ providing asyncronous view functions\n\n## Usage\n\nNode:\n\n```javascript\nvar Mustache = require('mustache');\nvar AsyncMustache = require('async-mustache')({mustache: Mustache});\n\nvar view = {\n\tasync: AsyncMustache.async(function (text, render, callback) {\n\t\tsetTimeout(function () {\n\t\t\tcallback(null, render(text));\n\t\t}, 0);\n\t}))\n};\n\nAsyncMustache.render('{{#async}}async-{{/async}}mustache.js', view).then(function (output) {\n\tconsole.log(output); // async-mustache.js\n});\n```\n\nBrowser:\n\n```html\n<script src=\"mustache.js\"></script>\n<script src=\"async-mustache.js\"></script>\n<script>\nvar asyncMustache = require('async-mustache')({mustache: Mustache});\n//Use it\n</script>\n```\n\n## LICENSE\n\nMIT\n",
      "version": "0.1.3",
      "publisher": {
        "name": "pjfh",
        "email": "peter.hancock@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:18.417Z"
    },
    {
      "name": "benderjs-proxy",
      "description": "HTTP proxy for Bender.js",
      "readme": "# benderjs-proxy\n\nHTTP proxy for Bender.js using [node-http-proxy](https://github.com/nodejitsu/node-http-proxy). Especially useful for testing Cross-Origin requests.\n\n## Installation\n\n```\nnpm install benderjs-proxy\n```\n\n## Usage\n\nAdd `benderjs-proxy` to the `plugins` array in your `bender.js` configuration file:\n\n```javascript\nvar config = {\n\tplugins: [ 'benderjs-proxy' ] // load the plugin\n};\n\nmodule.exports = config;\n```\n\n## Configuration\n\nYou can configure proxy in `bender.js` configuration file.\n```javascript\nvar config = {\n    (...)\n\n\tproxy: {\n\t\t// Below configuration will redirect all requests from http://<bender_host>:<bender_port>/google to http://google.com\n\t\t'/google': 'http://google.com',\n\t\t\n        // You can also pass a function as a proxy target, it will receive a URL object produced using Node's url.parse() method\n\t\t'/foobar': function( url ) {\n\t\t\treturn 'http://example.com/foo/bar' + ( url.search || '' );\n\t\t}\n\t}\n};\n\nmodule.exports = config;\n```\n\n## License\n\nMIT, for license details see: [LICENSE.md](https://github.com/benderjs/benderjs-jquery/blob/master/LICENSE.md).\n",
      "version": "0.2.0",
      "publisher": {
        "name": "cksource",
        "email": "npm@cksource.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T08:41:18.803Z"
    },
    {
      "name": "cortex-dev-tools",
      "description": "Serve cortex files for localhost",
      "readme": "# cortex-dev-tools [![NPM version](https://badge.fury.io/js/cortex-dev-tools.svg)](http://badge.fury.io/js/cortex-dev-tools) [![Build Status](https://travis-ci.org/cortexjs/cortex-dev-tools.svg?branch=master)](https://travis-ci.org/cortexjs/cortex-dev-tools) [![Dependency Status](https://gemnasium.com/cortexjs/cortex-dev-tools.svg)](https://gemnasium.com/cortexjs/cortex-dev-tools)\n\nA tools set for development usage when using cortex.\n\n## Install\n\n```bash\n$ npm install cortex-dev-tools -g\n```\n\n## Usage\n\n### debug server for neocortex-4j 0.2.2\n\nStart debug server serve resource files via chrome extension. (You should run `cortex install` and `cortex build` before debug):\n\n```bash\n$ ctx-dserver -E alpha -p 5050\n```\n\n\n### proxy\n\nStart proxy in dev folder of your module (You should run `cortex install` and `cortex build` before debug):\n\n```bash\n$ ctx-proxy -b www.example.com -p 5050\n```\n\nThen configure proxy of your browser to `localhost:5050`. Refresh the page, js/css files will be loaded from your local directory.\n\n\n## Licence\n\nMIT\n",
      "version": "0.2.1",
      "publisher": {
        "name": "villadora",
        "email": "jky239@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:42.836Z"
    },
    {
      "name": "gitinfo-brunch",
      "description": "Adds git info about your build in a file.",
      "readme": "# gitinfo-brunch\n\nAdds git information about your build to a JSON file.\n\n## Usage\nInstall the plugin via npm with `npm install --save gitinfo-brunch`.\n\nOr, do manual install:\n\n* Add `\"gitinfo-brunch\": \"x.y.z\"` to `package.json` of your brunch app.\n  Pick a plugin version that corresponds to your minor (y) brunch version.\n* If you want to use git version of plugin, add\n`\"gitinfo-brunch\": \"git+https://github.com/KATT/gitinfo-brunch.git\"`.\n\n__Note:__ The entry in your `package.json` file must come before any other plugins which process Javascript (such as javascript-brunch).\n\n## Config\n\n```coffee\nplugins:\n  gitinfo:\n    fileName: 'version.json'\n    outputDirectory: 'public'\n    enabled: true\n```\n",
      "version": "0.1.2",
      "publisher": {
        "name": "katt",
        "email": "alexander@n1s.se",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:44.801Z"
    },
    {
      "name": "kevoree-chan-websocket",
      "description": "Kevoree Channel using WebSocket protocol",
      "readme": "## kevoree-chan-websocket",
      "version": "3.0.0-SNAPSHOT",
      "publisher": {
        "name": "leiko",
        "email": "max.tricoire@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:45.293Z"
    },
    {
      "name": "vern-notify-enterprise",
      "description": "Notification handling for vern. Communication for server to mail, server to server, server to sms, etc",
      "readme": "#Copyright Notice\n\nVERN is copyright 2014 uh-sem-blee, Co. Built by typefoo.\n\n#License\n\nYou may not use, alter, or redistribute this code without permission from uh-sem-blee, Co.\n\n# VERN - Notify Service\n\nHandles Email, SMS, Push Notifications, and vern-2-vern communications\n\n* Note that email is the only one complete at this time *\n\n## Configuration Requirements\n\n```javascript\nemail_notifications: true,\ndevelopment: {\n  use_smtp: true,\n  smtp_service: 'SMTP',\n  smtp_host: 'email-smtp.us-east-1.amazonaws.com',\n  smtp_port: 465,\n  smtp_secure: true,\n  smtp_username: 'AWS_APIKEY',\n  smtp_password: 'AWS_APISECRET',\n  email_from_name: 'Website Admin',\n  email_from: 'hello@website.io',\n  mailer_defaults: {} // a key/value pair to be applied to all email templates\n}\n```\n\n## New VERN Controllers\n\n* AWSController\n\n## New VERN Models\n\n* AWSResourceModel\n\n## Example\n\n```javascript\n  $vern.controllers.mailer.configure().build([{\n    to: 'john@uh-sem-blee.com',\n    subject: 'A test from vern-notify',\n    template: 'testing',\n    vars: {\n      test: 'ABCDEFG'\n    }\n  },\n  {\n    to: 'john@typefoo.com',\n    subject: 'A test from vern-notify',\n    template: 'testing',\n    vars: {\n      test: '1234567890'\n    }\n  }]).then(function(mailer) {\n    console.log(mailer.templates);\n    mailer.send().then(function(res) {\n      console.log(res);\n    }).fail(function(err) {\n      console.log(err.stack);\n    });\n  }).fail(function(err) {\n    console.log(err);\n  });\n```\n",
      "version": "0.0.8",
      "publisher": {
        "name": "typefoo",
        "email": "hello@typefoo.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:17.250Z"
    },
    {
      "name": "inherits2",
      "description": "util.inherits method with extra argument to add properties",
      "readme": "inherits2\n=========\n\nutil.inherits with an extra argument to add properties.\n\n````js\nfunction Person() {}\nPerson.prototype.getType = function() {\n    return 'person';\n};\n\nPerson.prototype.getName = function() {\n    return 'joe';\n};\n\nfunction Ninja() {\n    Person.apply(this, arguments);\n}\n\ninherits(Ninja, Person, {\n    getType: function() {\n        return 'ninja';\n    }\n});\n\nvar ninja = new Ninja();\n\nassert.equal('joe', ninja.getName());\nassert.equal('ninja', ninja.getType());\nassert.equal('person', Ninja.super_.prototype.getType.call(ninja));\n````\n",
      "version": "0.0.1",
      "publisher": {
        "name": "jtangelder",
        "email": "j.tangelder@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:19.179Z"
    },
    {
      "name": "protagonist-sourcemap",
      "description": "API Blueprint Parser with exporting sourcemaps",
      "readme": "![logo](https://raw.github.com/apiaryio/api-blueprint/master/assets/logo_apiblueprint.png)\n\n# Protagonist [![Build Status](https://travis-ci.org/apiaryio/protagonist.png?branch=master)](https://travis-ci.org/apiaryio/protagonist)\n### API Blueprint Parser for Node.js\nProtagonist is a Node.js wrapper for the [Snow Crash](https://github.com/apiaryio/snowcrash) library.\n\nAPI Blueprint is Web API documentation language. You can find API Blueprint documentation on the [API Blueprint site](http://apiblueprint.org).\n\n## Install\nThe best way to install Protagonist is by using its [NPM package](https://npmjs.org/package/protagonist).\n\n```sh\n$ npm install protagonist\n```\n\n## Getting started\n\n```js\nvar protagonist = require('protagonist');\n\nprotagonist.parse('# My API', function(error, result) {\n    if (error) {\n        console.log(error);\n        return;\n    }\n  \n    console.log(result.ast);\n});\n```\n\n### Parsing Result\n\nParsing this blueprint: \n\n```\n# GET /1\n+ response\n```\n\nwill produce the following object (`result` variable):\n\n```json\n{\n  \"ast\": {\n    \"_version\": \"2.0\",\n    \"metadata\": [],\n    \"name\": \"\",\n    \"description\": \"\",\n    \"resourceGroups\": [\n      {\n        \"name\": \"\",\n        \"description\": \"\",\n        \"resources\": [\n          {\n            \"name\": \"\",\n            \"description\": \"\",\n            \"uriTemplate\": \"/1\",\n            \"model\": {},\n            \"parameters\": [],\n            \"actions\": [\n              {\n                \"name\": \"\",\n                \"description\": \"\",\n                \"method\": \"GET\",\n                \"parameters\": [],\n                \"examples\": [\n                  {\n                    \"name\": \"\",\n                    \"description\": \"\",\n                    \"requests\": [],\n                    \"responses\": [\n                      {\n                        \"name\": \"200\",\n                        \"description\": \"\",\n                        \"headers\": [],\n                        \"body\": \"\",\n                        \"schema\": \"\"\n                      }\n                    ]\n                  }\n                ]\n              }\n            ]\n          }\n        ]\n      }\n    ]\n  },\n  \"warnings\": [\n    {\n      \"code\": 6,\n      \"message\": \"missing response HTTP status code, assuming 'Response 200'\",\n      \"location\": [\n        {\n          \"index\": 12,\n          \"length\": 9\n        }\n      ]\n    }\n  ]\n}\n```\n\n#### Keys Description\n\n+ `ast` ... This is the abstract syntax tree (AST) of the parsed blueprint. \n\n    The structure under this key is **1:1** with the [AST Blueprint serialization JSON media type v2.0](https://github.com/apiaryio/api-blueprint-ast#json-serialization) – `vnd.apiblueprint.ast.raw+json; version=2.0`.\n\n+ `warnings` ... Array of the parser warnings as occurred during the parsing\n    + `code` ...  Warning [group](https://github.com/apiaryio/snowcrash/blob/master/src/SourceAnnotation.h#L128) code\n    + `message` ... Warning message\n    + `location` ... Array of (possibly non-continuous) locations in the source blueprint\n        + `index` ... Zero-based index of the character where the warning occurs\n        + `lenght` ... Number of the characters from index where the warning occurs\n\n## Hacking Protagonist\nYou are welcome to contribute. Use following steps to build & test Protagonist.\n\n### Build\nProtagonist uses [node-gyp](https://github.com/TooTallNate/node-gyp) build tool. \n\n1. If needed, install node-gyp:\n\n    ```sh\n    $ npm install -g node-gyp\n    ```\n\n2. Clone the repo + fetch the submodules:\n\n    ```sh\n    $ git clone git://github.com/apiaryio/protagonist.git\n    $ cd protagonist\n    $ git submodule update --init --recursive\n    ```\n    \n3. Build:\n    \n    ```sh\n    $ node-gyp configure\n    $ node-gyp build    \n    ```\n\n### Test\nInside the protagonist repository run:\n\n```sh\n$ npm install\n$ npm test\n```\n    \n### Contribute\nFork & Pull Request. \n\n## License\nMIT License. See the [LICENSE](https://github.com/apiaryio/protagonist/blob/master/LICENSE) file.\n",
      "version": "0.14.2",
      "publisher": {
        "name": "pksunkara",
        "email": "pavan.sss1991@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:24.630Z"
    },
    {
      "name": "perfect-resize",
      "description": "Robust resize handles for your HTML5 apps and websites",
      "readme": "# perfect-resize\n\nRobust, no-frill, stylable resize handles for HTML5 apps\n\n## How to install\n\n```\nnpm install perfect-resize\n```\n\n## Usage\n\nSee ``doc/demo.html``. \n\n * Setup a ``display: flex; box-sizing: border-box;`` container with two ``div`` children.\n * Make the main pane ``flex: 1;`` and give it a ``min-width``.\n * Set the sidebar's ``width`` and ``min-width`` (or ``height``, if vertical).\n * Include ``lib/perfectResize.js`` in your project.\n * Create the handle by calling ``perfectResize( document.getElementById('#sidebar'), 'right' )``\n\nYou can pass ``{ collapsable: true }`` as a third argument to enable double-click-to-collapse.\n\n## Browser support\n\n  * Looks and feels perfect on Firefox 32, Chrome 37\n  * Works in Internet Explorer 11 but cursor flickers",
      "version": "1.0.1",
      "publisher": {
        "name": "elisee",
        "email": "elisee@sparklinlabs.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:25.778Z"
    },
    {
      "name": "sre-gulp-rjs",
      "description": "A gulp interface to require.js",
      "readme": "# gulp-rjs [![NPM version][npm-image]][npm-url]\n\n> r.js optimizer plugin for [gulp](https://github.com/wearefractal/gulp)\n\n## Usage\n\nFirst, install `gulp-rjs` as a development dependency:\n\n```shell\nnpm install --save-dev gulp-rjs\n```\n\nThen, use it in your `gulpfile.js`:\n```javascript\nvar rjs = require(\"gulp-rjs\");\ngulp.src('app/scripts/*.js')\n\t.pipe(gulp.dest('./dist/scripts'))\n\t.pipe(rjs({baseUrl:'dist/scripts'}))\n```\n## License\n\n[MIT License](http://en.wikipedia.org/wiki/MIT_License)\n\n[npm-url]: https://npmjs.org/package/gulp-rjs\n[npm-image]: https://badge.fury.io/js/gulp-rjs.png\n",
      "version": "0.1.1",
      "publisher": {
        "name": "sre",
        "email": null,
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:47.743Z"
    },
    {
      "name": "batch-scale",
      "description": "Batch scale and rename images.",
      "readme": "ERROR: No README data found!",
      "version": "0.0.0",
      "publisher": {
        "name": "louderbj",
        "email": "john@johnlouderback.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:50.589Z"
    },
    {
      "name": "hubot-looking-il",
      "description": "A hubot plugin/scripts to get funny blog post from http://kimjongillookingatthings.tumblr.com/",
      "readme": "Computer dogs Hubot Scripts\n==============================\n\nThanks to [Compuputer Dogs](https://github.com/epinault/hubot-computerdogs) for doing all the work!\n\n[Hubot](http://hubot.github.com/) script to interface with the funny post from Kim Jong Il Looking At Things blog\n\n## Installation\n\nUpdate Hubot's package.json to install hubot-looking-il from npm, and update Hubot's external-scripts.json file to include the hubot-looking-il module.\n\n### Update the files to include the hubot-looking-il module:\n\n#### package.json\n    ...\n    \"dependencies\": {\n      \"hubot\":        \">= 2.4.0 < 3.0.0\",\n      ...\n      \"hubot-looking-il\": \">= 0.0.1\"\n    },\n    ...\n\n#### external-scripts.json\n    [\"hubot-awesome-module\",\"other-cool-npm-script\",\"hubot-looking-il\"]\n\nRun `npm install` to install hubot-looking-il and dependencies.\n\n## Practical Use\n\nUse `hubot help` or check the looking-il.coffee file to get the full list of options with short descriptions. \n\n   dogs\n\n## TODO\n\n* Retry on error\n* Report when service is down\n",
      "version": "0.0.2",
      "publisher": {
        "name": "wycleffsean",
        "email": "wycleffsean@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:51.122Z"
    },
    {
      "name": "lacona-phrase-suggester",
      "description": "Lacona phrase that accepts all input but makes programmatically defined suggestions",
      "readme": "lacona-phrase-suggester\n=======================\n\nLacona phrase that accepts all input but makes suggestions\n",
      "version": "0.2.0",
      "publisher": {
        "name": "brandonhorst",
        "email": null,
        "url": null
      },
      "lastPublishedAt": "2015-03-24T08:41:18.935Z"
    },
    {
      "name": "benderjs-chai",
      "description": "Chai assertions adapter for Bender.js",
      "readme": "# benderjs-chai\n\n[Chai](http://chaijs.com) assertions adapter for Bender.js\n\n## Installation\n\n```\nnpm install benderjs-chai\n```\n\n## Usage\n\nAdd `benderjs-chai` to the `plugins` array in your `bender.js` configuration file:\n\n```javascript\nvar config = {\n    applications: {...}\n\n    browsers: [...],\n\n    plugins: ['benderjs-chai'], // load the plugin\n\n    tests: {...}\n};\n\nmodule.exports = config;\n```\n\nFrom now on [Chai APIs](http://chaijs.com/api/) - `should`, `assert` and `expect` - will be available in the global namespace of a test page.\n\n## License\n\nMIT, for license details see: [LICENSE.md](https://github.com/benderjs/benderjs-chai/blob/master/LICENSE.md).\n",
      "version": "0.2.0",
      "publisher": {
        "name": "cksource",
        "email": "npm@cksource.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T08:41:20.341Z"
    },
    {
      "name": "uberjs",
      "description": "Uber API Client",
      "readme": "## This does not use the official api, it is a library for interfacing with the actual app.\nHow is this different from the official api?  This allows you to do everything the app does, it's not limited. \n\nIf you are looking for the official api, check out uber's api.\n\n# Uber.js\n> A semi-completed node library of the Uber Api\n\n\n\n### Install\n---\n+ `npm install uber.js --save`\n\n\n### First steps\n---\n+ Get token. \n    + Either use the included cli --> `$ node node_modules/uber.js/bin/getToken.js`   \n    + Or snoop it from https://m.uber.com/cn\n    + **make note of your token**\n+ Get location\n    + Either use the included cli --> `$ node node_modules/uber.js/bin/getCoordinates.js`\n    + Or use an online geolocation\n    + **take note of lat and long**\n\n\n\n### Use\n> with a fixed location\n\n```js\nvar UberClient = require('uber.js');\n\n// Must init with token (str) and location (obj)\nvar client = new UberClient(token, {longitude: '', latitude: ''});\n\n\n// Will return list of cars near location\nclient.pingClient(function(err, cars) {\n    if (err) console.log(err);\n    else {\n        console.log(cars);\n    }\n});\n\n\n/* Schedule a pickup at a certain location.\n * caution on this one\n */\nvar pickupLocation = {\n    longitude: 38.897096,\n    latitude: -77.036545\n}\nclient.pickup(pickupLocation, function(err, resp) {\n    if(err) console.log(err)\n    else {\n        console.log(resp);\n    }\n});\n\n\n// Cancel a pickup at a certain location.\nclient.cancel(function(err, resp) {\n    if (err) console.log(err);\n    else {\n        console.log(resp);\n    }\n});\n\n```\n\n### Use\n> with variable location\n\n```js\n\napp.post('/scheduleUber', function(req, res) {\n  var token = req.body.token;\n  var location = {\n    longitude: req.body.longitude,\n    latitude: req.body.latitude\n  };\n\n  var client = new Uber(token, location);\n\n  client.pickup(location, function(err, response) {\n    if (err) res.send(err);\n    else {\n      res.send('Your uber is scheduled and shall arrive shortly!');\n    }\n  });\n});\n\n```\n\n\n### API\n+ `Client`\n    + Constructor\n    + param `token` uber token\n    + param `location` object of `longitude` & `latitude`\n+ `pingClient`\n    + param `callback(error, response)`\n    + returns list of cars around you\n+ `pickup`\n    + param `location` object. Must include `longitude` & `latitude` properties\n    + param `callback(error, response)`\n    + returns a response if the cab is scheduled.\n+ `cancel`\n    + param `callback(error, response)`\n    + returns a response if cab is cancelled.\n\n#### This Api also includes helpers for generating tokens and geocoding on the fly\n\n  + `getToken` **not reconmended**\n    + param `email` str uber account email\n    + param `password` str uber password\n    + param `callback` err token\n    + returns token from uber.com/cn\n\n  + `getCoordinates`\n    + param `address` str an address to geocode\n    + param `callback` err location\n    + returns object of long lat\n\n#### Example\n```js\nvar Uber = require('uber.js');\n\napp.get('/getcars', function(req, res) {\n  var creds = {\n    email: req.body.email,\n    password: req.body.password\n  }\n  var address = req.body.address;\n    \n  Uber.getToken(creds.email, creds.password, function(err, token) {\n    // handle err omitted\n    Uber.getCoordinates(address, function(err, location) {\n      // handle err omitted\n      var client = new Uber(token, location);\n\n      client.doStuff();\n    });\n\n  });\n\n});\n```\n\n\n\n",
      "version": "1.1.1",
      "publisher": {
        "name": "jgeller",
        "email": null,
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:17.929Z"
    },
    {
      "name": "ember-cli-topcoat",
      "description": "Topcoat - CSS for clean and fast web apps.",
      "readme": "# Ember-CLI Addon for [Topcoat](http://topcoat.io)\n\nTopcoat - CSS for clean and fast web apps. \n\n## Installation\n\n* `git clone` this repository\n* `npm install`\n* `bower install`\n\n## Running\n\n* `ember server`\n* Visit your app at http://localhost:4200.\n\n## Running Tests\n\n* `ember test`\n* `ember test --server`\n\n## Building\n\n* `ember build`\n\nFor more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).\n",
      "version": "0.1.2",
      "publisher": {
        "name": "taras",
        "email": "tarasm@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:27.512Z"
    },
    {
      "name": "hubot-cool-ascii-faces",
      "description": "Hubot script that displays cool ascii faces",
      "readme": "[![NPM version](http://img.shields.io/npm/v/hubot-cool-ascii-faces.svg?style=flat)](https://www.npmjs.org/package/hubot-cool-ascii-faces)\n[![Build Status](http://img.shields.io/travis/okize/hubot-cool-ascii-faces.svg?style=flat)](https://travis-ci.org/okize/hubot-cool-ascii-faces)\n[![Dependency Status](http://img.shields.io/david/okize/hubot-cool-ascii-faces.svg?style=flat)](https://david-dm.org/okize/hubot-cool-ascii-faces)\n[![Downloads](http://img.shields.io/npm/dm/hubot-cool-ascii-faces.svg?style=flat)](https://www.npmjs.org/package/hubot-cool-ascii-faces)\n\n# Hubot: Cool Ascii Faces\n\nHubot script for [Max Ogden's](https://github.com/maxogden) [Cool Ascii Faces](https://github.com/maxogden/cool-ascii-faces).\n\n## Usage\n\n```\n[okize] hubot face me\n[hubot] ʕ•ᴥ•ʔ\n```\n\n## Installation\n\nAdd the package `hubot-cool-ascii-faces` as a dependency in your Hubot `package.json` file.\n\n```javascript\n\"dependencies\": {\n  \"hubot\":              \"2.x\",\n  \"hubot-scripts\":      \"2.x\",\n  \"hubot-cool-ascii-faces\": \"1.0.x\"\n}\n```\nRun the following command to make sure the module is installed.\n\n    $ npm install hubot-cool-ascii-faces\n\nTo enable the script, add the `hubot-cool-ascii-faces` entry to the `external-scripts.json` file (you may need to create this file).\n\n    [\"hubot-cool-ascii-faces\"]",
      "version": "1.0.10",
      "publisher": {
        "name": "okize",
        "email": "okize123@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:34.321Z"
    },
    {
      "name": "selenium-download",
      "description": "allow downloading of latest selenium standalone server and chromedriver",
      "readme": "# selenium-download\n\nThis module allows you\nto download the latest versions\nof the selenium standalone server\nand the chromedriver.\n\nKeep up to date with changes\nby checking the\n[releases](https://github.com/groupon-testium/selenium-download/releases).\n\n## example\n\n```coffee\nselenium = require 'selenium-download'\n\nselenium.ensure \"#{__dirname}/bin\", (error) ->\n  console.error error.stack if error?\n  process.exit(0)\n```\n\n## api\n\n### selenium.ensure\n\n`ensure` ensures that\nthe selenium.jar and chromedriver\nfiles are in the path provided.\n\nIf they are not,\nthe latest versions of both\nare downloaded into that path.\n\n### selenium.update\n\n`update` forces\nthe selenium.jar and chromedriver\nfiles to be the latest available versions.\nPulls from temp directory if available.\n\n### selenium.forceUpdate\n\n`forceUpdate` forces\nthe selenium.jar and chromedriver\nfiles to be the latest available versions.\nClears temp directory before checking.\n\n",
      "version": "2.0.0",
      "publisher": {
        "name": "smassa",
        "email": "endangeredmassa@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T08:41:19.126Z"
    },
    {
      "name": "backbone.trackit",
      "description": "A small, opinionated [Backbone.js](http://documentcloud.github.com/backbone) plugin that manages model changes that accrue between saves, giving a Model the ability to undo previous changes, trigger events when there are unsaved changes, and opt in to bef",
      "readme": "# Backbone.trackit\n\nA small, opinionated [Backbone.js](http://documentcloud.github.com/backbone) plugin that manages model changes that accrue between saves, giving a Model the ability to undo previous changes, trigger events when there are unsaved changes, and opt in to before unload route handling.\n\n## Introduction\n\nAt the heart of every JavaScript application is the model, and no frontend framework matches the extensible, well-featured model that Backbone provides. To stay unopinionated, Backbone's model only has a basic set of functionality for managing changes, where the current and previous change values are preserved until the next change. For example:\n\n```js\nvar model = new Backbone.Model({id:1, artist:'John Cage', 'work':'4\\'33\"'});\n\nmodel.set('work', 'Amores');\nconsole.log(model.changedAttributes());  // >> Object {work: \"Amores\"}\nconsole.log(model.previous('work'));  // >> 4'33\"\n\nmodel.set('advisor', 'Arnold Schoenberg');\nconsole.log(model.changedAttributes());  // >> Object {advisor: \"Arnold Schoenberg\"}\n\n```\n\nBackbone's change management handles well for most models, but the ability to manage multiple changes between successful save events is a common pattern, and that's what Backbone.trackit aims to provide. For example, the following demonstrates how to use the api to `startTracking` unsaved changes, get the accrued `unsavedAttributes`, and how a call to `save` the model resets the internal tracking:\n\n```js\nvar model = new Backbone.Model({id:1, artist:'Samuel Beckett', 'work':'Molloy'});\nmodel.startTracking();\n\nmodel.set('work', 'Malone Dies');\nconsole.log(model.unsavedAttributes());  // >> Object {work: \"Malone Dies\"}\n\nmodel.set('period', 'Modernism');\nconsole.log(model.unsavedAttributes());  // >> Object {work: \"Malone Dies\", period: \"Modernism\"}\n\nmodel.save({}, {\n    success: function() {\n        console.log(model.unsavedAttributes());  // >> false\n    }\n});\n\n```\n\nIn addition, the library adds functionality to `resetAttributes` to their original state since the last save, triggers an event when the state of `unsavedChanges` is updated, and has options to opt into prompting to confirm before routing to a new context.\n\n\n## Download\n\n[0.1.0 min](https://raw.github.com/NYTimes/backbone.trackit/master/dist/0.1.0/backbone.trackit.min.js) - 2.6k\n\n[0.1.0 gz](https://raw.github.com/NYTimes/backbone.trackit/master/dist/0.1.0/backbone.trackit.min.js.gz) - 1k\n\n[edge](https://raw.github.com/NYTimes/backbone.trackit/master/backbone.trackit.js)\n\n\n## API\n\n### startTracking - *model.startTracking()*\n\nStart tracking attribute changes between saves.\n\n### restartTracking - *model.restartTracking()*\n\nRestart the current internal tracking of attribute changes and state since tracking was started.\n\n### stopTracking - *model.stopTracking()*\n\nStop tracking attribute changes between saves.\n\nIf an `unsaved` configuration was defined, it is important to call this when a model goes unused/should be destroyed (see the `unsaved` configuration for more information).\n\n### unsavedAttributes - *model.unsavedAttributes([attributes])*\n\nSymmetric to Backbone's `model.changedAttributes()`, except that this returns a hash of the model's attributes that have changed since the last save, or `false` if there are none. Like `changedAttributes`, an external attributes hash can be passed in, returning the attributes in that hash which differ from the model.\n\n### resetAttributes - *model.resetAttributes()*\n\nRestores this model's attributes to their original values since the last call to `startTracking`, `restartTracking`, `resetAttributes`, or `save`.\n\n### unsavedChanges (event)\n\nTriggered after any changes have been made to the state of unsaved attributes. Passed into the event callback is the boolean value for whether or not the model has unsaved changes, and a cloned hash of the unsaved changes. This event is only triggered after unsaved attribute tracking is started (`startTracking`) and will stop triggering after tracking is turned off (`stopTracking`).\n\n```js\nmodel.on('unsavedChanges', function(hasChanges, unsavedAttrs, model) {\n    ...\n});\n```\n\n### trackit_silent (option)\n\nWhen passed as an option and set to `true`, trackit will not track changes when setting the model.\n\n```js\nmodel.fetch({ ..., trackit_silent:true});\nmodel.set({artist:'John Cage'}, {trackit_silent:true});\nconsole.log(model.unsavedAttributes()); // false\n```\n\n### unsaved (configuration) - *model.unsaved*\n\nThe `unsaved` configuration is optional, and is used to opt into and configure unload handling when route/browser navigation changes and the model has unsaved changes. Unload handling warns the user with a dialog prompt, where the user can choose to continue or stop navigation. Unfortunately, both handlers (browser and in-app; `unloadWindowPrompt` and `unloadRouterPrompt`) are needed  becuase they are triggered in different scenarios.\n\nNote: Any model that defines an `unsaved` configuration and uses `startTracking` should call `stopTracking` (when done and if there are unsaved changes) to remove any internal references used by the library so that it can be garbage collected.\n\n#### prompt - default: *\"You have unsaved changes!\"*\n\nWhen navigation is blocked because of unsaved changes, the given `prompt` message will be displayed to the user in a confirmation dialog. Note, Firefox (only) will not display customized prompt messages; instead, Firefox will prompt the user with a generic confirmation dialog.\n\n#### unloadWindowPrompt - default: *false*\n\nWhen `true` prompts the user on browser navigation (back, forward, refresh buttons) when there are unsaved changes. This property can be defined with a function callback that should return `true` or `false` depending on whether or not navigation should be blocked. Like most Backbone configuration, the callback may be either the name of a method on the model, or a direct function body.\n\n#### unloadRouterPrompt - default: *false*\n\nWhen `true` prompts the user on in-app navigation (`router.navigate('/path')`) when there are unsaved changes. This property can be defined with a function callback that should return `true` or `false` depending on whether or not navigation should be blocked. Like most Backbone configuration, the callback may be either the name of a method on the model, or a direct function body.\n\n\n```js\nvar model = Backbone.Model.extend({\n    unsaved: {\n        prompt: 'Changes exist!',\n        unloadWindowPrompt: true,\n        unloadRouterPrompt: 'unloadRouter'\n    },\n    \n    unloadRouter: function(fragment, options) {\n        if (fragment == '/article/edit-body') return false;\n        return true;\n    }\n});\n```\n\n## FAQ\n\n- **Not an undo/redo plugin**  \n  If you are looking for an undo/redo plugin, check out [backbone.memento](https://github.com/derickbailey/backbone.memento)\n\n- **Why are there two unload handlers (`unloadWindowPrompt`, `unloadRouterPrompt`)?**  \n  Since navigation can be triggered by the browser (forward, back, refresh buttons) or through pushstate/hashchange in the app (by Backbone), a handler needs to be created for both methods.\n\n- **Why doesn't Firefox display my unload `prompt`?**  \n  You can find out their reasoning and leave a message for Mozilla [here](https://bugzilla.mozilla.org/show_bug.cgi?id=588292).\n\n## Change log\n\n### Master\n\n- Added `trackit_silent` option that can be passed in `options` hashes so that attriubutes can be set into a model without being tracked.\n\n- Added ability for new models (without ids) to be notified of unsaved changes after a successful call to `model.save()`.\n\n- Added `model` as third parameter to `unsavedChanges` event callback.\n\n- Added support for the `patch` method on `model#save`.\n\n### 0.1.0\n\n- Initial version; extracted from an internal project (Blackbeard) that powers our News Services at The New York Times.\n\n## License\n\nMIT",
      "version": "0.1.0",
      "publisher": {
        "name": "arubin",
        "email": "alan@frubin.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T08:41:20.935Z"
    },
    {
      "name": "geohash64",
      "description": "ptyhon port attempt at a google maps base64 geohash of https://gist.github.com/signed0/2031157",
      "readme": "geohash64\n==============\n[![Dependencies](https://david-dm.org/nmccready/geohash64.png)](https://david-dm.org/nmccready/geohash64)&nbsp;\n[![Dependencies](https://david-dm.org/nmccready/geohash64.png)](https://david-dm.org/nmccready/geohash64)&nbsp;\n[![Build Status](https://travis-ci.org/nmccready/geohash64.png?branch=master)](https://travis-ci.org/nmccready/geohash64)\n\nProject is attempt of porting:\n - google maps base64:\n  - [google algorithm](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)\n  - [Nathan Villaescusa's, ptyhon code](https://gist.github.com/signed0/2031157)\n\n\n - [python-geohash64](https://code.google.com/p/python-geohash64/source/browse/trunk/geohash64.py) base64 geo encodings to nodejs. (**eventually**)\n\ninstall\n=======\n\nAnd then install with [npm](http://npmjs.org):\n\n    npm install\n\nuse\n===\nOverall you should refer to the specs..\n\nBut to enlighten everyone here are some specs copied here:\n\n    geohash64 = require 'geohash64'\n    manyHashes = ['_p~iF~ps|U', '_atqG`~oia@', '_flwFn`faV', '_t~fGfzxbW']\n    fullHash = manyHashes.reduce((prev, current) ->\n      prev + current)\n\n    #fullHash should be '_p~iF~ps|U_atqG`~oia@_flwFn`faV_t~fGfzxbW'\n    test1 = geohash64.encode(manyPoints) == fullHash\n\n    test2 = _.Equal(geohash64.decode(fullHash,true), manyPoints)\n\n    throw new Error('Hashes are not what expected!') unless (test1 and test2)\n",
      "version": "1.0.2",
      "publisher": {
        "name": "nmccready",
        "email": "nemtcan@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:24.930Z"
    },
    {
      "name": "fxconsole",
      "description": "Remote JavaScript console for Firefox",
      "readme": "# fxconsole\n`fxconsole` is a remote Javascript console for Firefox that runs in your terminal:\n\n![fxconsole in Terminal](http://i.imgur.com/iKXwCsD.png)\n\n## Install\nWith [node.js](http://nodejs.org/) and the npm package manager:\n\n\tnpm install fxconsole -g\n\nYou can now use `fxconsole` from the command line.\n\n## Connecting\n\n### Desktop Firefox\n1. Enable remote debugging (You'll only have to do this once)\n 1. Open the DevTools. **Web Developer** > **Toggle Tools**\n 2. Visit the settings panel (gear icon)\n 3. Check \"Enable remote debugging\" under Advanced Settings\n\n2. Listen for a connection\n 1. Open the Firefox command line with **Tools** > **Web Developer** > **Developer Toolbar**.\n 2. Start a server by entering this command: `listen 6000` (where `6000` is the port number)\n\n### Firefox for Android\nFollow the instructions in this short [Hacks video](https://www.youtube.com/watch?v=Znj_8IFeTVs)\n\n### FirefoxOS Simulator\nThis one is a bit hacky right now, and object inspection doesn't work yet, but feel free to try. The `.tabs` command lists the currently open apps in the simulator.\n\n1. Install [FirefoxOS Simulator](https://addons.mozilla.org/en-us/firefox/addon/firefox-os-simulator/) in Firefox\n2. Start the Simulator with **Tools** > **Web Developer** > **Firefox OS Simulator**\n3. Get the port the Simulator is listening on with this terminal command: `lsof -i -P | grep -i \"b2g\"` in Linux/Mac, or using [fx-ports](https://github.com/nicola/fx-ports).\n4. Start `fxconsole` and with the `--port` argument.\n\n## Usage\n\n```\nfxconsole --port 6000 --host 10.251.34.157\n```\n\n## Commands\n\nThere are two extra REPL commands available beyond the standard node.js commands. `.tabs` lists the open tabs in Firefox. `.switch 2` switches to evaluating in a tab. The argument is the index of the tab to switch to.\n",
      "version": "0.1.0",
      "publisher": {
        "name": "harth",
        "email": "fayearthur@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:31.103Z"
    },
    {
      "name": "hoodie-plugin-user-data",
      "description": "Hoodie plugin to store custom data on user accounts",
      "readme": "# Hoodie Pluging User Data\n\nA plugin that only extends the frontend Hoodie API\nwith `hoodie.userData` object. It's a temporary\nworkaround until the ability to manage user data\nlands in Hoodie core. Follow status at:\nhttps://github.com/hoodiehq/discussion/issues/47\n\n## API\n\n```js\n// load user data from server\nhoodie.userData.fetch()\n  .done( showUserData )\n  .fail( handleError )\n\n// update user data on server\nhoodie.userData.update( changedProperties)\n  .done( showNewUserData )\n  .fail( handleError )\n```\n\nNote that user data is not cached, it's always\nfetched and updated right in the `_users/` document.\n",
      "version": "1.0.0",
      "publisher": {
        "name": "gr2m",
        "email": "gregor@martynus.net",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:31.464Z"
    },
    {
      "name": "ienoopen",
      "description": "Middleware for IE security. Set X-Download-Options to noopen.",
      "readme": "# IE, restrict untrusted HTML\n\nThis middleware sets the `X-Download-Options` header to `noopen` to prevent IE users from executing downloads in your site's context.\n\n```javascript\nvar ienoopen = require('ienoopen');\napp.use(ienoopen());\n```\n\nSome web applications will serve untrusted HTML for download. By default, some versions of IE will allow you to open those HTML files *in the context of your site*, which means that an untrusted HTML page could start doing bad things in the context of your pages. For more, see [this MSDN blog post](http://blogs.msdn.com/b/ie/archive/2008/07/02/ie8-security-part-v-comprehensive-protection.aspx).\n\nThis is pretty obscure, fixing a small bug on IE only. No real drawbacks other than performance/bandwidth of setting the headers, though.\n",
      "version": "0.1.0",
      "publisher": {
        "name": "evanhahn",
        "email": "me@evanhahn.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T06:26:06.083Z"
    },
    {
      "name": "dont-sniff-mimetype",
      "description": "Middleware to prevent mimetype from being sniffed",
      "readme": "# \"Don't infer the MIME type\" middleware\n\nSome browsers will try to \"sniff\" mimetypes. For example, if my server serves *file.txt* with a *text/plain* content-type, some browsers can still run that file with `<script src=\"file.txt\"></script>`. Many browsers will allow *file.js* to be run even if the content-type isn't for JavaScript. There are [some other vulnerabilities](http://miki.it/blog/2014/7/8/abusing-jsonp-with-rosetta-flash/), too.\n\nThis middleware to keep Chrome, Opera, and IE from doing this sniffing ([and Firefox soon](https://bugzilla.mozilla.org/show_bug.cgi?id=471020)). The following example sets the `X-Content-Type-Options` header to its only option, `nosniff`:\n\n```javascript\nvar nosniff = require('dont-sniff-mimetype');\napp.use(nosniff());\n```\n\n[MSDN has a good description](http://msdn.microsoft.com/en-us/library/gg622941%28v=vs.85%29.aspx) of how browsers behave when this header is sent.\n\nThis only prevents against a certain kind of attack.\n",
      "version": "0.1.0",
      "publisher": {
        "name": "evanhahn",
        "email": "me@evanhahn.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T06:26:17.905Z"
    },
    {
      "name": "url-download",
      "description": "Download files from web",
      "readme": "# url-download\n\n## Usage\n``` javascript\n  /** \n   * download\n   * @param {String | Array} url\n   * @param {String} dest\n   * return {EventEmitter}\n   */\n\n  download('http://nodejs.org/dist/v0.10.28/node.exe', './download')\n    .on('close', function () {\n      console.log('One file has been downloaded.');\n    });\n```\n\n## License\n(The MIT License)\n\nCopyright (c) 2013 Daniel Yang <miniflycn@justany.net>\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.",
      "version": "0.0.4",
      "publisher": {
        "name": "miniflycn",
        "email": "miniflycn@justany.net",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:26.222Z"
    },
    {
      "name": "kevoree-comp-fakeconsole",
      "description": "Kevoree component - FakeConsole - Displays incoming messages and allow message sending through a browser UI",
      "readme": "ERROR: No README data found!",
      "version": "3.0.0-SNAPSHOT",
      "publisher": {
        "name": "leiko",
        "email": "max.tricoire@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:28.849Z"
    },
    {
      "name": "phantconfig-zh1",
      "description": "A custom phant server configuration generated by data.sparkfun.com",
      "readme": "# phantconfig-zh1\n\nThis configuration for [phant](http://phant.io) was generated by the configuration tool hosted on [data.sparkfun.com](https://data.sparkfun.com/config).\n\n## Installation\nIf you have the latest stable version of [node.js](http://nodejs.org) installed, you can install this package using [npm](http://npmjs.org).\n\n    npm install -g phantconfig-zh1\n\n## Getting Started\nAfter installing the package, you can now start the server.\n\n    $ phantconfig-zh1\n\n## Modules\nThese modules were configured for a specific user. If you would like to configure your own copy of phant,\nplease visit [data.sparkfun.com/config](https://data.sparkfun.com/config).\n\n### HTTP\n* Port 44\n\n### Inputs\n* HTTP\n  * **metadata** - meta\n  * **keychain** - keychain\n\n### Outputs\n* HTTP\n  * **storage** - stream\n  * **keychain** - keychain\n\n### Storage\n* CSV\n  * **directory** - 'store-csv'\n  * **cap** - 0\n  * **chunk** - 262144\n* JSON\n  * **directory** - 'store-json'\n  * **cap** - 0\n  * **chunk** - 262144\n\n### Managers\n* Telnet\n  * **port** - 45\n  * **metadata** - meta\n  * **keychain** - keychain\n* HTTP\n  * **metadata** - meta\n  * **keychain** - keychain\n\n## License\nCopyright (c) 2014 SparkFun Electronics. Licensed under the GPL v3 license.\n\n",
      "version": "1.0.0",
      "publisher": {
        "name": "phant",
        "email": null,
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:32.825Z"
    },
    {
      "name": "rtc-badge",
      "description": "A simple 'powered by rtc.io' SVG badge",
      "readme": "# rtc-badge\n\nA simple \"powered by rtc.io\" badge for rtc.io demo sites.\n\n\n[![NPM](https://nodei.co/npm/rtc-badge.png)](https://nodei.co/npm/rtc-badge/)\n\n\n\n## Usage\n\n```js\ndocument.body.appendChild(require('rtc-badge')());\n\n```\n\n## License(s)\n\n### Apache 2.0\n\nCopyright 2014 Damon Oehlman <damon.oehlman@nicta.com.au>\n\n   Licensed under the Apache License, Version 2.0 (the \"License\");\n   you may not use this file except in compliance with the License.\n   You may obtain a copy of the License at\n\n     http://www.apache.org/licenses/LICENSE-2.0\n\n   Unless required by applicable law or agreed to in writing, software\n   distributed under the License is distributed on an \"AS IS\" BASIS,\n   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n   See the License for the specific language governing permissions and\n   limitations under the License.\n",
      "version": "1.1.1",
      "publisher": {
        "name": "damonoehlman",
        "email": "damon.oehlman@sidelab.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T06:13:59.203Z"
    },
    {
      "name": "pb-upload",
      "description": "Handy tool for uploading multiple bot files via the Pandorabots API",
      "readme": "pb-upload\n=========\n\nHandy tool for bulk uploading bot files to Pandorabots.\n\nUsage\n-----\n\n1. Install from npm\n\n```\nnpm install pb-upload\n```\n\n2. Include options and pass in to upload method\n\n```javascript\nvar uploader = require('pb-upload');\n\nvar options = {\n  host: 'aiaas.pandorabots.com',\n  app_id: YOUR_APP_ID,\n  botname: YOUR_BOTNAME,\n  dir: PATH_TO_FILE_DIRECTORY,\n  q: {\n    user_key: YOUR_USER_KEY\n  }\n}\n\nuploader(options, function(data) {\n  console.log(data);\n});\n```",
      "version": "0.0.3",
      "publisher": {
        "name": "djfdev",
        "email": "djfdev@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T06:26:07.167Z"
    },
    {
      "name": "graphlib",
      "description": "A directed and undirected multi-graph library",
      "readme": "# Graphlib\n\nGraphlib is a JavaScript library that provides data structures for undirected\nand directed multi-graphs along with algorithms that can be used with them.\n\n[![Build Status](https://secure.travis-ci.org/cpettitt/graphlib.png)](http://travis-ci.org/cpettitt/graphlib)\n\nTo learn more [see our Wiki](https://github.com/cpettitt/graphlib/wiki).\n\n# License\n\nGraphlib is licensed under the terms of the MIT License. See the\n[LICENSE](LICENSE) file\naor details.\n\n[npm package manager]: http://npmjs.org/\n",
      "version": "1.0.1",
      "publisher": {
        "name": "cpettitt",
        "email": "chris@samsarin.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T06:26:12.189Z"
    },
    {
      "name": "react.animate",
      "description": "state animation plugin for react.js",
      "readme": "React.Animate\n=============\n\nA simple state animation mixin for React.js\n\nPhilosophy\n------------\n\nReact.Animate is a different approach to animate based on state rather than direct DOM mutation using $.animate or similar.\n\nWhile it's great that you can use refs to get DOM nodes after render, the biggest benefit to using react is that there is always a direct, observable, and testable relationship between component props, state, and the rendered output.\n\nMutating the dom directly is an antipattern.\n\nWhat we really want to animate is not the DOM, it's component state.\n\nIf you think about animation as a transition from one state value from another, you can just interpolate state over an interval, and your component can rerender precisely in response to the current component state at every step.\n\nAt it's most simple, React.Animate allows you to transition between one state and another over a set interval.\n\n\n```javascript\nanimate: function(attr, targetValue, duration, ease) {\n  var cmp = this;\n\n  var interpolator;\n  if (_.isFunction(targetValue)) {\n    interpolator = targetValue;\n  } else {\n    interpolator = d3.interpolate(this.state[attr], targetValue);\n  }\n\n  return d3.transition()\n    .duration(duration || 500)\n    .ease(ease || \"cubic-in-out\")\n    .tween(attr, function() {\n      return function(t) {\n        cmp.setState(_.object([attr], [interpolator(t)]));\n      };\n    });\n}\n```\n\nthe included implemtation supports the same syntax as $.animate.\n\nyou can pass either\n\n```javascript\nthis.animate(properties [, duration ] [, easing ] [, complete ] );\n```\n\nor\n\n```javascript\nthis.animate(key, value [, duration ] [, easing ] [, complete ] );\n```\n\nExample\n------------\n\nReact.Animate can be included in any React class by adding it to the mixins array\n\nBy animating state instead of the DOM directly, we can define logic that acts during certain parts of our animations.\n\n```javascript\nvar component = React.createClass({\n  mixins: [React.Animate],\n  getInitialState: function() {\n    return {\n      width: 100\n    };\n  },\n  render: function() {\n    var heightBounds = [50, 100];\n\n    return React.DOM.div({\n      style: {\n        width: this.state.width,\n        height: Math.min(heightBounds[1], Math.max(heightBounds[0], this.state.width / 2))\n      },\n      onClick: this.randomSize\n    });\n  },\n  randomSize: function() {\n    this.animate({\n      width: _.random(20, 300)\n    }, 500, function() {\n      console.log(\"random size reached!\");\n    });\n  }\n});\n```\n\nview in [jsfiddle](http://jsfiddle.net/mWAnw/2/)\n\n\nInstallation\n------------\n\nReact.Animate can be installed with [bower](http://bower.io/) using\n\n```\nbower install react.animate --save\n```\n\nwhich will automatically pull the required React and Underscore dependencies.\n\nto use React.Animate, include it in your page or build process after React and Underscore\n\nDependencies\n------------\n\n[d3.js](http://d3js.org/) provides a variety of flexible [interpolators](https://github.com/mbostock/d3/wiki/Transitions#d3_interpolate) and [easing functions](https://github.com/mbostock/d3/wiki/Transitions#d3_ease).\n\n[underscore.js](http://underscorejs.org/) provides some functional sugar.\n\nLimitations\n------------\n\nDue to the nature of d3's transition system, starting a new animation on a component will cancel the current running animation. This will change in the future to allow concurrent animation of different properties at different speeds, easing, etc.\n",
      "version": "1.0.0",
      "publisher": {
        "name": "nutelac",
        "email": "herman.nutela@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T06:26:15.374Z"
    },
    {
      "name": "express-session-documentdb",
      "description": "Node.js express session store provider for Windows Azure DocumentDB",
      "readme": "# ExpressJS Session Store for Azure Document DB\n\nNode.js express session store provider for Windows Azure documentDB.\n\nAdapted from express-session-azure by Aaron Silvas.  \n\n## Install\n\n    npm install express-session-documentdb\n\n\n## Usage\n\nTypical usage:\n\n    var express = require('express');\n\tvar session = require('express-session');\n\tvar cookieParser = require('cookie-parser');\n\tvar DocumentDBSessionStore = require('express-session-documentdb');\n\n\tnconf = require('nconf');\n\tnconf.env().file({ file: 'config.json' });\n\n\tvar options = { host: nconf.get('documentdb:host'), \n\t\t\t\t\tauthKey: nconf.get('documentdb:authkey') };\n\n\tvar app = express();\n\n\tapp.use(cookieParser('azure ermahgerd'));\n\tapp.use(session({ store: new DocumentDBSessionStore(options) }));\t\n\n",
      "version": "0.1.2",
      "publisher": {
        "name": "lukevanhorn",
        "email": "luke@lukevanhorn.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T06:26:18.270Z"
    },
    {
      "name": "jalali-date",
      "description": "A Jalali to Gregorian converter with support of formatting output",
      "readme": "JDate\n=====\n\nA Jalali to Gregorian converter in Java-script with support of formatting output\n\n## Usage\n\nThe prefered way of using the lib is throw `componentjs`, but you can also use it with adding the script to your webpage. Just grab the minified or full-version of lib from [build directory](https://github.com/arashm/JDate/tree/master/build) and use it as usual:\n\n```html\n<head>\n  <script src=\"jdate.js\" type=\"text/javascript\" charset=\"utf-8\"></script>\n  <script src=\"jdate.min.js\" type=\"text/javascript\" charset=\"utf-8\"></script>\n</head>\n```\n\nThe full-version is useful for debugging. You may want to use minified version in production as it is smaller.\n\n### Initialization\n\nFor initializing `JDate` you may either pass an array of Jalali date to it or a `Date` object. If no parameter is passed, the default is today:\n\n```javascript\nvar JDate = require('jdate');\nvar jdate = new JDate; // => default to today\nvar jdate2 = new JDate([1393, 10,11]);\nvar jdate3 = new JDate(new Date(2014, 1, 3));\n\n```\n\n### API\n```javascript\njdate.date //=> [1393,5,13] An Array of Jalali Date\njdate._d // => Gregorian Date Object\n\n// Getters\njdate.getFullYear() // => 1393\njdate.getMonth() // => 5\njdate.getDate() // => 13\njdate.getDay() // => 1\n\n// Setters\njdate.setFullYear(1394)\njdate.setMonth(6)\njdate.setDate(12)\n\n// Formatting output\njdate.format('dddd DD MMMM YYYY') // => پنجشنبه 12 شهریور 1394\n\n// Static functions\nJDate.isLeapYear(1393) // => false\nJDate.daysInMonth(1393, 5) // => 31\nJDate.to_gregorian(1393,12,11) // => Gregorian Date object\nJDate.to_jalali(new Date) // => JDate object\n```\n\n## Formatting output\nUse `format()` and following conversion identifiers as follows:\n\n```javascript\ndate.format('dddd DD MMMM YYYY') //=> دوشنبه 6 امرداد 1393\n```\n\nThe conversion identifiers are as follows:\n\n| Identifier        | Description           | Example  |\n| ------------- | ------------- | ---------- |\n| `YYY` or `YYYY`      | Full Year (4 digits) | 1393 |\n| `YY`      | Year (2 digits)      |   93 |\n| `M` or `MM` | Month in number      |  returns `5` for `امرداد`   |\n| `MMM` or `MMMM` | Month in string | `امرداد` |\n| `D` or `DD` | Day in number | 26 |\n| `d` or `dd` | Abbreviation of day name in string | `۱ش` (for یکشنبه) |\n| `ddd` or `dddd` | Full day name in string | `یکشنبه` |\n\n\n## Contribute\n\nReport bugs and suggest feature in [issue tracker](https://github.com/arashm/Jalali-Calendar/issues). Feel free to `Fork` and send `Pull Requests`.\n\n## License\n\n[MIT](https://github.com/arashm/JDate/blob/master/LICENSE)\n",
      "version": "0.1.5",
      "publisher": {
        "name": "arashm",
        "email": "mousavi.arash@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:28.288Z"
    },
    {
      "name": "hyperbone-view",
      "description": "Automatic bindings to the DOM for Hyperbone Models",
      "readme": "# Hyperbone View\n\n[![Build Status](https://travis-ci.org/green-mesa/hyperbone-view.png?branch=master)](https://travis-ci.org/green-mesa/hyperbone-view)\n\n## Please note that this module is no longer being maintained. \n\n## (Having said that I've just updated it to stop using the deprecated replaceWholeText() functionality deprecated in Firefox and soon everythign else.. )\n\nIt has been replaced with [HalogenJS View](https://github.com/halogenjs/view).\n\n## Installing\n\n```sh\n$ npm install --save hyperbone-view\n```\n\n## Running tests\n\nOnce:\n```sh\n$ npm install -g grunt-cli browserify\n```\nOnce after cloning repo\n```sh\n$ npm install\n```\nRunning tests\n```sh\n$ npm test\n```\n\n## tl;dr \n\nPush style template system for Hyperbone (and probably Backbone) models, allowing strict model/view separation.\n\nYou get 'if', 'if-not', 'hb-trigger', 'hb-click-toggle', 'hb-with' and 'hb-bind' as the only custom attributes you need to learn [See paper on this subject](http://www.cs.usfca.edu/~parrt/papers/mvc.templates.pdf).\n\n## Features\n\n- Logicless moustache-eseque templates for attributes and innertext. \n- Define your own custom helpers to do advanced string processing\n- Hypermedia extensions: Automatically insert href attributes for recognised rels.\n- 'hb-trigger' custom attribute to trigger Hyperbone events on a model\n- 'if' custom attribute to conditionally display elements.\n- 'hb-bind' custom attribute to link an input to a model attribute\n- 'hb-with' to change scope of a template and render out collections (partials, in effect)\n- API for adding additional attributes for when you HAVE to touch the DOM.\n\n## Example\n\nHTML in your page:\n```html\n<div if=\"getting-name\" id=\"some-view\" class=\"{{type}}\">\n  <p>Hello, {{name}}</p>\n  <label>Enter your name: <input hb-bind=\"name\"></label>\n  <div class=\"description\">{{strip(description)}}</div>\n  <a rel=\"some-rel\"> Some link </a>\n  <a rel=\"self\" class=\"{{clicked}}\" hb-trigger=\"special-link-clicked\">A link to myself</a>\n  <ul hb-with=\"noodle-flavours\">\n    <li class=\"flavour {{className}}\"><a rel=\"self\">{{flavour}}</a></li>\n  </ul>\n</div>\n```\nJSON HAL document on the server\n```json\n{\n  \"_links\" : {\n    \"self\" : {\n      \"href\" : \"/a-link-to-me\"\n    },\n    \"some-rel\" : {\n      \"href\" : \"/some-link\"\n    }\n  },\n  \"description\" : \"This is __very__ exciting\",\n  \"type\" : \"testing-thing\",\n  \"_embedded\" : {\n    \"noodle-flavours\" : [\n      {\n        \"_links\" : {\n          \"self\" : {\n            \"href\" : \"/flavours/chicken\"\n          }\n        },\n        \"flavour\" : \"Chickenesque\",\n        \"classification\" : \"edible\"\n      },\n      {\n        \"_links\" : {\n          \"self\" : {\n            \"href\" : \"/flavours/beef\"\n          }\n        },\n        \"flavour\" : \"Spicy Beef substitute\",\n        \"classification\" : \"toxic\"\n      },\n      {\n        \"_links\" : {\n          \"self\" : {\n            \"href\" : \"/flavours/curry\"\n          }\n        },\n        \"flavour\" : \"Curry. Just Curry.\",\n        \"classification\" : \"edible\"\n      }\n    ]\n  }\n  \"name\" : \"\"\n}\n```\nPresume that we've loaded this JSON into a HyperboneModel instance..\n\n```js\n\nvar HyperboneView = require('hyperbone-view').HyperboneView;\n\n// we want to register a helper called 'strip'. This will be available to all Views in the system.\n\nrequire('hyperbone-view').registerHelper('strip', function( str ){\n  return markdownStripper( str )\n})\n\n// now we can create our view instance.\nnew HyperboneView({\n\n  // the model...\n  model : myHypermediaDocument,\n\n  // our view root\n  el : '#some-view'\n});\n\n// set our editing flag to true so that we can see our html\nmyHypermediaDocument.set('editing', true);\n\n// bind to a hyperbone event that'll trigger when the user\n// clicks on the particular link.\nmyHypermediaDocument.on('special-link-clicked', function( model ){\n  model.set('clicked', 'clicked');\n})\n\n```\nAs soon as the initial processing is done, our DOM has been transformed.\n\nSome things to note:\n\n- The collection of flavours has been expanded\n- Each flavour has automatically had its own href added to the link because of the rel='self'\n- Our link to rel='some-rel' has had its href added as well.\n- Our 'strip' helper has removed the markdown from 'description'.\n\n```html\n<div id=\"some-view\" class=\"testing-thing\">\n  <p>Hello, </p>\n  <label>Enter your name: <input hb-bind=\"name\"></label>\n  <div class=\"description\">This is very exciting</div>\n  <a href=\"/some-link\" rel=\"some-rel\"> Some link </a>\n  <a href=\"/a-link-to-me\" rel=\"self\" class=\"\">A link to myself</a>\n  <ul>\n    <li class=\"flavour edible\"><a href=\"/flavour/chicken\" rel=\"self\">Chickenesque</a></li>\n    <li class=\"flavour toxic\"><a href=\"/flavour/beef\" rel=\"self\">Spicy Beef substitute</a></li>\n    <li class=\"flavour edible\"><a href=\"/flavour/curry\" rel=\"self\">Curry. Just Curry.</a></li>\n    <li>\n  </ul>\n</div>\n```\nIf you happen to do this in your code....\n```js\nmyHypermediaDocument.set('type', 'sure-hope-this-works')\n```\nThen the page automatically updates to...\n```html\n<div id=\"some-view\" class=\"sure-hope-this-works\">\n```\nAnd if you happen to click on `A link to myself`, the Hyperbone event fires, updates the model and that results in..\n```html\n  <a href=\"/a-link-to-me\" rel=\"self\" class=\"clicked\">A link to myself</a>\n</div>\n```\nAnd if you type something into the the 'Enter your name box'\n```html\n<p>Hello, something</p>\n```\nAnd if you do\n```js\nmyHypermediaDocument.set('editing', false);\n```\nThen the element gets hidden. \n\n## Installation\n\nInstall with [component(1)](http://component.io):\n\n```sh\n    $ component install green-mesa/hyperbone-view\n```\n\nHyperbone View has a number of dependencies which are installed at the same time. These are:\n\n- Underscore\n- component/dom\n- Parts of Backbone\n\nNote that unlike Backbone View this does not have a dependency on jQuery. It does use a tiny standalone dom manipulation component called Dom instead.\n\n## Module API\n\n### require('hyperbone-view').registerHelper(name, fn)\n\nRegister a helper function for use inside templates. It becomes globally available to all views.\n\nExample:\n```js\n  require('hyperbone-view').registerHelper('shout', function( str ){\n\n  \treturn str.toUpperCase();\n\n  });\n  new HyperboneView({ model: new HyperboneModel({ name : \"squirrel\"}), el : dom('#namebox')});\n```\nThe template calls the helper...\n```html\n<p id=\"namebox\">Hello {{shout(name)}}</p>\n```\nWhich produces\n```html\n<p>Hello SQUIRREL</p>\n```\n\n### require('hyperbone-view').registerAttributeHandler(name, fn)\n\nRegister a custom attribute handler for extending the capabilities of View. More on this below.\n\n\n### require('hyperbone-view').HyperboneView\n\nYour reference to the HyperboneView prototype.\n\n```js\nvar HyperboneView = require('hyperbone-view').HyperboneView;\n\nnew HyperboneView({\n    model : model,\n    el : el,\n    initialised : function(){\n\n      // i get called after it's initialised for the first time.\n\n    }\n});\n```\nor\n```js\nnew HyperboneView().create(el, model);\n```\n\n## HyperboneView Instance API\n\n### .on( event, callback )\n\nHyperboneView instances are Backbone event emitters. There are three events emitted currently: `initialised`, `updated` and `delegate-fired`.\n\nThe callbacks are passed a [dom](http://github.com/component/dom) object, which is the view HTML and the model. For updated and delegate fired, information about what has changed is also added.\n\nThe philosphy behind these events is that they're useful for running integration tests, keeping a track on your application's state directly.\n\n```js\nview.on('initialised', function(el, model){\n  // I want to set some stuff in the model that's specific to the view but isn't in the Hypermedia\n  // that came from the server.\n  model.set('status', 'active');\n\n})\n```\n\n```js\nview.on('updated', function(el, model, event){\n  // event is 'change:someproperty' or something like that\n\n  if (event===\"change:status\"){\n    // do some horrible philosphy breaking stuff here\n  }\n\n})\n```\n\n```js\nview.on('delegate-fired', function(el, model, selector){\n\n  if (selector===\"click a.status\"){\n    logger('a.status clicked');\n  }\n\n})\n```\n\n### .create( dom, hyperboneModel )\n\nIf you want to postpone the view initialising, you can manually triggered this by invoking HyperboneView without a model and el and then calling .create(). Pass it either a CSS selector or a `dom` List object along with the model and this then binds the model to the view.\n\n### .addDelegate(obj | name, fn)\n\nIf you're using the .create() method, you can manually set up actual DOM event delegates, although this... probably isn't wise.\n\n```js\nnew HyperboneView({\n  delegates : {\n    'click .icon' : function( event ){\n      // do something here. Scope is the model.\n    }\n  },\n  model : model,\n  el: el\n})\n```\nis equivilant to \n```js\nnew HyperboneView()\n  .addDelegate('click .icon', function(event){\n    // do something here\n  })\n  .create(el, model)\n```\n\n\n## Hyperbone HTML Attributes\n\nHyperbone attributes can be added to the HTML, and allow for additional functionality not provided in the logicless attribute/innerText templates.\n\n### if=\"attribute\"\n\nGiven the truthiness of the model attribute, it will conditionally display the element.\n\n```html\n<p if=\"organisation\">{{organisation}}</p>\n```\nThis is as complex as the logic gets. How do I do an 'else' or an 'or' or an 'and' I hear you cry. Anything more complex than this is a job for code. It's what code is good at. The philosophy is that you do your difficult logic stuff in your code.\n\n\n### hb-with=\"attribute\"\n\nChanges the scope for the innerHTML to the selected model or collection. In effect the nested elements become a partial.\n\nThis HTML...\n```html\n<div hb-with=\"nested-model\">\n  <p>{{greeting}}</p>\n</div>\n```\n... is equivilant to\n```html\n<div><p>{{nested-model.greeting}}</p></div>\n```\n... except when you use `hb-with` for a model you create a subview and any change events that fire show only the sub-view and the sub-model.\n\nSlightly more useful than this is the ability to iterate through collections with `hb-with`\n```html\n<ul hb-with=\"nested-collection\">\n  <li>{{name}}</li>\n</ul>\n```\n... this then automatically clones the li tag for every model inside the collection.\n\n### hb-trigger=\"hyperbone-event\"\n\nOn clicking an element with the hb-trigger attribute, a subscribeable hyperbone event is fired. The handler is passed three parameters - the originating model, the name of the signal and a function to cancel any default DOM events.\n\nThis solves a particular problem of being able to access individual models within collections without doing horrible things to the DOM.\n\nA futher example:\n\nOur model contains...\n```js\n{\n  filters : [\n    {\n      name : \"Filter one\",\n      active : true\n    },\n    {\n      name : \"Filter two\",\n      active : false\n    }\n  ]\n}\n```\nAnd our view makes a new li for each filter. The scope of each li is the individual model in the collection.\n```html\n<ul hb-with=\"filters\">\n  <li class=\"if(model.get('active'), 'active')\" hb-trigger=\"filter-changed\">{{name}}</li>\n</ul>\n```\nWhich means when that li is clicked, the 'filters-changed' event fires on the 'filters' object (in backbone style that's `filters-changed:filters`), and the first parameter is the individual filter.\n```js\nmodel.on('filters-changed:filters', function( filter, signal, cancelDefault ){\n\n  // call cancelDefault() to prevent the default DOM event from firing.\n\n  filter.set('active', true);\n})\n```\n\n### hb-click-toggle=\"model-attribute\"\n\nThe most common use case for `hb-trigger` is actually just toggling a flag on or off, so this custom attribute automates this for you.\n\n```html\n<section>\n  <section if-not=\"editing\">\n    <button hb-click-toggle=\"editing\">Edit</button>\n    <p>Hello {{Name}}</p>\n  </section>\n  <section if=\"editing\">\n    <button hb-click-toggle=\"editing\">View</button>\n    <p>Enter your name:<input hb-bind=\"Name\"></p>\n  </section>\n</section>\n```\n\nThat's really all there is to it. You can, of course, bind to the change event and do somethign else... \n\n```js\napp.on('change:editing', function(){\n  // editing has changed!\n})\n```\n\n### hb-bind\n\nThis attribute allows two-way binding to form inputs to allow an easy way to let your users interact with your model. \n\n```html\n<body class=\"{{theme}}\">\n  <select hb-bind=\"theme\">\n    <option value=\"default\">Default</option>\n    <option value=\"dark\">Dark</option>\n    <option value=\"light\">Light</option>\n  </select>\n</body>\n```\nWhen used with a model..\n```js\n{\n  theme : \"default\"\n}\n```\n...results in the class on the body tag being automatically updated when the user changes the select. Etc.\n\n### Adding your own custom attributes\n\nBecause Hyperbone View enforces a strict separation of model and view, your applications shouldn't be touching the DOM at all. However, sometimes, you do in fact need to touch the DOM. When you do, the idea is that you use your own custom attributes. Luckily Hyperbone View exposes an API for this.\n\n### require('hyperbone-view').registerAttributeHandler( attributeName, fn )\n### require('hyperbone-view').use( attributeHandlers : { attributeName : fn })\n\n`fn` is called when HyperboneView finds an element with your attribute. When called, it is passed the element, the value of the attribute as arguments and a 'cancel' function. The scope is the instance of HyperboneView itself, meaning you can use this.model and this.el (this may not be true forever)\n\nThe cancel function should be called if you do not wish the View to continue processing the node (i.e, recurse into the childNodes etc).\n\nHere's a non-disruptive non-cancelled example. We want a link to switch between `.on` and `.off` whenever it's clicked..\n```html\n<a x-switch=\"status:off|on\" class=\"{{status}}\" href=\"#\"></a>\n```\n```js\n// create a model\nvar model = new HyperboneModel({\n  status : \"\"\n});\n// register an attribute handler\nrequire('hyperbone-view').registerAttributeHandler('x-switch', function(node, propertyValue, cancel){\n\n    var self = this; // hey, 'this' is the HyperboneView.\n\n    // it's a custom attribute so you need to do your own \n    // parsing. You get 'status:on|off' passed to you.\n    var parts = propertyValue.split(\":\");\n    var prop = parts[0];\n    var options = parts[1].split(\"|\");\n\n    // we're in the HyperboneView scope so this works... \n    this.model.set(prop, options[1]);\n\n    // Create a click handler for this element..\n    dom(node).on('click', function(e){\n\n      e.preventDefault();\n\n      // we tweak the model here.. \n      if (self.model.get(prop) === options[0]){\n        self.model.set(prop, options[1])\n      } else {\n        self.model.set(prop, options[0])\n      }\n\n    })\n\n    // we don't call cancel here, so the childNodes will be processed as normal\n\n  });\n// create a view\nnew HyperboneView({ model: model, el : html});\n```\n\nA disruptive 'cancelling' example: Creating a new instance of HyperboneView with a different model to process the element and all its children.\n\nThis is the parent Hypermedia document. Note that it contains a rel `some-rel` which points to `/some-other-document`.\n```json\n{\n  \"_links\" : {\n    \"self\" : {\n      \"href\" : \"/some-document\"\n    },\n    \"some-rel\" : {\n      \"href\" : \"/some-other-document\"\n    }\n  },\n  \"greeting\" : \"Welcome to the magic world of Hypermedia\"\n}\n```\nAnd this is the JSON for `/some-other-document`\n```json\n{\n  \"_links\" : {\n    \"self\" : {\n      \"href\" : \"/some-other-document\"\n    },\n    \"other-thing\" : {\n      \"href\" : \"/some-document\"\n    }\n  },\n  \"greeting\" : \"Woooo!\"\n}\n```\nOur HTML. We want to manually embed `/some-other-document` into our page. We don't use the href, only the rel.\n```html\n<div>\n<p>{{greeting}}</p>\n<div x-embed=\"some-rel\"><p>{{greeting}}</p></div>\n</div>\n```\nNow we add our custom attribute handler...\n```js\n// add attribute handler\nrequire('hyperbone-view').registerAttributeHandler('x-embed', function(node, propertyValue, cancel){\n\n    // remove the attribute so that when we create a subview\n    // we don't end up back inside this handler.\n    node.removeAttribute('x-embed');\n\n    // Hyperbone Models have a special helper method for looking\n    // up the hrefs of rels.\n    var uri = this.model.rel(propertyValue);\n\n    // wrap our naked element in a dom object.\n    var root = dom(node);\n\n    // load the model...\n    request.get(uri).set('Accept', 'application/json+hal').end( function(err, doc){\n\n      if(!err){\n\n        // create a new view, passing it our wrapped element and a new Hyperbone Model.\n        new HyperboneView()\n          .create( root, new HyperboneModel( doc ) );\n\n      }\n\n    });\n\n    // and we don't want the original View to continue processing this node\n    // and the node's children, so we...\n    cancel();\n\n  });\n\n// create a view\nnew HyperboneView({model : someModel, el : myElement });\n\n```\nWHich should, after everything's loaded, result in..\n```html\n<div>\n<p>Welcome to the magic world of Hypermedia</p>\n<div x-embed=\"some-rel\"><p>Woooo!</p></div>\n</div>\n```\n\nAs these two examples should demonstrate, using the custom attribute handler API is fairly powerful, largely unopinionated... and very very easy to abuse.\n\n## Logicless Template rules\n\nIt looks like moustache templating but it's not. It supports referencing model attributes, calling custom helpers (which are passed the referenced model attribute) and... if you really really must... you can just send in arbitrary javascript so long as it's inside a call to a custom helper.\n\nBuilt ins:\n\n- `{{property}}` automatically becomes model.get(\"property\")\n- `{{get(property)}}` for when you absolutely want everyone to know there's some backbone happening\n- `{{url()}}` gets the _links.self.href\n- `{{rel('some-rel')}}` gets a specific rel\n- `{{expresion(1 + 2 + model.get('current-value'))}}` - expression helper lets you add arbitrary javascript. Note the use of model.get to access data in the model is required in this situation.\n\nCustom helpers:\n\n- `{{myHelper(property)}}` passes model.get('property') to your custom handler\n\nWon't work:\n\n- `{{1 + 2}}` \n\n\n## License\n\n  MIT\n",
      "version": "0.2.22",
      "publisher": {
        "name": "charlottegore",
        "email": "conspiracygore@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:31.550Z"
    },
    {
      "name": "spotify",
      "description": "A Spotify API library for node.js",
      "readme": "node-spotify\n============\nExtremely simple (and somewhat hackish) API library for the Spotify REST API.\n\nInstall\n---\nThe easiest way to use node-spotify is to install it with npm: `npm install spotify`\n\nAPI\n---\nCurrently, there's only three (useful) methods available:\n\n```javascript\nlookup: function({ type: 'artist OR album OR track', id: 'Spotify ID Hash' }, hollaback)\n```\n\n```javascript\nsearch: function({ type: 'artist OR album OR track', query: 'My search query' }, hollaback)\n```\n\n```javascript\nget: function(query, hollaback) -- See http://developer.spotify.com/en/metadata-api/overview/\n```\n\nExample\n-------\n```javascript\nvar spotify = require('spotify');\n\nspotify.search({ type: 'track', query: 'dancing in the moonlight' }, function(err, data) {\n    if ( err ) {\n        console.log('Error occurred: ' + err);\n        return;\n    }\n\n    // Do something with 'data'\n});\n```\n",
      "version": "0.3.0",
      "publisher": {
        "name": "peol",
        "email": "peolanha+npm@gmail.com",
        "url": null
      },
      "lastPublishedAt": "2015-03-24T05:49:32.933Z"
    }
  ],
  "offset": 50,
  "hasMore": true
}