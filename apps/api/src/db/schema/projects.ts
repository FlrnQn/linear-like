import { date, index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

import { projectStatus } from './enums'
import { workspaces } from './workspaces'

export const projects = pgTable(
  'projects',
  {
    id: uuid().primaryKey().defaultRandom(),
    workspaceId: uuid()
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    icon: varchar({ length: 64 }),
    color: varchar({ length: 32 }),
    status: projectStatus().notNull().default('PLANNED'),
    startDate: date({ mode: 'date' }),
    targetDate: date({ mode: 'date' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('projects_workspace_id_idx').on(t.workspaceId)],
)
