import { pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core'

import { workspaces } from './workspaces'

export const labels = pgTable(
  'labels',
  {
    id: uuid().primaryKey().defaultRandom(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: varchar({ length: 100 }).notNull(),
    color: varchar({ length: 32 }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('labels_workspace_name_unique').on(t.workspaceId, t.name)],
)
