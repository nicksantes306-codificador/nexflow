// @nexflow/db — fonte única do schema e dos tipos gerados do Supabase.
// As migrations versionadas vivem em /supabase/migrations.
// Os tipos TS são gerados com `pnpm --filter @nexflow/db gen`.
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./database.types";
