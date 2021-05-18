import { DataStorageTypes, OutputTypes, StoredRecord } from "./types";

const convertors = {
  text: (value: StoredRecord["value"]) => String(value),
  json: (value: StoredRecord["value"]) => JSON.parse(value),
  arrayBuffer: (value: StoredRecord["value"]) => Buffer.from(value).buffer,
  stream: (value: StoredRecord["value"]) => Buffer.from(value),
};

export const convertRecord = (
  value: StoredRecord["value"],
  type: DataStorageTypes
) => {
  if (type in convertors) {
    return convertors[type](value);
  }

  return value;
};

export const convertToStorable = (value: OutputTypes): string => {
  if (typeof value === "string") {
    return value;
  }

  if (Buffer.isBuffer(value)) {
    return value.toString("utf-8");
  }

  return JSON.stringify(value);
};
