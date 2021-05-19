import createExpress, { Request, Response } from "express";
import vm from "vm";
import { ExpressEvent } from "../../express-worker-handler/src/ExpressEvent";
import { KVNamespace } from "../../kv/src/KVNamespace";
import {
  createWorkerContext,
  FetchHandler,
} from "../../worker-context/src/Context";
import { WorkerResponse } from "../../worker-context/src/WorkerResponse";

export type Options = {
  /**
   * HTTP port for the server
   */
  port?: number;

  /**
   * KV Namespaces to mount with the worker.
   * All names will be cast to uppercase.
   */
  kvNamespaces?: { [namespace: string]: KVNamespace };

  /**
   * Worker environment variables
   */
  environment?: { [key: string]: string };
};

export class WorkerRuntimeServer {
  public options: Options = {
    port: 8000,
    kvNamespaces: {},
    environment: {},
  };

  private expressApp = createExpress();
  private workerVM?: vm.Context;
  private handler: FetchHandler | null = null;

  constructor(options: Options) {
    this.options = { ...this.options, ...options };
    this.expressApp.use(this.handleRequest);
  }

  /**
   * Starts the server.
   * @param port Port the server will start on. Defaults to 8000
   */
  public start(port?: number) {
    return this.expressApp.listen(port ?? this.options.port ?? 8000);
  }

  /**
   * Mounts worker code into a Node VM.
   * Calling this multiple times will destroy the previously mounted worker.
   * This blocks until worker execution ends. Awaiting it may hang indefinitely.
   */
  public async mountWorker(code: string, filename: string = "worker.js") {
    this.handler = null;

    const workerGlobal = createWorkerContext(
      this.createExtendedContext(),
      (handler) => {
        this.handler = handler;
      }
    );

    const vmContext = vm.createContext(workerGlobal as vm.Context, {
      codeGeneration: {
        strings: false,
        wasm: false,
      },
    });

    this.workerVM = vmContext;
    vm.runInContext(code, vmContext, {
      displayErrors: true,
      breakOnSigint: true,
      filename,
    });
  }

  private createExtendedContext() {
    const extendedContext: { [x: string]: any } = {
      ...this.options.environment,
    };

    for (let namespace in this.options.kvNamespaces) {
      extendedContext[namespace.toUpperCase()] =
        this.options.kvNamespaces[namespace];
    }

    return extendedContext;
  }

  private handleRequest = async (request: Request, response: Response) => {
    if (!this.workerVM) {
      response.statusCode = 503;
      response.end(
        "Server is running, but no worker was mounted with mountWorker()"
      );
      return;
    }

    if (this.handler === null) {
      response.statusCode = 503;
      response.end(
        "Server is running, and worker is mounted, but it never registered a 'fetch' event handler."
      );
      return;
    }

    WorkerResponse.canConstruct = true;
    const event = new ExpressEvent(request, response);
    try {
      await this.handler(event);
    } catch (e) {
      console.error("Worker error:", e);
      response.statusCode = 500;
      response.end("Worker errored, see server logs.");
    }
    WorkerResponse.canConstruct = false;
  };
}
