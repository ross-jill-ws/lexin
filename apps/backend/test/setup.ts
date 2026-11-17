import { afterAll, beforeEach } from "vitest";
import { sqlClient } from "../src/db/client";

beforeEach(async () => {
  await sqlClient`TRUNCATE materials, manufacturers, plants RESTART IDENTITY CASCADE`;
});

afterAll(async () => {
  await sqlClient.end();
});
