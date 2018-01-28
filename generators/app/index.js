'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.execute = function(name) {
      function getFeature() {
        switch (name) {
          case 'Create a new book':
            return '../book';
          case 'Create or rename a chapter':
            return '../chapter';
          case 'Build a book':
            return '../build';
          default:
            return '../graph';
        }
      }
      this.composeWith(require.resolve(getFeature()));
    };
  }

  prompting() {
    this.log(yosay("Let's scaffold some " + chalk.red('Readteractive') + ' books!'));

    const featureSelect = [
      {
        type: 'list',
        name: 'feature',
        message: 'What do you want to do?',
        choices: [
          'Create a new book',
          'Create or rename a chapter',
          'Build a book',
          'Book graph'
        ],
        store: true
      }
    ];

    return this.prompt(featureSelect).then(props => {
      this.execute(props.feature);
    });
  }
};
