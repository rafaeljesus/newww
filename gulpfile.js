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
  browserify('./assets/js/index.js')
    .bundle()
    .pipe(source('index.min.js'))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest('static/js/'))
});

// gulp.task('concat', function () {
//   gulp.src([
//     "assets/js/vendor/highlight.min.js",
//     "assets/js/index-bundled.js",
//   ])
//     .pipe(uglify())
//     .pipe(concat('index.min.js'))
//     .pipe(gulp.dest('static/js/'))
// });

gulp.task('develop', function () {
  process.env.NODE_ENV = 'dev';
  nodemon({
    script: 'server.js',
    ext: 'hbs styl js',
    ignore: ['node_modules/', 'test/', 'facets/*/test/'],
    stdout: false
  })
    .on('change', ['build'])
    .on('restart', function () {
      console.log('restarted!')
    })
    .on('readable', function () {
      this.stdout
        .pipe(bistre({time: true}))
        .pipe(process.stdout);
      this.stderr
        .pipe(bistre({time: true}))
        .pipe(process.stderr);
    })
});

gulp.task('build', ['styles', 'browserify']);
gulp.task('default', ['build']);
