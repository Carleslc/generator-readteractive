# Readteractive Generator

![CLI](https://img.shields.io/badge/CLI-readteractive--generator-blue.svg)

> A yeoman generator for scaffolding Readteractive books.

We provide a _command line interface_ to easily generate your project doing **scaffolding**, so you do not need to remember the syntax of each file and you can just **focus on writing**.

The [Readteractive structure](https://github.com/Carleslc/Readteractive/readteractive-structure) and files can be automatically generated using this CLI for your custom book.

It also provides a tool for **visualization** of your book with current chapters and the links between them, so you can have a general overview of the **narrative branches** of your book.

<p align="center"><img src="http://yeoman.io/static/yeoman-character-sticker.51cef7e007.png" ></p>

## Installation

First, install [Yeoman](http://yeoman.io) and generator-readteractive using [npm](https://www.npmjs.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)).

```bash
npm install -g yo
npm install -g generator-readteractive
```

Then run the wizard and it will guide you:

```bash
yo readteractive
```

## Features

### Book scaffolding

Generate a new book.

```
yo readteractive:book
```

### TODO

![In development](https://img.shields.io/badge/status-in%20development-red.svg)

- Chapter scaffolding: Generate a new chapter.
- Build: Builds your book 
- Chapter ID rename: Rename a chapter ID.
- Book graph visualization: Shows a graph of your book with current chapters and the links between them.

[npm-image]: https://badge.fury.io/js/generator-readteractive.svg
[npm-url]: https://npmjs.org/package/generator-readteractive
[travis-image]: https://travis-ci.org/Carleslc/generator-readteractive.svg?branch=master
[travis-url]: https://travis-ci.org/Carleslc/generator-readteractive
[daviddm-image]: https://david-dm.org/Carleslc/generator-readteractive.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/Carleslc/generator-readteractive
[coveralls-image]: https://coveralls.io/repos/Carleslc/generator-readteractive/badge.svg
[coveralls-url]: https://coveralls.io/r/Carleslc/generator-readteractive
