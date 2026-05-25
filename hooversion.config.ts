export default {
  branches: ["main"],
  packages: [
    {
      name: "@openhoo/digihoo",
      path: ".",
      type: "node",
      manifest: "package.json",
      changelog: "CHANGELOG.md",
      scopes: ["@openhoo/digihoo", "digihoo"],
      dependencies: [],
    },
  ],
  hooks: {
    afterVersion: ["bun install --lockfile-only --ignore-scripts"],
  },
  github: {
    releases: true,
  },
};
