import { BodyInit, Response as FetchResponse, ResponseInit } from "node-fetch";

/**
 * WorkerResponse wraps a fetch Response to yell loudly if constructed at an unsafe time.
 * Cloudflare will reject all Response objects that aren't created during a request, so no pre-generation is allowed.
 */
export class WorkerResponse extends FetchResponse {
  // public static canConstruct: boolean = false;
  constructor(body?: BodyInit | undefined, init?: ResponseInit | undefined) {
    super(body, init);
    // if (!WorkerResponse.canConstruct) {
    //   throw new Error(
    //     "Response object created outside of request context. This will be rejected by Cloudflare."
    //   );
    // }
  }
}
