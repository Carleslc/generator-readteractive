'use strict';
const Generator = require('yeoman-generator');
const path = require('path');
const lodash = require('lodash');
const mkdirp = require('mkdirp');
const chalk = require('chalk');
const ISO_639_1 = require('iso-639-1');

function kebab(s) {
  return lodash.kebabCase(s);
}

function defaultId(props) {
  return kebab(props.title);
}

module.exports = class extends Generator {
  prompting() {
    this.log("Ok, let's create a new amazing book.");

    const book = [
      {
        type: 'input',
        name: 'author',
        message: 'What is your name?',
        default: 'Author',
        store: true
      },
      {
        type: 'input',
        name: 'title',
        message: 'What is the title of your book?',
        default: 'My Book'
      },
      {
        type: 'input',
        name: 'id',
        message: 'Set a book identifier',
        default: defaultId,
        filter: kebab
      },
      {
        type: 'list',
        name: 'language',
        message: 'Select the book language',
        choices: ISO_639_1.getAllNames(),
        default: 'English',
        store: true
      },
      {
        type: 'input',
        name: 'description',
        message: 'Give a fancy description to your book',
        default: 'My description'
      }
    ];

    return this.prompt(book).then(props => {
      this.book = props;
    });
  }

  writing() {
    if (path.basename(this.destinationPath()) !== this.book.id) {
      this.log(
        `I'll automatically create your book inside a folder named ${this.book.id}.`
      );
      mkdirp(this.book.id);
      this.destinationRoot(this.destinationPath(this.book.id));
    }

    this.fs.copyTpl(this.templatePath('_meta.yml'), this.destinationPath('_meta.yml'), {
      title: this.book.title,
      author: this.book.author,
      language: ISO_639_1.getCode(this.book.language),
      description: this.book.description
    });

    this.fs.copy(this.templatePath('cover.png'), this.destinationPath('cover.png'));
  }

  end() {
    this.log(
      chalk.blue(
        'If this is your first book remember to install Python 3, Make and Pandoc'
      )
    );
    this.log(chalk.blue('Build with: ') + chalk.bold.blue('yo readteractive:build'));
    this.log(chalk.yellow('Happy writing! ') + chalk.red('See you soon!'));
  }
};
