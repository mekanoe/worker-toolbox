#!/usr/bin/env node

const { DevServer } = require("../dist/DevServer.js");

(async () => await DevServer())().catch((e) => {
  console.error(e);
});
