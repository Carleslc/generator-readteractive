'use strict';
const Generator = require('yeoman-generator');
const books = require('../get_books');
const lodash = require('lodash');
const mkdirp = require('mkdirp');
const chalk = require('chalk');

var bookpath = null;
var isRename = null;

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

    this.log('Ok, the story must continue.');

    var self = this;

    function setBookPath(props) {
      bookpath = self.destinationPath(props.book);
      self.destinationRoot(bookpath);
    }

    function newChapter(props) {
      isRename = props.feature === 'Rename a chapter identifier';
      return !isRename;
    }

    function orderNotSpecified(props) {
      return !books.orderSpecified(props.id).isOrderGiven;
    }

    function idFilter(id, oldId) {
      id = lodash.kebabCase(id);
      let { isOrderGiven, idParts } = books.orderSpecified(id);

      function getOrder() {
        if (oldId && !isOrderGiven) {
          let orderOld = books.orderSpecified(oldId);
          let isOldOrderGiven = orderOld.isOrderGiven;
          let oldIdParts = orderOld.idParts;
          if (isOldOrderGiven) {
            return oldIdParts[0];
          }
        }
        return isOrderGiven ? idParts[0] : books.chapterOrder(self.fs, bookpath);
      }

      if (isOrderGiven && idParts.length > 1) {
        id = idParts[1];
      }

      if (isOrderGiven && idParts.length === 1) {
        return id;
      }

      return getOrder() + '-' + id;
    }

    function defaultId(props) {
      return idFilter(isRename ? props.old : props.title);
    }

    function setBookPathAndRename(props) {
      setBookPath(props);
      return isRename;
    }

    function availableChapters() {
      return books.listChapters(bookpath);
    }

    const chapter = [
      {
        type: 'list',
        name: 'feature',
        message: 'Select an option',
        choices: ['Create a new chapter', 'Rename a chapter identifier'],
        default: 'Create a new chapter',
        store: true
      },
      {
        type: 'list',
        name: 'book',
        message: 'To what book does the chapter belong?',
        choices: availableBooks,
        store: true
      },
      {
        type: 'input',
        name: 'title',
        when: newChapter,
        message: 'What is the title of your chapter?',
        default: 'My Chapter'
      },
      {
        type: 'list',
        name: 'old',
        when: setBookPathAndRename,
        message: 'Select the chapter to rename',
        choices: availableChapters
      },
      {
        type: 'input',
        name: 'id',
        message: 'Set a chapter identifier',
        default: defaultId,
        filter: lodash.kebabCase
      },
      {
        type: 'confirm',
        name: 'order',
        message:
          'You have not specified a chapter order, do you want to add it automatically?',
        when: orderNotSpecified,
        default: true
      }
    ];

    return this.prompt(chapter).then(props => {
      this.chapter = props;

      if (this.chapter.order) {
        this.chapter.id = idFilter(this.chapter.id, this.chapter.old);
      }
    });
  }

  writing() {
    var self = this;

    function chapterContentPath(id) {
      return self.destinationPath(`${id}.md`);
    }

    function chapterTitlePath(id) {
      return self.destinationPath(`${id}.yml`);
    }

    let bookPath = this.destinationPath();
    let chapterPath = this.destinationPath(this.chapter.id);

    mkdirp(this.chapter.id);

    if (isRename) {
      if (this.chapter.old !== this.chapter.id) {
        this.fs.move(this.destinationPath(this.chapter.old), chapterPath);
        this.destinationRoot(chapterPath);

        this.fs.move(
          chapterTitlePath(this.chapter.old),
          chapterTitlePath(this.chapter.id)
        );
        this.fs.move(
          chapterContentPath(this.chapter.old),
          chapterContentPath(this.chapter.id)
        );

        let newReference = books.withoutOrder(this.chapter.id);
        let oldReference = books.withoutOrder(this.chapter.old);
        this.log(
          chalk.yellow(
            `I'll update links on your chapters pointing to ${oldReference}, now will reference to ${newReference}.`
          )
        );
        this.destinationRoot(bookPath);
        books.renameLinks(this.fs, bookPath, this.chapter.old, this.chapter.id);
      }
    } else {
      this.log(
        chalk.yellow(
          `I'll automatically create your chapter inside folder ${chapterPath}.`
        )
      );
      this.destinationRoot(chapterPath);

      this.fs.copyTpl(
        this.templatePath('chapter.yml'),
        chapterTitlePath(self.chapter.id),
        {
          title: this.chapter.title
        }
      );

      this.fs.copyTpl(
        this.templatePath('chapter.md'),
        chapterContentPath(self.chapter.id),
        {
          id: this.chapter.id
        }
      );

      this.fs.copy(this.templatePath('image.jpg'), this.destinationPath('image.jpg'));
    }
  }

  end() {
    this.log(chalk.yellow('Happy writing! ') + chalk.red('See you soon!'));
  }
};
