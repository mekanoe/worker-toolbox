import { Crypto as SubtleCrypto } from "@peculiar/webcrypto";
import { ExpressEvent } from "@worker-toolbox/express-worker-handler";
import fetch, { Response } from "node-fetch";
import { WorkerResponse } from "./WorkerResponse";

export type FetchHandler = (
  event: ExpressEvent
) => Promise<WorkerResponse> | WorkerResponse;

export type WorkerGlobalContext<T = {}> =
  | {
      addEventListener: (eventName: "fetch", handler: FetchHandler) => void;
      /**
       * Protected Fetch Response to match Cloudflare quirks on construct time.
       */
      Response: Response;
      URL: URL;
      /**
       * SubtleCrypto implementation in Node.js. May not be 1:1
       */
      crypto: SubtleCrypto;
      setTimeout: typeof setTimeout;
      clearTimeout: typeof clearTimeout;
      setInterval: typeof setInterval;
      clearInterval: typeof clearInterval;
      fetch: typeof fetch;
      console: typeof console;
    }
  | T;

export const createWorkerContext = <T>(
  extendedContext: T,
  fetchListenerCallback: (newHandler: FetchHandler) => void
): WorkerGlobalContext<T> => {
  return {
    addEventListener: (eventName, handler) => {
      if (eventName === "fetch") {
        fetchListenerCallback(handler);
      }
    },
    Response: Response,
    URL: URL,
    crypto: SubtleCrypto,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    fetch,
    console,
    ...extendedContext,
  };
};
