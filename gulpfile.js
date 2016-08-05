var gulp = require('gulp');
var zip = require('gulp-vinyl-zip').zip;

gulp.task('build-zip', () => {
	const platform = process.platform;

	if (platform !== 'darwin' || platform !== 'win32') {
		//TODO logic needed here for linux
	}

	return gulp.src([
		'static-src/commands/**',
		'static-src/templates/**',
		'static-src/extension.js',
		'node_modules/**',
		'LICENSE',
		'package.json',
		'github-assets/**',
		'README.md'
	], { base: '.' })
		.pipe(zip(`openwhisk-vscode-${platform}.zip`))
		.pipe(gulp.dest('./out'));
});