import { BuildPlugin, IBuildPlugin } from "@worker-toolbox/dev-server";
import fs from "fs";
import path from "path";
import webpack from "webpack";

export class Webpack4BuildPlugin extends BuildPlugin implements IBuildPlugin {
  async build() {
    try {
      fs.rmSync(path.resolve(this.basePath, "./dist"), {
        force: true,
        recursive: true,
      });

      await this.runWebpack("worker.js");
    } catch (e) {
      console.error("build failed", e);
      return;
    }
    const code = fs.readFileSync(
      path.resolve(this.basePath, "./dist/worker.js"),
      { encoding: "utf-8" }
    );
    this.update(code);
  }

  runWebpack(outputPath: string) {
    return new Promise<void>((resolve, reject) => {
      const configPath = path.resolve(this.basePath, "webpack.config.js");

      const webpackConfig = require(configPath) as webpack.Configuration;
      webpackConfig.output = {
        ...(webpackConfig.output || {}),
        filename: outputPath,
      };
      // webpackConfig.mode = "development";

      webpack(webpackConfig).run((err, stats) => {
        if (err) {
          reject(err);
          return;
        }

        if (stats.hasErrors()) {
          reject(stats.compilation.errors);
          return;
        }

        resolve();
      });
    });
  }
}
