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
    afterVersion: ["npm install --package-lock-only --ignore-scripts"],
  },
  github: {
    releases: true,
  },
};
