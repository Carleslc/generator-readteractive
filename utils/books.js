const fs = require('fs');
const { join } = require('path');
const { kebabCase } = require('lodash');

function isDirectory(filepath) {
  return fs.statSync(filepath).isDirectory();
}

function isBook(filepath) {
  return isDirectory(filepath) && fs.existsSync(join(filepath, '_meta.yml'));
}

function isNatural(s) {
  return /^\d+$/.test(s);
}

function orderSpecified(id) {
  const kebabId = kebabCase(id);
  const allParts = kebabId.split('-');
  const isOrderGiven = isNatural(allParts[0]);
  const idParts = isOrderGiven
    ? [allParts[0], allParts.slice(1).join('-')]
    : [allParts.join('-')];
  return { isOrderGiven, idParts };
}

function getOrder(chapter) {
  const { isOrderGiven, idParts } = orderSpecified(chapter);
  return isOrderGiven ? parseInt(idParts[0], 10) : -1;
}

function withoutOrder(chapter) {
  const { isOrderGiven, idParts } = orderSpecified(chapter);
  return isOrderGiven ? idParts[1] : chapter;
}

function isChapter(bookpath, file) {
  const dirPath = join(bookpath, file);
  return isDirectory(dirPath) && fs.existsSync(join(dirPath, `${file}.md`));
}

function listChapters(bookpath) {
  return fs.readdirSync(bookpath).filter((file) => {
    try {
      return isChapter(bookpath, file);
    } catch (_) {
      return false;
    }
  });
}

module.exports = {
  orderSpecified,
  withoutOrder,
  listChapters,
  list(path) {
    return fs.readdirSync(path).filter((file) => isBook(join(path, file)));
  },
  isReadteractive(path) {
    return (
      fs.existsSync(join(path, 'makefile')) &&
      fs.existsSync(join(path, 'process_book.py'))
    );
  },
  chapterOrder(bookpath) {
    const chapters = listChapters(bookpath);
    if (chapters.length === 0) {
      return 0;
    }

    return Math.max(...chapters.map((chapter) => getOrder(chapter))) + 1;
  },
  renameLinks(bookpath, oldId, newId) {
    const oldRef = withoutOrder(oldId);
    const newRef = withoutOrder(newId);
    const linkRegex = new RegExp(
      `\\(\\s*([^)]*?)\\s*->\\s*\\[\\s*(${oldRef}|${oldId})\\s*\\]\\s*\\)`,
      'g',
    );
    const replaceRegex = new RegExp(`\\[\\s*(${oldRef}|${oldId})\\s*\\]`, 'g');
    const newReplace = `[${newRef}]`;
    const results = [];
    for (const chapter of listChapters(bookpath).filter(
      (chapter) => chapter !== newId && chapter !== oldId,
    )) {
      const chapterPath = join(bookpath, chapter, `${chapter}.md`);
      const chapterContents = fs.readFileSync(chapterPath, 'utf8');
      const texts = [];
      let match;
      while ((match = linkRegex.exec(chapterContents)) !== null) {
        texts.push(match[1].trim());
      }

      const chapterRefreshed = chapterContents.replace(replaceRegex, newReplace);
      if (chapterRefreshed !== chapterContents) {
        fs.writeFileSync(chapterPath, chapterRefreshed, 'utf8');
        results.push({ chapter, texts });
      }
    }

    return results;
  },
};
