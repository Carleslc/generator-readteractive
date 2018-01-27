const fs = require('fs');
const { join } = require('path');

function isBook(mfs, filepath) {
  return fs.statSync(filepath).isDirectory() && mfs.exists(join(filepath, '_meta.yml'));
}

module.exports = {
  list(mfs, path) {
    return fs.readdirSync(path).filter(file => isBook(mfs, join(path, file)));
  },
  isReadteractive(mfs, path) {
    return (
      mfs.exists(join(path, 'makefile')) && mfs.exists(join(path, 'process_book.py'))
    );
  }
};
