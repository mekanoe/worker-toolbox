import { BuildPlugin, IBuildPlugin } from "@worker-toolbox/build-plugin";
import { build } from "esbuild";

export class ESBuildBuildPlugin extends BuildPlugin implements IBuildPlugin {
  public async build() {
    const result = await build({
      ...this.options,
      // absWorkingDir: path.resolve(this.basePath),
      write: false,
    });

    if (!result.outputFiles) {
      console.log("no output");
      return;
    }

    this.update(result.outputFiles[0].text);
  }
}
