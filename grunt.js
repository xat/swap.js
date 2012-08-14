module.exports = function(grunt) {
  grunt.initConfig({
    min: {
      min: {
        src: ['src/swap.js'],
        dest: 'build/swap.min.js'
      }
    },
    lint: {
      files: ['src/swap.js']
    }
  });

  grunt.registerTask('default', 'min lint');
};
