// HTTP testing utilities

import request from "supertest";
import { Express } from "express";

export class TestHttpHelper {
  constructor(private app: Express) {}

  async get(path: string, headers?: Record<string, string>) {
    return request(this.app)
      .get(path)
      .set(headers || {})
      .expect("Content-Type", /json/);
  }

  async post(path: string, data: any, headers?: Record<string, string>) {
    return request(this.app)
      .post(path)
      .send(data)
      .set(headers || {})
      .expect("Content-Type", /json/);
  }

  async put(path: string, data: any, headers?: Record<string, string>) {
    return request(this.app)
      .put(path)
      .send(data)
      .set(headers || {})
      .expect("Content-Type", /json/);
  }

  async delete(path: string, headers?: Record<string, string>) {
    return request(this.app)
      .delete(path)
      .set(headers || {})
      .expect("Content-Type", /json/);
  }
}

export function createMockAuthHeaders(userId: string, token?: string) {
  return {
    Authorization: token
      ? `Bearer ${token}`
      : `Basic ${btoa(`${userId}:test-token`)}`,
    "Content-Type": "application/json",
  };
}
