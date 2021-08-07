import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { Request as FetchRequest } from "node-fetch";

export class ExpressEvent {
  constructor(
    private expressRequest: ExpressRequest,
    private expressResponse: ExpressResponse,
    public request: FetchRequest = new FetchRequest(
      new URL(
        `http://${expressRequest.headers.host || "localhost"}${
          expressRequest.url
        }`
      ),
      {
        body: ["GET", "HEAD"].includes(expressRequest.method)
          ? undefined
          : expressRequest,
        headers: {
          "cf-client-ip": String(expressRequest.socket.remoteAddress),
          ...Object.entries(expressRequest.headers).reduce(
            (headers, [key, value]) => ({
              ...headers,
              [key.toLowerCase()]: String(value),
            }),
            {}
          ),
        },
        method: expressRequest.method,
      }
    )
  ) {}

  public async respondWith(workerResponse: Promise<Response> | Response) {
    try {
      const settledResponse = await workerResponse;
      if (!settledResponse) {
        throw new ReferenceError(
          "respondWith must be called with a Response or a promise of a Response."
        );
      }

      if (this.expressResponse.headersSent) {
        throw new Error(
          "respondWith was called, but server already sent headers. This could indicate a race condition, you called respondWith() more than once, or async task going un-awaited. Cloudflare will not use the worker in this state."
        );
      }

      for (let header in settledResponse.headers) {
        this.expressResponse.setHeader(
          header,
          settledResponse.headers.get(header) ?? ""
        );
      }
      this.expressResponse.statusCode = settledResponse.status;
      this.expressResponse.end(settledResponse.body);
    } catch (e) {
      console.error(e);
      this.expressResponse.statusCode = 500;
      this.expressResponse.json({ error: "internal server error" });
    }
  }
}
