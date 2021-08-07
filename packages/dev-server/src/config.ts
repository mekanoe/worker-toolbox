export type DevServerConfig = {
  devPort?: number;
  environment?: { [x: string]: string };
  kv?: string[];
  kvStoragePath?: string;
  loader: () => void;
};

export const loadConfig = (configPath: string): DevServerConfig => {
  try {
    const configRaw = require(configPath) as Partial<DevServerConfig>;

    if (!configRaw.loader) {
      throw new Error(
        "No loader was specified in worker.config.js. Please import one, like @worker-toolbox/webpack-loader"
      );
    }

    return {
      devPort: configRaw.devPort,
      environment: configRaw.environment,
      kv: configRaw.kv,
      kvStoragePath: configRaw.kvStoragePath,
      loader: configRaw.loader,
    };
  } catch (e) {
    console.error("worker.config.js failed to load");
    throw e;
  }
};
