import { WorkerRuntimeServer } from "@worker-toolbox/worker-runtime";
import fs from "fs";
import path from "path";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { BuildPluginConstructor } from "./BuildPlugin";

const flags = () =>
  yargs(hideBin(process.argv))
    .option("basePath", {
      alias: "b",
      default: process.cwd(),
      description: "Path of the worker to run",
      normalize: true,
    })
    .option("port", {
      alias: "p",
      default: 8000,
      description: "Dev server port",
      number: true,
    }).argv;

type DevServerConfig = {
  buildPlugin: BuildPluginConstructor;
  buildPluginOptions: any;
};

export const DevServer = async () => {
  const options = await flags();

  const config = getConfig(options.basePath);

  const runtime = new WorkerRuntimeServer({});
  runtime.start(options.port);

  const onUpdate = (code: string) => {
    console.log(`Updated worker code`);
    runtime.mountWorker(code);
  };

  console.log(
    `Starting Worker dev server with ${config.buildPlugin.name.replace(
      "BuildPlugin",
      ""
    )} build plugin on http://localhost:${options.port}`
  );

  console.log(config);

  const buildPlugin = new config.buildPlugin(
    config.buildPluginOptions,
    options.basePath,
    onUpdate
  );
  buildPlugin.build();
  buildPlugin.startWatch();
};

const getConfig = (basePath: string) => {
  const configPath = path.resolve(basePath, "worker.config.js");
  if (!fs.existsSync(configPath)) {
    throw new Error("worker.config.js not present");
  }

  const config = require(configPath) as DevServerConfig;
  return config;
};
