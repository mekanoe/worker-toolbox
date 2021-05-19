import { KVNamespace } from "./KVNamespace";

const getSecondsSinceEpoch = () => Math.floor(Date.now() / 100);

it("can read and write text data", async () => {
  const namespace = new KVNamespace();

  const data = "hello world";
  await namespace.put("hello-world", data);

  const record = await namespace.get("hello-world", "text");
  expect(record).toBe(data);
});

it("can read and write json data", async () => {
  const namespace = new KVNamespace();

  const data = { fiesty: "fox" };
  await namespace.put("hello-world", data);

  const record = await namespace.get("hello-world", "json");
  expect(record).toStrictEqual(data);
});

xit("can read and write arrayBuffer data", async () => {
  // x-it because arrayBuffers are semi-difficult
  const namespace = new KVNamespace();

  const data = new ArrayBuffer(1024);
  Buffer.from(data).write("a".repeat(1024));
  await namespace.put("hello-world", data);

  const record: ArrayBuffer = (await namespace.get(
    "hello-world",
    "arrayBuffer"
  )) as ArrayBuffer;
  expect(Buffer.from(record).toString()).toStrictEqual("a".repeat(1024));
});

it("can read and write stream data", async () => {
  const namespace = new KVNamespace();

  const data = Buffer.from("a".repeat(1024));
  await namespace.put("hello-world", data);

  const record = (await namespace.get("hello-world", "stream")) as Buffer;
  expect(Buffer.from(record).toString()).toStrictEqual("a".repeat(1024));
});

it("returns null when the record has not expired", async () => {
  jest.useFakeTimers("modern");
  const namespace = new KVNamespace();

  const data = "hello world";
  await namespace.put("hello-world", data, { expirationTtl: 100 });

  const record = await namespace.get("hello-world", "text");
  expect(record).toStrictEqual(data);
  jest.useRealTimers();
});

it("returns null when the record has expired by ttl", async () => {
  jest.useFakeTimers("modern");
  const namespace = new KVNamespace();

  const data = "hello world";
  await namespace.put("hello-world", data, { expirationTtl: 100 });
  jest.setSystemTime(Date.now() + 200 * 1000);

  const record = await namespace.get("hello-world", "text");
  expect(record).toBeNull();
  jest.useRealTimers();
});

it("returns null when the record has expired by timestamp", async () => {
  jest.useFakeTimers("modern");
  const namespace = new KVNamespace();

  const data = "hello world";
  await namespace.put("hello-world", data, {
    expiration: getSecondsSinceEpoch() + 100,
  });
  jest.setSystemTime(Date.now() + 200 * 1000);

  const record = await namespace.get("hello-world", "text");
  expect(record).toBeNull();
  jest.useRealTimers();
});

it("can store and retrieve metadata on a record", async () => {
  const namespace = new KVNamespace();

  const data = { fiesty: "fox" };
  const metadata = { foxState: "pointy" };
  await namespace.put("hello-world", data, { metadata });

  const recordWithMetadata = await namespace.getWithMetadata(
    "hello-world",
    "json"
  );
  expect(recordWithMetadata?.metadata).toStrictEqual(metadata);
});

it("throws when metadata is too long", async () => {
  const namespace = new KVNamespace();

  const data = { fiesty: "fox" };
  const metadata = { foxState: "pointy".repeat(1000) };
  expect(() =>
    namespace.put("hello-world", data, { metadata })
  ).toThrowErrorMatchingInlineSnapshot(
    `"metadata serialized to 6015 bytes, but the maximum is 1024 bytes."`
  );
});

it("throws when expiration and expirationTtl are set", async () => {
  const namespace = new KVNamespace();

  const data = { fiesty: "fox" };
  expect(() =>
    namespace.put("hello-world", data, {
      expiration: Date.now() / 1000 + 61,
      expirationTtl: 61,
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"expiration and expirationTtl cannot be set together"`
  );
});

it("throws when expiration is too short", async () => {
  const namespace = new KVNamespace();

  const data = { fiesty: "fox" };
  expect(() =>
    namespace.put("hello-world", data, {
      expiration: Date.now() / 1000 + 10,
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"expiration cannot be less than 60 seconds in the future, or in the past."`
  );
});

it("throws when expiration is in the past", async () => {
  const namespace = new KVNamespace();

  const data = { fiesty: "fox" };
  expect(() =>
    namespace.put("hello-world", data, {
      expiration: Date.now() / 1000 - 1000,
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"expiration cannot be less than 60 seconds in the future, or in the past."`
  );
});

it("throws when expirationTtl is too short", async () => {
  const namespace = new KVNamespace();

  const data = { fiesty: "fox" };
  expect(() =>
    namespace.put("hello-world", data, {
      expirationTtl: 10,
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"expirationTtl cannot be less than 60 seconds"`
  );
});
