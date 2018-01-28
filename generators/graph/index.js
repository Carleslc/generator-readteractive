'use strict';
const Generator = require('yeoman-generator');
const books = require('../get_books');
const chalk = require('chalk');

module.exports = class extends Generator {
  prompting() {
    if (!books.isReadteractive(this.fs, this.destinationPath())) {
      this.log(chalk.red('You are not in Readteractive folder!'));
      return;
    }

    let availableBooks = books.list(this.fs, this.destinationPath());

    if (availableBooks.length === 0) {
      this.log(
        chalk.red(
          'There are no Readteractive books available in folder ' +
            this.destinationPath() +
            '!'
        )
      );
      return;
    }

    this.log("Ok, let's visualize the narrative branches graph.");

    const graph = [
      {
        type: 'list',
        name: 'book',
        message: 'To what book does the chapter belong?',
        choices: availableBooks,
        store: true
      }
    ];

    return this.prompt(graph).then(props => {
      this.graph = props;
    });
  }

  writing() {
    this.log(chalk.red('Not available yet'));
  }

  end() {
    this.log(chalk.yellow('Happy writing! ') + chalk.red('See you soon!'));
  }
};
