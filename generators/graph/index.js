'use strict';
const Generator = require('yeoman-generator');
const books = require('../../utils/books');
const { readYaml } = require('../../utils/yaml');
const { farewell } = require('../../utils/messages');
const chalk = require('chalk');
const fs = require('fs');
const { join } = require('path');
const { spawn } = require('child_process');

function extractLinks(bookpath, chapterId) {
  const mdPath = join(bookpath, chapterId, `${chapterId}.md`);
  try {
    const content = fs.readFileSync(mdPath, 'utf8');
    const links = [];
    // Matches Readteractive link syntax: (Text -> [chapter-id])
    const regex = /\(\s*([^)]*?)\s*->\s*\[\s*([^\]]*?)\s*\]\s*\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const text = match[1].trim();
      const target = match[2].trim();
      if (target) {
        links.push({ text, target });
      }
    }

    return links;
  } catch (_) {
    return [];
  }
}

function resolveLink(link, chapters) {
  if (chapters.includes(link)) return link;
  const normalizedLink = books.withoutOrder(link);
  for (const chapter of chapters) {
    if (books.withoutOrder(chapter) === normalizedLink) return chapter;
  }

  return null;
}

function escapeLabel(str) {
  return str.replace(/"/g, '\\"');
}

function generateDotGraph({
  bookTitle,
  chapters,
  chapterTitles,
  chapterLinks,
  linkLabels,
}) {
  const lines = [];
  lines.push(`digraph "${escapeLabel(bookTitle)}" {`);
  lines.push('  rankdir=TB;');
  lines.push(
    '  node [shape=box, style="rounded,filled", fillcolor="#f0f0f0",' +
      ' fontname="Helvetica"];',
  );
  lines.push('  edge [color="#333333", fontname="Helvetica", fontsize=10];');
  lines.push('');

  for (const chapter of chapters) {
    const title = chapterTitles[chapter] || chapter;
    const label = `${escapeLabel(title)}\\n(${escapeLabel(chapter)})`;
    lines.push(`  "${escapeLabel(chapter)}" [label="${label}"];`);
  }

  lines.push('');

  for (const chapter of chapters) {
    const links = chapterLinks[chapter] || [];
    for (const link of links) {
      const texts = linkLabels[chapter] && linkLabels[chapter][link];
      const attrs =
        texts && texts.length > 0 ? ` [label="${escapeLabel(texts.join('\\n'))}"]` : '';
      lines.push(`  "${escapeLabel(chapter)}" -> "${escapeLabel(link)}"${attrs};`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

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

    this.log("Ok, let's visualize the narrative branches graph.");

    const graph = [
      {
        type: 'select',
        name: 'book',
        message: 'To what book does the chapter belong?',
        choices: availableBooks,
        store: true,
      },
    ];

    return this.prompt(graph).then((props) => {
      this.graph = props;
    });
  }

  writing() {
    if (!this.graph) return;

    const bookpath = this.destinationPath(this.graph.book);
    const chapters = books.listChapters(bookpath);

    if (chapters.length === 0) {
      this.log(chalk.yellow('This book has no chapters yet.'));
      return;
    }

    // Sort chapters by order number
    chapters.sort((a, b) => {
      const orderA = books.orderSpecified(a);
      const orderB = books.orderSpecified(b);
      const numA = orderA.isOrderGiven ? parseInt(orderA.idParts[0], 10) : Infinity;
      const numB = orderB.isOrderGiven ? parseInt(orderB.idParts[0], 10) : Infinity;
      return numA - numB;
    });

    const meta = readYaml(join(bookpath, '_meta.yml'));
    const bookTitle = (meta && meta.title) || this.graph.book;

    const chapterTitles = {};
    const chapterLinks = {};
    const linkLabels = {};
    const unresolvedLinks = {};

    for (const chapter of chapters) {
      const chapterMeta = readYaml(join(bookpath, chapter, `${chapter}.yml`));
      chapterTitles[chapter] = (chapterMeta && chapterMeta.title) || chapter;

      const rawLinks = extractLinks(bookpath, chapter);
      const resolved = [];
      const labels = {};
      const unresolved = [];

      for (const link of rawLinks) {
        const target = resolveLink(link.target, chapters);
        if (target) {
          if (!labels[target]) {
            labels[target] = [];
            resolved.push(target);
          }

          labels[target].push(link.text);
        } else {
          unresolved.push(link.target);
        }
      }

      chapterLinks[chapter] = resolved;
      linkLabels[chapter] = labels;
      if (unresolved.length > 0) {
        unresolvedLinks[chapter] = [...new Set(unresolved)];
      }
    }

    // Display text representation
    this.log(chalk.blue.bold(`\nBook: ${bookTitle}`));
    this.log(chalk.blue(`Chapters: ${chapters.length}\n`));

    for (const chapter of chapters) {
      const title = chapterTitles[chapter];
      const links = chapterLinks[chapter];
      this.log(chalk.yellow(`  ${title}`) + chalk.dim(` (${chapter})`));
      if (links.length > 0) {
        for (const link of links) {
          const texts = linkLabels[chapter][link];
          const textInfo = texts.length > 0 ? chalk.dim(` "${texts.join('", "')}"`) : '';
          this.log(
            chalk.green(`    -> ${chapterTitles[link]}`) +
              textInfo +
              chalk.dim(` (${link})`),
          );
        }
      } else {
        this.log(chalk.dim('    (no links)'));
      }
    }

    // Show unresolved links
    const unresolvedChapters = Object.keys(unresolvedLinks);
    if (unresolvedChapters.length > 0) {
      this.log(chalk.red.bold('\nUnresolved links:'));
      for (const chapter of unresolvedChapters) {
        for (const link of unresolvedLinks[chapter]) {
          this.log(chalk.red(`  ${chapter} -> [${link}] (not found)`));
        }
      }
    }

    // Generate DOT file
    const dot = generateDotGraph({
      bookTitle,
      chapters,
      chapterTitles,
      chapterLinks,
      linkLabels,
    });
    const dotPath = join(bookpath, 'graph.dot');
    this.fs.write(dotPath, dot);
    this.log(chalk.blue(`\nGraph DOT file: ${dotPath}`));

    this.dotPath = dotPath;
    this.bookpath = bookpath;
  }

  end() {
    const self = this;

    if (!this.graph || !this.dotPath) {
      this.log(farewell);
      return;
    }

    const { dotPath } = this;
    const pngPath = join(this.bookpath, 'graph.png');
    const renderHint = chalk.blue(
      `You can render the DOT file manually:\n  dot -Tpng ${dotPath} -o ${pngPath}`,
    );
    const done = this.async();

    const dot = spawn('dot', ['-Tpng', dotPath, '-o', pngPath]);

    let settled = false;

    dot.on('error', () => {
      if (settled) return;
      settled = true;
      self.log(
        chalk.yellow(
          '\nInstall Graphviz to render the graph image: ' +
            'https://graphviz.org/download/',
        ),
      );
      self.log(renderHint);
      self.log(farewell);
      done();
    });

    dot.on('close', (code) => {
      if (settled) return;
      settled = true;
      if (code === 0) {
        self.log(chalk.green(`Graph image rendered: ${pngPath}`));
      } else {
        self.log(chalk.yellow('Failed to render graph image.'));
        self.log(renderHint);
      }

      self.log(farewell);
      done();
    });
  }
};
