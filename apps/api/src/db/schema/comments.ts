import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { issues } from './issues'
import { users } from './users'

export const comments = pgTable(
  'comments',
  {
    id: uuid().primaryKey().defaultRandom(),
    issueId: uuid()
      .notNull()
      .references(() => issues.id, { onDelete: 'cascade' }),
    authorId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    body: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('comments_issue_id_idx').on(t.issueId)],
)
