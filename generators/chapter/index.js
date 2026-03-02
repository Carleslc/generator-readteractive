'use strict';
const Generator = require('yeoman-generator');
const books = require('../../utils/books');
const { farewell } = require('../../utils/messages');
const lodash = require('lodash');
const fs = require('fs');
const chalk = require('chalk');

let bookpath = null;
let isRename = null;
let hasChapters = true;

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts, { customInstallTask: true });
  }

  prompting() {
    if (!books.isReadteractive(this.destinationPath())) {
      this.log(chalk.red('You are not in Readteractive folder!'));
      return;
    }

    const availableBooks = books.list(this.destinationPath());

    if (availableBooks.length === 0) {
      this.log(
        chalk.red(
          'There are no Readteractive books available in folder ' +
            this.destinationPath() +
            '!',
        ),
      );
      return;
    }

    this.log('Ok, the story must continue.');

    const self = this;

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
      const { isOrderGiven, idParts } = books.orderSpecified(id);

      function getOrder() {
        if (oldId && !isOrderGiven) {
          const orderOld = books.orderSpecified(oldId);
          const isOldOrderGiven = orderOld.isOrderGiven;
          const oldIdParts = orderOld.idParts;
          if (isOldOrderGiven) {
            return oldIdParts[0];
          }
        }

        return isOrderGiven ? idParts[0] : books.chapterOrder(bookpath);
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

      if (isRename) {
        hasChapters = books.listChapters(bookpath).length > 0;

        if (!hasChapters) {
          self.log(chalk.red('This book has no chapters to rename.'));
        }

        return hasChapters;
      }

      return false;
    }

    function availableChapters() {
      return books.listChapters(bookpath);
    }

    const chapter = [
      {
        type: 'select',
        name: 'feature',
        message: 'Select an option',
        choices: ['Create a new chapter', 'Rename a chapter identifier'],
        default: 'Create a new chapter',
        store: true,
      },
      {
        type: 'select',
        name: 'book',
        message: 'To what book does the chapter belong?',
        choices: availableBooks,
        store: true,
      },
      {
        type: 'input',
        name: 'title',
        when: newChapter,
        message: 'What is the title of your chapter?',
        default: 'My Chapter',
      },
      {
        type: 'select',
        name: 'old',
        when: setBookPathAndRename,
        message: 'Select the chapter to rename',
        choices: availableChapters,
      },
      {
        type: 'input',
        name: 'id',
        when: () => !isRename || hasChapters,
        message: 'Set a chapter identifier',
        default: defaultId,
        filter: lodash.kebabCase,
      },
      {
        type: 'confirm',
        name: 'order',
        message:
          'You have not specified a chapter order, do you want to add it automatically?',
        when: (props) => (!isRename || hasChapters) && orderNotSpecified(props),
        default: true,
      },
    ];

    return this.prompt(chapter).then((props) => {
      this.chapter = props;

      if (this.chapter.order) {
        this.chapter.id = idFilter(this.chapter.id, this.chapter.old);
      }
    });
  }

  writing() {
    if (!this.chapter || !this.chapter.id) return;

    const self = this;

    function chapterContentPath(id) {
      return self.destinationPath(`${id}.md`);
    }

    function chapterTitlePath(id) {
      return self.destinationPath(`${id}.yml`);
    }

    const bookPath = this.destinationPath();
    const chapterPath = this.destinationPath(this.chapter.id);

    if (isRename) {
      if (this.chapter.old !== this.chapter.id) {
        const newName = books.withoutOrder(this.chapter.id);
        const conflict = books
          .listChapters(bookPath)
          .find((ch) => ch !== this.chapter.old && books.withoutOrder(ch) === newName);

        if (conflict) {
          this.log(chalk.red(`Cannot rename: chapter "${conflict}" already exists.`));
          return;
        }

        fs.renameSync(this.destinationPath(this.chapter.old), chapterPath);
        fs.renameSync(
          this.destinationPath(this.chapter.id, `${this.chapter.old}.yml`),
          this.destinationPath(this.chapter.id, `${this.chapter.id}.yml`),
        );
        fs.renameSync(
          this.destinationPath(this.chapter.id, `${this.chapter.old}.md`),
          this.destinationPath(this.chapter.id, `${this.chapter.id}.md`),
        );

        const newReference = books.withoutOrder(this.chapter.id);
        const oldReference = books.withoutOrder(this.chapter.old);
        this.log(
          chalk.yellow(
            `I'll update links on your chapters pointing to ${oldReference}, now will reference to ${newReference}.`,
          ),
        );
        const results = books.renameLinks(bookPath, this.chapter.old, this.chapter.id);
        const lines = results.flatMap(({ chapter, texts }) =>
          texts.map(
            (text) =>
              chalk.blue(`  ${chapter}: `) +
              chalk.dim(`"${text}"`) +
              ' -> ' +
              chalk.red.strikethrough(oldReference) +
              ' ' +
              chalk.bold(newReference),
          ),
        );
        for (const line of lines) this.log(line);
        if (lines.length === 0) this.log(chalk.dim('  No links to update.'));
      }
    } else {
      this.log(
        chalk.yellow(
          `I'll automatically create your chapter inside folder ${chapterPath}.`,
        ),
      );
      fs.mkdirSync(chapterPath, { recursive: true });
      this.destinationRoot(chapterPath);

      this.fs.copyTpl(
        this.templatePath('chapter.yml'),
        chapterTitlePath(self.chapter.id),
        {
          title: this.chapter.title,
        },
      );

      this.fs.copyTpl(
        this.templatePath('chapter.md'),
        chapterContentPath(self.chapter.id),
        {
          id: this.chapter.id,
        },
      );

      this.fs.copy(this.templatePath('image.jpg'), this.destinationPath('image.jpg'));
    }
  }

  end() {
    this.log(farewell);
  }
};
