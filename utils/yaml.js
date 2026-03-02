const yaml = require('js-yaml');
const fs = require('fs');

function readYaml(filepath) {
  try {
    return yaml.load(fs.readFileSync(filepath, 'utf8'));
  } catch (_) {
    return null;
  }
}

module.exports = { readYaml };
