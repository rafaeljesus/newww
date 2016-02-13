var gulp = require('gulp');
var nib = require('nib');
var stylus = require('gulp-stylus');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var bistre = require('bistre');
var nodemon = require('gulp-nodemon');
var rename = require('gulp-rename');
var jshint = require('gulp-jshint');
var RevAll = require('gulp-rev-all');
var gutil = require('gulp-util');

var revAll = new RevAll();
var paths = {
  fonts: ['./assets/fonts/*'],
  styles: ['./assets/styles/**/*.styl'],
  images: ['./assets/images/**/*'],
  misc: ['./assets/misc/*'],
  scripts: {
    browserify: ["./assets/scripts/*.js"],
    vendor: ["./assets/scripts/vendor/*.js"],
    tota11y: ["./assets/scripts/tota11y.min.js"]
  },
  templates: ['./assets/templates/*.hbs'],
  lintables: [
    "./assets/scripts/**/*.js",
    "./adapters/**/*.js",
    "./facets/**/*.js",
    "./lib/**/*.js",
    "./locales/**/*.js",
    "./presenters/**/*.js",
    "./services/**/*.js",
    "./test/**/*.js",
  ]
};

gulp.task('watch', ['dev-build'], function() {
  gulp.watch(paths.fonts, ['fonts']);
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.scripts.browserify, ['browserify']);
  gulp.watch(paths.templates, ['browserify']);
  gulp.watch(paths.scripts.vendor, ['concat']);
});

gulp.task('styles', function() {
  return gulp.src('./assets/styles/index.styl')
    .pipe(stylus({
      use: [nib()]
    }))
    .on('error', gutil.log)
    .pipe(gulp.dest('static/css/'));
});

gulp.task('browserify', function() {
  return browserify("./assets/scripts/index.js")
    .bundle()
    .pipe(source('index.js'))
    .pipe(gulp.dest('static/js/'))
    .pipe(rename('index.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest('static/js/'));
});

gulp.task('concat', function() {
  return gulp.src(paths.scripts.vendor)
    .pipe(uglify())
    .pipe(concat('vendor.min.js'))
    .pipe(gulp.dest('static/js/'))
});

gulp.task('tota11y', function() {
  return gulp
    .src(paths.scripts.tota11y)
    .pipe(gulp.dest('static/js/'));
});

gulp.task('fonts', function() {
  return gulp.src(paths.fonts)
    .pipe(gulp.dest('static/fonts'));
})

gulp.task('images', function() {
  return gulp.src(paths.images)
    // .pipe(imagemin({
    //     progressive: true,
    //     svgoPlugins: [{removeViewBox: false}],
    //     use: [pngcrush()]
    // }))
    .pipe(gulp.dest('static/images'));
})

gulp.task('misc', function() {
  return gulp.src(paths.misc)
    .pipe(gulp.dest('static/misc'));
})

gulp.task('nodemon', ['dev-build'], function() {
  process.env.NODE_ENV = 'dev';
  nodemon({
    script: 'server.js',
    ext: 'hbs js',
    ignore: [
      'assets/',
      'templates/',
      'facets/*/test/',
      'node_modules/',
      'static/',
      'test/',
    ],
    stdout: false,
  })
    .on('readable', function() {
      this.stdout
        .pipe(bistre({
          time: true
        }))
        .pipe(process.stdout);
      this.stderr
        .pipe(bistre({
          time: true
        }))
        .pipe(process.stderr);
    });
});

gulp.task('lint', function() {
  return gulp.src(paths.lintables)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('rev', ['browserify', 'styles'], function() {
  return gulp.src(['static/js/index.js', 'static/js/index.min.js', 'static/css/index.css', 'static/js/vendor.min.js'])
    .pipe(revAll.revision())
    .pipe(gulp.dest('static'))
    .pipe(revAll.manifestFile())
    .pipe(gulp.dest('static'));
});

gulp.task('dev-build', ['fonts', 'images', 'misc', 'styles', 'browserify', 'concat']);
gulp.task('prod-build', ['dev-build', 'rev']);
gulp.task('build', ['prod-build']);
gulp.task('dev', ['dev-build', 'tota11y', 'nodemon', 'watch']);
gulp.task('default', ['build']);
