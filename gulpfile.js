var gulp = require('gulp'),
    nib = require('nib'),
    stylus = require('gulp-stylus'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    streamify = require('gulp-streamify'),
    bistre = require('bistre'),
    nodemon = require('gulp-nodemon');

gulp.task('styles', function () {
  gulp.src('stylus/index.styl')
      .pipe(stylus({use: [nib()]}))
      .pipe(gulp.dest('static/css/'))
});

gulp.task('browserify', function () {
  browserify('./assets/js/typeahead.js')
    .bundle()
    .pipe(source('typeahead.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest('assets/js/'))
});

var footerScripts = [
  "assets/js/jquery-2.1.0.min.js",
  "assets/js/d3.js",
  "assets/js/charts.js",
  "assets/js/sh_main.js",
  "assets/js/sh_javascript.min.js",
  "assets/js/scripts.js",
  "assets/js/google-analytics.js",
  "assets/js/typeahead.min.js"
];

gulp.task('concat', function () {
  gulp.src(footerScripts)
      .pipe(uglify())
      .pipe(concat('footer.min.js'))
      .pipe(gulp.dest('static/js/'))
});

gulp.task('develop', function () {
  process.env.NODE_ENV = 'dev';
  nodemon({
    script: 'server.js',
    ext: 'hbs styl js',
    ignore: ['node_modules/', 'test/', 'facets/*/test/'],
    stdout: false
  })
    .on('change', ['styles'])
    .on('restart', function () {
      console.log('restarted!')
    })
    .on('readable', function () {
      this.stdout.pipe(bistre({time: true}))
                 .pipe(process.stdout);
      this.stderr.pipe(bistre({time: true}))
                 .pipe(process.stderr);
    })
});

gulp.task('default', ['styles']);
gulp.task('build', ['styles', 'browserify', 'concat']);