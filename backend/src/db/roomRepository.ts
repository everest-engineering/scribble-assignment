import type { Room } from "../models/game.js";
import { db } from "./database.js";

const selectStmt = db.prepare("SELECT data FROM rooms WHERE code = ?");
const existsStmt = db.prepare("SELECT 1 FROM rooms WHERE code = ?");
const upsertStmt = db.prepare(`
  INSERT INTO rooms (code, data, updated_at) VALUES (?, ?, ?)
  ON CONFLICT(code) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
`);
const deleteStmt = db.prepare("DELETE FROM rooms WHERE code = ?");

export const roomRepository = {
  find(code: string): Room | undefined {
    const row = selectStmt.get(code) as { data: string } | undefined;
    return row ? (JSON.parse(row.data) as Room) : undefined;
  },

  exists(code: string): boolean {
    return existsStmt.get(code) !== undefined;
  },

  save(room: Room): void {
    upsertStmt.run(room.code, JSON.stringify(room), room.updatedAt);
  },

  delete(code: string): void {
    deleteStmt.run(code);
  }
};
