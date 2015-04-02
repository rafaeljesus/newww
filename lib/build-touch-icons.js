var config = {
  files: {
    src: "./assets/images/touch_icon.png", // Path(s) for file to produce the favicons. `string` or `object`
    dest: "./assets/images/touch-icons", // Path for writing the favicons to. `string`
    html: "./templates/partials/touch-icons.hbs", // Path(s) for HTML file to write or append metadata. `string` or `array`
    iconsPath: "/static/images/touch-icons", // Path for overriding default icons path. `string`
    androidManifest: null, // Path for an existing android_chrome_manifest.json. `string`
    browserConfig: null, // Path for an existing browserconfig.xml. `string`
    firefoxManifest: null, // Path for an existing manifest.webapp. `string`
    yandexManifest: null // Path for an existing yandex-browser-manifest.json. `string`
  },
  icons: {
    android: true, // Create Android homescreen icon. `boolean`
    appleIcon: true, // Create Apple touch icons. `boolean`
    appleStartup: true, // Create Apple startup images. `boolean`
    coast: true, // Create Opera Coast icon. `boolean`
    favicons: true, // Create regular favicons. `boolean`
    firefox: true, // Create Firefox OS icons. `boolean`
    opengraph: true, // Create Facebook OpenGraph. `boolean`
    windows: true, // Create Windows 8 tiles. `boolean`
    yandex: true // Create Yandex browser icon. `boolean`
  },
  settings: {
    appName: "npm", // Your application's name. `string`
    appDescription: "The npm website", // Your application's description. `string`
    developer: "npm, Inc.", // Your (or your developer's) name. `string`
    developerURL: "https://npmjs.com", // Your (or your developer's) URL. `string`
    version: 1.0, // Your application's version number. `number`
    background: "#cb3837", // Background colour for flattened icons. `string`
    index: "/", // Path for the initial page on the site. `string`
    url: "https://npmjs.com", // URL for your website. `string`
    silhouette: false, // Turn the logo into a white silhouette for Windows 8. `boolean`
    logging: false // Print logs to console? `boolean`
  },
  favicon_generation: null, // Complete JSON overwrite for the favicon_generation object. `object`
}

require('favicons')(config, function(error, metadata) {
  if (error) throw error
  console.log("done generating touch icons")
});
