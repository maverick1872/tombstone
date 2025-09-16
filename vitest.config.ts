import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        // This project uses the default tsconfig.json
        test: {
          name: 'standard',
          include: ['tests/standard/**/*.test.ts'],
        },
      },
      {
        esbuild: {
          tsconfigRaw: {
            compilerOptions: {
              experimentalDecorators: true,
            },
          },
        },
        test: {
          name: 'experimental',
          include: ['tests/experimental/**/*.test.ts'],
        },
      },
    ],
  },
});
