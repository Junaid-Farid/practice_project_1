var gulp         = require('gulp'),
    browserSync  = require('browser-sync').create(),
    notify       = require('gulp-notify'),
    plumber      = require('gulp-plumber'),
    critical     = require('critical'),
    jade         = require('gulp-jade'),
    rename       = require('gulp-rename'),
    imagemin     = require('gulp-imagemin'),
    cache        = require('gulp-cache'),
    uglify       = require('gulp-uglify'),
    uncss        = require('gulp-uncss'),
    autoprefixer = require('autoprefixer'),
    lost         = require('lost'),
    nano         = require('gulp-cssnano'),
    sass         = require('gulp-sass'),
    rucksack     = require('rucksack-css'),
    watch        = require('gulp-watch'),
    rimraf       = require('rimraf'),
    postcss      = require('gulp-postcss'),
    size         = require('postcss-size'),
    fontmagic    = require('postcss-font-magician'),
    colorguard   = require('colorguard'),
    svgSprite    = require('gulp-svg-sprite'),
    focus        = require('postcss-focus'),
    center       = require('postcss-center'),
    circle       = require('postcss-circle'),
    triangle     = require('postcss-triangle'),
    flexfix      = require('postcss-flexbugs-fixes'),
    clearfix     = require('postcss-clearfix'),
    pxtorem      = require('postcss-pxtorem'),
    devtools     = require('postcss-devtools'),
    hexrgba      = require('postcss-hexrgba'),
    reload = browserSync.reload;



var path = {
    dist: { //Тут мы укажем куда складывать готовые после сборки файлы
        html: 'dist/',
        js: 'dist/js/',
        css: 'dist/css/',
        img: 'dist/images/',
        fonts: 'dist/fonts/'
    },
    assets: { //Пути откуда брать исходники
        jade: 'assets/jade/index.jade',
        js: 'assets/js/plugins.js',
        css: 'assets/css/main.scss',
        img: 'assets/images/**/*.{png,jpg,gif}',
        svg: 'assets/images/**/*.svg',
        svgsprite: 'assets/images/svgsprite/*.svg',
        fonts: 'assets/fonts/**/*.*'
    },
    watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
        html: 'dist/*.html',
        jade: 'assets/jade/**/*.jade',
        js: 'assets/js/**/*.js',
        css: 'assets/css/**/*.scss',
        img: 'assets/images/**/*.{png,jpg,gif}',
        svg: 'assets/images/svgsprite/*.svg',
        fonts: 'assets/fonts/**/*.*'
    },
    clean: './dist'
};

var server_config = {
    server: {
        baseDir: "./dist/"
    },
    tunnel: false,
    host: 'localhost',
    online: 'true',
    port: 7778,
    // browser: 'firefox',
    logPrefix: "frontend"
};

var processors = [
  // devtools,
  lost,
  clearfix,
  rucksack ({
    fallbacks: true
  }),
  size,
  triangle,
  hexrgba,
  circle,
  center,
  flexfix,
  autoprefixer({
    browsers: ['last 3 versions']
  }),
  nano
];



// SVG Config
var svg_config = {
  mode: {
    symbol: { // symbol mode to build the SVG
      render: {
        css: false, // CSS output option for icon sizing
        scss: false // SCSS output option for icon sizing
      },
      dest: 'sprite', // destination folder
      // prefix: '.svg--%s', // BEM-style prefix if styles rendered
      sprite: 'sprite.svg', //generated sprite name
      example: true // Build a sample page, please!
    }
  }
};


gulp.task('critical', function (cb) {
    critical.generate({
        inline: true,
        base: 'dist/',
        src: 'index.html',
        dest: 'dist/critical/index.html',
        minify: false
    });
});



gulp.task('svg', function() {
  gulp.src(path.assets.svgsprite)
      .pipe(customPlumber('Error Running svg'))
      .pipe(svgSprite(svg_config))
      .pipe(gulp.dest(path.dist.img));
});


/**
 * Watch files for changes & recompile
 * Run & reload browser
 */

gulp.task('watch', function() {
    	gulp.watch(path.watch.html).on('change', reload);
    	gulp.watch(path.watch.jade, ['jade']);
    	gulp.watch(path.watch.css, ['css']);
    	gulp.watch(path.watch.js, ['js']);
    	gulp.watch(path.watch.svg, ['svg']);
    	gulp.watch(path.watch.img, ['images']);
    	gulp.watch(path.watch.fonts, ['fonts']);
});





gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});




/**
 * Compile files from css (for live injecting) and site
 */
gulp.task('css', function() {
  gulp.src(path.assets.css)
    .pipe(customPlumber('Error Running css'))
    .pipe(sass())
    .pipe(postcss(processors))
    .pipe(customPlumber('Error Running css'))
    .pipe(rename({
          suffix: '.min'
    }))
    .pipe(reload({stream: true}))
    .pipe(gulp.dest(path.dist.css));
});





//Uglify and rename JS files
gulp.task('js', function() {
  return gulp.src(path.assets.js)
    .pipe(customPlumber('Error Running JS'))
    .pipe(uglify())
    .pipe(rename({
          suffix: '.min'
    }))
    .pipe(gulp.dest(path.dist.js))
    .pipe(reload({stream: true}));
});




gulp.task('fonts', function() {
    gulp.src(path.assets.fonts)
        .pipe(gulp.dest(path.dist.fonts))
});



// Minify all images for better perfomance
gulp.task('images', function() {
  return gulp.src(path.assets.img)
    .pipe(cache(imagemin({
       optimizationLevel: 3,
       progressive: true,
       interlaced: true
     })))
    .pipe(gulp.dest(path.dist.img));
});




// Purify css file and remove unused selectors
gulp.task('uncss', function () {
    return gulp.src(path.assets.css)
        .pipe(sass())
        .pipe(postcss(processors))
        .pipe(uncss({
            html: ['./dist/_site/index.html', 'posts/**/*.html', 'http://example.com']
        }))
        .pipe(postcss([nano]))
        .pipe(gulp.dest('./'));
});





/**
 * Compile files from Jade into HTML
 */
gulp.task('jade', function(){
  return gulp.src(path.assets.jade)
  .pipe(customPlumber('Error Running Jade'))
	.pipe(jade({
     pretty: true
   }))
  .pipe(gulp.dest(path.dist.html));
});





/**
  * Custom plumber function that emits the end event
  */
function customPlumber(errTitle) {
  return plumber({
    errorHandler: notify.onError({
      // Customizing error title
      title: errTitle || "Error running Gulp",
      message: "Error: <%= error.message %>",
    })
  })
};




// Runs local server and opens the page in dev firefox browser
gulp.task('webserver', ['build'], function() {
    browserSync.init(server_config);
});




gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});



gulp.task('build', [
    'jade',
    'css',
    'js',
    'fonts',
    'images',
    'svg',
    'watch'
]);


/**
 * Default task, running just `gulp` will compile the sass,
 * compile the site, launch livereload & watch files.
 */
gulp.task('default', ['webserver']);


/* npm install gulp browser-sync gulp-cache gulp-cssnano gulp-imagemin gulp-jade gulp-plumber gulp-notify gulp-postcss gulp-rename gulp-sass gulp-uncss gulp-watch lost postcss-center postcss-circle postcss-flexbugs-fixes postcss-focus postcss-font-magician postcss-size postcss-triangle rimraf rucksack-css --save-dev */
