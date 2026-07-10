import { api } from "../packages/backend/convex/_generated/api.js";

const ref = api.public.messages.list;
const sym = Symbol.for("FunctionReference");
console.log("Symbol.for('FunctionReference'):", ref[sym]);
console.log("ref string representation:", typeof ref[sym]);
