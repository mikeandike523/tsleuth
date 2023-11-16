# tsleuth

A collection of typescript too

### generate-docs

An advanced, hierarchically structured, automatic documentation generator for Typescript ^5 projects.

### More tools tbd...

Ideas:

1. Import normalization to relative/absolute
2. Checking for exported definitions that are not used anywhere else

## Examples

### generate-docs

![Example](/readme-assets/screenshot-1.png)

## Requirements

- Yarn Package Manager (installed globally, in path)

## Setup (From Source)

- Clone the repo
- `yarn install`
- `yarn run build-all`
- Add the repo root to your path
- **IMPORTANT!** In any project you want to use with this tool, add ".tsleuth" to your `.gitignore` file

## Usage

### generate-docs

- `tsleuth generate-docs` - Scans the current working directory (CWD) for Typescript (.ts, .tsx) source files according, respecting `.gitignore` in the CWD and subdirectories. Generates a static website, storing files in a hidden folder (".tsleuth") in the CWD
- `tsleuth generate-docs --serve` Serve the documentation static site on an appropriate open port, and open the site in a web browser
- `tsleuth generate-docs --use-cached` Useful for developers contributing to this project. Generates the static site again, but uses the cached AST intermediates to avoid needing to reanalyze source files

#### How to use the generated documentation site

- @todo
