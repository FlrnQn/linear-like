import { index, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

import { workspaceRole } from './enums'
import { users } from './users'
import { workspaces } from './workspaces'

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: uuid().primaryKey().defaultRandom(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: workspaceRole().notNull().default('MEMBER'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('workspace_members_workspace_user_unique').on(t.workspaceId, t.userId),
    index('workspace_members_user_id_idx').on(t.userId),
  ],
)
