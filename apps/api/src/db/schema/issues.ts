import {
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { cycles } from './cycles'
import { issuePriority, issueStatus } from './enums'
import { projects } from './projects'
import { teams } from './teams'
import { users } from './users'

export const issues = pgTable(
  'issues',
  {
    id: uuid().primaryKey().defaultRandom(),
    teamId: uuid()
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    number: integer().notNull(),
    title: varchar({ length: 500 }).notNull(),
    description: text(),
    status: issueStatus().notNull().default('TODO'),
    priority: issuePriority().notNull().default('NO_PRIORITY'),
    assigneeId: uuid().references(() => users.id, { onDelete: 'set null' }),
    creatorId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    projectId: uuid().references(() => projects.id, { onDelete: 'set null' }),
    cycleId: uuid().references(() => cycles.id, { onDelete: 'set null' }),
    estimate: integer(),
    dueDate: date({ mode: 'date' }),
    sortOrder: doublePrecision().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique('issues_team_number_unique').on(t.teamId, t.number),
    index('issues_team_status_idx').on(t.teamId, t.status),
    index('issues_assignee_id_idx').on(t.assigneeId),
    index('issues_project_id_idx').on(t.projectId),
    index('issues_cycle_id_idx').on(t.cycleId),
    index('issues_due_date_idx').on(t.dueDate),
  ],
)
