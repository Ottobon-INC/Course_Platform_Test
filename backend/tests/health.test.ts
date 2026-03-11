import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRawMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
}));

vi.mock("../src/services/prisma", () => ({
  prisma: {
    $queryRaw: queryRawMock,
  },
}));

import { createApp } from "../src/app";

describe("GET /health", () => {
  beforeEach(() => {
    queryRawMock.mockReset();
  });

  it("returns a 200 response with status payload", async () => {
    queryRawMock.mockResolvedValueOnce([1]);

    const app = createApp();
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: "ok", database: "connected" });
  });

  it("returns degraded status when database check fails", async () => {
    queryRawMock.mockRejectedValueOnce(new Error("db unavailable"));

    const app = createApp();
    const response = await request(app).get("/health");

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      status: "degraded",
      database: "unavailable",
    });
  });
});
