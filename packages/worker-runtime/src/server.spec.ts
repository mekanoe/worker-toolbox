import { WorkerRuntimeServer } from "./server";
import getPort from "get-port";
import fetch from "node-fetch";
import { KVNamespace } from "@worker-toolbox/kv";

it("starts a server and processes a worker request", async () => {
  const port = await getPort();
  const worker = new WorkerRuntimeServer({
    port,
  });
  worker.mountWorker(`
  addEventListener('fetch', (event) => {
    const response = new Response("hello world!")
    event.respondWith(response)
  })
`);
  const server = worker.start();

  const response = await fetch(`http://localhost:${port}`);
  server.close();

  expect(response.status).toBe(200);
  expect(await response.text()).toBe("hello world!");
});

it("allows live remounting", async () => {
  const port = await getPort();
  const worker = new WorkerRuntimeServer({
    port,
  });
  const server = worker.start();

  worker.mountWorker(`
    addEventListener('fetch', (event) => {
      const response = new Response("hello world!");
      event.respondWith(response);
    });`);
  let response = await fetch(`http://localhost:${port}`);
  expect(response.status).toBe(200);
  expect(await response.text()).toBe("hello world!");

  worker.mountWorker(`
    addEventListener('fetch', (event) => {
      const response = new Response("i am a burger fox!");
      event.respondWith(response);
    });`);
  response = await fetch(`http://localhost:${port}`);
  expect(response.status).toBe(200);
  expect(await response.text()).toBe("i am a burger fox!");

  server.close();
});

it("mounts environment variables", async () => {
  const port = await getPort();
  const worker = new WorkerRuntimeServer({
    port,
    environment: {
      FOX_STATUS: "great",
    },
  });
  worker.mountWorker(`
    addEventListener('fetch', (event) => {
      const response = new Response(FOX_STATUS)
      event.respondWith(response)
    })
  `);
  const server = worker.start();

  const response = await fetch(`http://localhost:${port}`);
  server.close();

  expect(response.status).toBe(200);
  expect(await response.text()).toBe("great");
});

it("mounts KV stores", async () => {
  const port = await getPort();
  const kvNamespace = new KVNamespace();
  const worker = new WorkerRuntimeServer({
    port,
    kvNamespaces: {
      TYPES_OF_FOXES: kvNamespace,
    },
  });

  await kvNamespace.put("arctic", JSON.stringify({ color: "white" }));

  worker.mountWorker(`
    addEventListener('fetch', async (event) => {
      const { color } = await TYPES_OF_FOXES.get('arctic', 'json')
      const response = new Response("arctic foxes are "+color)
      event.respondWith(response)
    })
  `);
  const server = worker.start();

  const response = await fetch(`http://localhost:${port}`);
  server.close();

  expect(response.status).toBe(200);
  expect(await response.text()).toBe("arctic foxes are white");
});

it("throws a 503 when no worker is mounted", async () => {
  const port = await getPort();
  const worker = new WorkerRuntimeServer({
    port,
  });
  const server = worker.start();

  const response = await fetch(`http://localhost:${port}`);
  server.close();

  expect(response.status).toBe(503);
  expect(await response.text()).toMatchInlineSnapshot(
    `"Server is running, but no worker was mounted with mountWorker()"`
  );
});

it("throws a 503 when worker did not register a handler", async () => {
  const port = await getPort();
  const worker = new WorkerRuntimeServer({
    port,
  });
  const server = worker.start();
  worker.mountWorker(``);

  const response = await fetch(`http://localhost:${port}`);
  server.close();

  expect(response.status).toBe(503);
  expect(await response.text()).toMatchInlineSnapshot(
    `"Server is running, and worker is mounted, but it never registered a 'fetch' event handler."`
  );
});
