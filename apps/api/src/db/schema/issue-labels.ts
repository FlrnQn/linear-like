import { index, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'

import { issues } from './issues'
import { labels } from './labels'

export const issueLabels = pgTable(
  'issue_labels',
  {
    issueId: uuid()
      .notNull()
      .references(() => issues.id, { onDelete: 'cascade' }),
    labelId: uuid()
      .notNull()
      .references(() => labels.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.issueId, t.labelId] }),
    index('issue_labels_label_id_idx').on(t.labelId),
  ],
)
