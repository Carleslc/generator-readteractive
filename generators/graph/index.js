'use strict';
const Generator = require('yeoman-generator');

module.exports = class extends Generator {
  prompting() {
    this.log("Ok, let's visualize the narrative branches graph.");
  }

  writing() {}
};
