import { convertRecord, convertToStorable } from "./convert";

it("converts text record to string", () => {
  expect(convertRecord("hello world!", "text")).toBe("hello world!");
});

it("converts json record to object", () => {
  expect(convertRecord(`{"hello world": true}`, "json")).toStrictEqual({
    "hello world": true,
  });
});

xit("converts arrayBuffer record to ArrayBuffer", () => {
  // TODO: Array buffers are silly, unsure how to do.
  const value = convertRecord("buffer", "arrayBuffer") as ArrayBufferLike;
  expect(Buffer.isBuffer(value)).toBe(true);
});

it("converts stream record to Buffer", () => {
  const value = convertRecord("hello world!", "stream");
  expect(value.toString()).toBe("hello world!");
  expect(Buffer.isBuffer(value)).toBe(true);
});
