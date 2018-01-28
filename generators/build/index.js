'use strict';
const Generator = require('yeoman-generator');
const books = require('../get_books');
const chalk = require('chalk');
const { spawn } = require('child_process');

function validateMargin(margin) {
  let valid = /^\d+(cm|in)$/.test(margin);
  if (!valid) {
    return 'Incorrect format (digit followed by cm or in)';
  }
  return true;
}

function exec(self, cmdArgs, then) {
  const make = spawn(cmdArgs[0], cmdArgs.slice(1));

  make.stdout.on('data', data => {
    self.log(data.toString('utf8'));
  });

  make.stderr.on('data', data => {
    self.log(chalk.red(data.toString('utf8')));
  });

  make.on('close', code => {
    if (code === 0) {
      // No error
      then();
    } else {
      self.log(chalk.yellow('Warnings or errors detected.'));
    }
  });
}

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

    function html(props) {
      return props.formats.includes('html');
    }

    function pdf(props) {
      return props.formats.includes('pdf');
    }

    function epub(props) {
      return props.formats.includes('epub');
    }

    function mobi(props) {
      return props.formats.includes('mobi');
    }

    function isPrintable(props) {
      return pdf(props) || epub(props) || mobi(props);
    }

    this.log(
      chalk.blue(
        'If this is your first book remember to have installed Python 3, Make and Pandoc and if you want to build Kindle MOBI e-books install Kindlegen too.\nCancel with Ctrl+C'
      )
    );
    this.log("Ok, let's build your awesome book.");

    const build = [
      {
        type: 'list',
        name: 'book',
        message: 'What book do you want to build?',
        choices: availableBooks,
        store: true
      },
      {
        type: 'checkbox',
        name: 'formats',
        message: 'In which formats are you interested?',
        choices: ['html', 'pdf', 'epub', 'mobi'],
        default: ['html', 'pdf', 'epub'],
        store: true
      },
      {
        type: 'list',
        name: 'scroll',
        when: html,
        message: 'Which showing chapters way do you prefer for HTML format?',
        choices: [
          'Show only the current chapter and hide others',
          'Keep all opened chapters available with scroll'
        ],
        store: true
      },
      {
        type: 'confirm',
        name: 'printed',
        when: isPrintable,
        message: 'Will you print this book?',
        default: false
      },
      {
        type: 'input',
        name: 'margin',
        when: pdf,
        message: 'How much margin do you want for PDF format?',
        default: '3cm',
        validate: validateMargin,
        store: true
      }
    ];

    return this.prompt(build).then(props => {
      this.build = props;

      if (mobi(props) && !epub(props)) {
        this.log(
          chalk.yellow("Mobi converts from epub format, so I'll build epub format first.")
        );
        this.build.formats.unshift('epub');
      }
    });
  }

  writing() {
    let self = this;

    function yesNo(bool) {
      return bool ? 'yes' : 'no';
    }

    function scrollable(scroll) {
      return yesNo(scroll === 'Keep all opened chapters available with scroll');
    }

    function make(format) {
      var command = 'make ' + format;

      function append(option, value, formats) {
        if (value !== undefined && (formats === undefined || formats.includes(format))) {
          command += ` ${option}=${value}`;
        }
      }

      append('BOOK', self.build.book);
      append('SCROLL', scrollable(self.build.scroll), ['html']);
      append('PRINTED', yesNo(self.build.printed), ['pdf', 'epub', 'mobi']);
      append('PDF_MARGIN', self.build.margin, ['pdf']);

      return command.split(' ');
    }

    function formatConsumer() {
      let formats = self.build.formats.slice();

      function next() {
        let format = formats.shift();
        if (format !== undefined) {
          self.log(chalk.blue(`Building ${chalk.blue.bold(format)}`));
          exec(self, make(format), next);
        }
      }

      next();
    }

    if (this.build) {
      formatConsumer();
    }
  }

  end() {
    this.log(chalk.yellow('Happy writing! ') + chalk.red('See you soon!'));
  }
};
