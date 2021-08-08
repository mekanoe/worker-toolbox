import { watch } from "chokidar";

export interface IBuildPlugin {
  startWatch: () => void;
  build: () => Promise<void>;
  preUpdate: (code: string) => Promise<string>;
  basePath: string;
  update: (code: string) => void;
}

export interface BuildPluginConstructor {
  new (
    options: any,
    basePath: string,
    onUpdate: (code: string) => void
  ): IBuildPlugin;
}

export class BuildPlugin implements IBuildPlugin {
  constructor(
    public options: any,
    public basePath: string,
    private onUpdate: (code: string) => void
  ) {}

  startWatch() {
    let skipBuild = false;

    watch(this.basePath, { atomic: true, ignoreInitial: true }).on(
      "all",
      (event, path) => {
        if (path.match(/\bnode_modules|dist\b/)) {
          return;
        }

        if (skipBuild) {
          return;
        }

        skipBuild = true;

        try {
          this.build();
        } catch (e) {
          console.error(e);
        } finally {
          skipBuild = false;
        }
      }
    );
  }

  public async build() {
    this.update(`addEventListener('fetch', (event) => {
      event.respondWith("Hello world!")
    })`);
  }

  public async update(code: string) {
    this.onUpdate(await this.preUpdate(code));
  }

  public async preUpdate(code: string): Promise<string> {
    return code;
  }
}
