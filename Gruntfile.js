/*jshint node:true*/
module.exports = function(grunt) {

    var banner = '/*! ${NAME} ${VERSION} (sha1: ${SHA})'
        + ' | (c) 2012~<%= grunt.template.today("yyyy") %> <%= pkg.author.name %>.'
        + ' MIT License. | <%= pkg.homepage %> */\n';

    var version;

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        version: version = {
            amdr: {
                file: 'src/amdr.js',
                version: '<%= pkg.version %>'
            },
            'css': {
                file: 'src/loader/css.js',
                version: '<%= pkg.loaders.css.version %>'
            },
            'has': {
                file: 'src/loader/has.js',
                version: '<%= pkg.loaders.has.version %>'
            }
        },
        uglify: {
            amdr: {
                src:  'src/amdr.js',
                dest: 'dist/amdr.js',
                options: {
                    banner: banner
                        .replace('${NAME}', 'AMDR')
                        .replace('${SHA}', '<%= version.amdr.sha %>')
                        .replace('${VERSION}', '<%= version.amdr.version %>')
                }
            },
            'css': {
                src:  'src/loader/css.js',
                dest: 'dist/loader/css.js',
                options: {
                    banner: banner
                        .replace('${NAME}', 'AMDR - CSS file loader')
                        .replace('${SHA}', '<%= version.css.sha %>')
                        .replace('${VERSION}', '<%= version.css.version %>')
                }
            },
            'has': {
                src:  'src/loader/has.js',
                dest: 'dist/loader/has.js',
                options: {
                    banner: banner
                        .replace('${NAME}', 'AMDR - Condition loader')
                        .replace('${SHA}', '<%= version.has.sha %>')
                        .replace('${VERSION}', '<%= version.has.version %>')
                }
            }
        },
        replace: {
            dist: {
                src: 'dist/**/*.js',
                overwrite: true,
                replacements: [{
                    from: /,!1([);]+)$/g,
                    to: ',/*@cc_on!@*/!1$1'
                }]
            }
        }
    });

    // Load tasks.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.registerMultiTask('version', 'Update version in the source file.', function(){

        var pattern = /^(\/\*\!\s+\* [a-z -]+)(\s+[\d.]+)?(\s+\(sha1\: [a-z0-9]*\))?\n/i;
        var path = require('path');
        var task = this.data, sha;

        if (!grunt.file.exists(task.file)) {
            grunt.log.warn('Source file ' + task.file + ' not found.');
            return;
        }

        if (!grunt.file.exists(path.dirname(task.dest))) {
            grunt.file.mkdir(path.dirname(task.dest));
        }

        var content = grunt.file.read(task.file);

        content = content.replace(pattern, '$1 ' + task.version + ' (sha1: )\n');
        content = content.replace(/(version:\s*)'[\d.]+'/, "$1'" + task.version + "'");

        sha = require('crypto').createHash('sha1').update(content).digest('hex');
        content = content.replace(pattern, '$1 ' + task.version + ' (sha1: ' + sha + ')\n');
        version[this.target].sha = sha;

        grunt.log.ok('Version of "' + task.file + '": ' + task.version + ' / ' + sha);
        grunt.file.write(task.file, content);
    });


    // Define tasks.
    grunt.registerTask('default', ['version', 'uglify', 'replace']);

};
