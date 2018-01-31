const fs = require('fs');
const { join } = require('path');
const { kebabCase } = require('lodash');

function isDirectory(filepath) {
  return fs.statSync(filepath).isDirectory();
}

function isBook(mfs, filepath) {
  return isDirectory(filepath) && mfs.exists(join(filepath, '_meta.yml'));
}

function isNatural(s) {
  return /^\d+$/.test(s);
}

function orderSpecified(id) {
  let kebabId = kebabCase(id);
  let allParts = kebabId.split('-');
  let isOrderGiven = isNatural(allParts[0]);
  let idParts = isOrderGiven
    ? [allParts[0], allParts.slice(1).join('-')]
    : [allParts.join('-')];
  return { isOrderGiven: isOrderGiven, idParts: idParts };
}

function getOrder(chapter) {
  let { isOrderGiven, idParts } = orderSpecified(chapter);
  return isOrderGiven ? parseInt(idParts[0], 10) : -1;
}

function withoutOrder(chapter) {
  let { isOrderGiven, idParts } = orderSpecified(chapter);
  return isOrderGiven ? idParts[1] : chapter;
}

module.exports = {
  orderSpecified,
  withoutOrder,
  list(mfs, path) {
    return fs.readdirSync(path).filter(file => isBook(mfs, join(path, file)));
  },
  isReadteractive(mfs, path) {
    return (
      mfs.exists(join(path, 'makefile')) && mfs.exists(join(path, 'process_book.py'))
    );
  },
  listChapters(bookpath) {
    return fs.readdirSync(bookpath).filter(file => isDirectory(file));
  },
  chapterOrder(mfs, bookpath) {
    let chapters = this.listChapters(bookpath);
    if (chapters.length === 0) {
      return 0;
    }
    return Math.max(...chapters.map(chapter => getOrder(chapter))) + 1;
  },
  renameLinks(mfs, bookpath, oldId, newId) {
    let oldRegex = new RegExp(`\\[\\s*(${withoutOrder(oldId)}|${oldId})\\s*\\]`, 'g');
    let newReplace = `[${withoutOrder(newId)}]`;
    for (let chapter of this.listChapters(bookpath).filter(
      chapter => chapter !== newId && chapter !== oldId
    )) {
      let chapterPath = join(chapter, `${chapter}.md`);
      let chapterContents = fs.readFileSync(chapterPath, 'utf8');
      let chapterRefreshed = chapterContents.replace(oldRegex, newReplace);
      mfs.write(chapterPath, chapterRefreshed);
    }
  }
};
