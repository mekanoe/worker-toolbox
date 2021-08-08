const {
  ESBuildBuildPlugin,
} = require("@worker-toolbox/build-plugin-esbuild/dist/index");

module.exports = {
  buildPlugin: ESBuildBuildPlugin,
  buildPluginOptions: {
    entryPoints: ["main.ts"],
    bundle: true,
  },
};
