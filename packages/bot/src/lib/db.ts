import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

// Initialize lowdb
const adapter = new JSONFile<{
  initialMessages: Record<string, boolean>;
  firstToss: Record<string, boolean>;
}>(".cache/db.json");
export const db = new Low<{
  initialMessages: Record<string, boolean>;
  firstToss: Record<string, boolean>;
}>(adapter, {
  initialMessages: {},
  firstToss: {},
});
