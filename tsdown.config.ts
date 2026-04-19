import { defineConfig } from 'tsdown/config';

export default defineConfig({
  dts: true,
  clean: true,
  outDir: 'lib',
  format: ['cjs'],
  entry: ['src/cli.ts'],
  copy: [
    {
      from: 'src/common.ignore',
      to: 'lib',
    },
  ],
});
