import { BuildPluginConstructor } from "@worker-toolbox/build-plugin";
import { WorkerRuntimeServer } from "@worker-toolbox/worker-runtime";
import chalk from "chalk";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import yargs from "yargs";

type WorkerConfig = {
  buildPlugin?: BuildPluginConstructor;
  buildPluginOptions?: any;
};

type GlobalConfig = {
  config?: WorkerConfig;
  V: ReturnType<typeof V>;
  basePath: string;
  args: any;
};

const V =
  (currentDepth: number) =>
  (depth: number, ...message: any) =>
    currentDepth >= depth && console.log(chalk.blue(...message));

export const run = async () => {
  const argv = await yargs
    .option("config", {
      alias: ["c"],
      description: "Path to worker.config.js",
      string: true,
      normalize: true,
      default: path.resolve(process.cwd(), "worker.config.js"),
    })
    .option("worker", {
      alias: ["w"],
      normalize: true,
    })
    .option("port", {
      alias: ["p"],
      number: true,
      default: 8000,
    })
    .option("verbose", {
      alias: ["v"],
      count: true,
    })
    .command("build", "build a worker", buildCommand)
    .command(
      "watch",
      "start a server and watch for changes",
      serverCommand(true)
    )
    .command("start", "start a server", serverCommand(false))
    .command("run", "run a worker", runCommand).argv;
};

const withGlobalConfig =
  (fn: (globalConfig: GlobalConfig) => void) => (args: any) => {
    const { argv } = args;
    const globalConfig: GlobalConfig = {
      basePath: path.dirname(argv.config),
      config: getConfig(argv.config, V(argv.verbose)),
      V: V(argv.verbose),
      args: argv,
    };

    fn(globalConfig);
  };

const getConfig = (configPath: string, V: GlobalConfig["V"]): WorkerConfig => {
  try {
    const config = require(configPath) as WorkerConfig;
    V(1, `using config from ${configPath}`);
    return {
      ...config,
    };
  } catch (e) {
    V(1, "configuration wasn't loaded, using defaults");
    return {};
  }
};

const buildCommand = withGlobalConfig(({ V, config, basePath }) => {
  if (!config) {
    throw new Error("");
  }

  if (!config?.buildPlugin) {
    throw new Error("buildPlugin is missing");
  }

  const onWrite = (code: string) => {
    V(1, "build finished");
    const outputPath = path.resolve(basePath, "dist/worker.js");
    writeFileSync(outputPath, code, {
      encoding: "utf-8",
    });
    console.log(chalk.green`Wrote to ${outputPath}`);
  };

  V(
    0,
    `using ${
      config.buildPlugin.name.replace("BuildPlugin", "") || "default"
    } build plugin`
  );

  const buildPlugin = new config.buildPlugin(
    config?.buildPluginOptions,
    basePath,
    onWrite
  );

  buildPlugin.build();
});

const runCommand = withGlobalConfig(({ V, args: { worker, port } }) => {
  if (!worker || !existsSync(worker)) {
    throw new Error("--worker needs to be set to a pre-built worker file");
  }

  V(1, `loading code from ${worker}`);
  const code = readFileSync(worker, { encoding: "utf-8" });

  V(0, `starting server on http://localhost:${port}`);
  const runtime = new WorkerRuntimeServer({
    port,
  });
  runtime.start();
  runtime.mountWorker(code);
});

const serverCommand = (watch: boolean) =>
  withGlobalConfig(({ V, config, basePath, args: { port } }) => {
    if (!config) {
      throw new Error("");
    }

    if (!config?.buildPlugin) {
      throw new Error("buildPlugin is missing");
    }

    V(0, `starting server on http://localhost:${port}`);
    const runtime = new WorkerRuntimeServer({
      port,
    });
    runtime.start();

    V(
      0,
      `using ${
        config.buildPlugin.name.replace("BuildPlugin", "") || "default"
      } build plugin`
    );

    const onWrite = (code: string) => {
      V(1, "build finished");
      runtime.mountWorker(code);
      console.log(chalk.green`Mounted updated worker`);
    };

    const buildPlugin = new config.buildPlugin(
      config?.buildPluginOptions,
      basePath,
      onWrite
    );

    buildPlugin.build();

    if (watch) {
      V(0, "starting watch mode...");
      buildPlugin.startWatch();
    }
  });
