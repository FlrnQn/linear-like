import { index, jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'

import { activityType } from './enums'
import { issues } from './issues'
import { users } from './users'
import { workspaces } from './workspaces'

export const activities = pgTable(
  'activities',
  {
    id: uuid().primaryKey().defaultRandom(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    issueId: uuid().references(() => issues.id, { onDelete: 'set null' }),
    actorId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    type: activityType().notNull(),
    metadata: jsonb().$type<Record<string, unknown>>(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('activities_issue_id_created_at_idx').on(t.issueId, t.createdAt),
    index('activities_workspace_id_created_at_idx').on(t.workspaceId, t.createdAt),
  ],
)
