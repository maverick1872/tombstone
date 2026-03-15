export default {
  branches: [
    'develop',
    { name: 'rc-*' }, // release candidates
  ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          { type: 'docs', scope: 'README', release: 'patch' },
          { type: 'refactor', release: 'patch' },
        ],
      },
    ],
    '@semantic-release/release-notes-generator',
    '@semantic-release/github',
    '@semantic-release/npm',
  ],
};

/**
 * NOTE: if desired to maintain a changelog file consider the following plugin configuration.
 *  Specifically the github-commit plugin is used to make commits via the GitHub API which
 *  allows for commit signatures.
 *  '@semantic-release/changelog',
 *  [
 *    '@jno21/semantic-release-github-commit',
 *    {
 *      files: ['dist/**', 'CHANGELOG.md', 'package.json'],
 *    },
 *  ],
 *
 * Additionally, the release workflow might need updated to get credentials for a GitHub App.
 *
 * - name: Generate GitHub App Token
 *   uses: actions/create-github-app-token@v3
 *   id: app-token
 *   with:
 *     app-id: ${{ vars.RELEASE_OPS_APP_ID }}
 *     private-key: ${{ secrets.RELEASE_OPS_APP_PRIVATE_KEY }}
 *
 * - name: Configure Git Author
 *   run: |
 *     APP_SLUG="${{ steps.app-token.outputs.app-slug }}"
 *     APP_ID=$(gh api "/users/${APP_SLUG}[bot]" --jq '.id')
 *     git config user.name "${APP_SLUG}[bot]"
 *     git config user.email "${APP_ID}+${APP_SLUG}[bot]@users.noreply.github.com"
 *   env:
 *     GH_TOKEN: ${{ steps.app-token.outputs.token }}
 */
