# ignorify

A CLI to generate and maintain `.gitignore` using reusable templates.

## What It Does

- Generates `.gitignore` from selected templates (`init`)
- Updates existing generated sections to the latest template content (`update`)
- Preserves your custom rules block at the end of the file

## Install

```bash
npm install -g ignorify
```

## Quick Start

Generate `.gitignore` in your current folder:

```bash
ignorify init
```

Update existing generated template sections:

```bash
ignorify update
```

## Commands

### `ignorify init`

1. Loads available templates.
2. Prompts you to select one or more templates.
3. Rewrites the output file.

Output file: `.gitignore`

### `ignorify update`

1. Reads existing section headers in your current file (`# -- <name>`).
2. Fetches latest content for those section names.
3. Rewrites generated sections while keeping your custom block.

## Generated File Format

Generated content is grouped into sections:

```gitignore
#
# -- common
#
<content from common.ignore>
#
# -- Node.js
#
<content from template>
```

## Custom Rules Block

If your gitignore file already contains this tail block:

```gitignore
#
# ---
#
<your custom rules>
```

it is preserved and appended again after generation/update.

## Template Source

- Templates are fetched from the GitHub `templates` directory.

## Development

Install dependencies:

```bash
pnpm install
```

Run locally in dev mode:

```bash
pnpm local:run init
pnpm local:run update
```

Note: `GIT_IGNORE_DEV=true` and `.gitignore-local` are internal development flows, not public usage.

Build:

```bash
pnpm build
```

Test:

```bash
pnpm test
```

## License

MIT
