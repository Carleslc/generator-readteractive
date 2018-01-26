'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

module.exports = class extends Generator {

  constructor(args, opts) {
    super(args, opts);

    this.execute = function(name) {
      let self = this;
      function getFeature() {
        switch (name) {
          case 'Create a new book':
            return '../book';
          case 'Create a new chapter':
            return '../chapter';
          case 'Rename a chapter ID':
            return '../chapter';
          case 'Book graph':
            return '../graph';
        };
      }
      this.composeWith(require.resolve(getFeature()));
    };
  }

  prompting() {
    this.log(yosay(
      "Let's scaffold some " + chalk.red('Readteractive') + " books!"
    ));

    const feature_select = [{
      type: 'list',
      name: 'feature',
      message: 'What do you want to do?',
      choices: [
        'Create a new book',
        'Create a new chapter',
        'Rename a chapter ID',
        'Book graph'
      ]
    }];

    return this.prompt(feature_select).then(props => {
      this.execute(props.feature);
    });
  }

  end() {
    this.log(chalk.yellow('Happy writing! ') + chalk.red('See you soon!'));
  }
};
