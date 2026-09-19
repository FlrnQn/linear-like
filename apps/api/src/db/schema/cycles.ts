import {
  date,
  index,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { teams } from './teams'

export const cycles = pgTable(
  'cycles',
  {
    id: uuid().primaryKey().defaultRandom(),
    teamId: uuid()
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    name: varchar({ length: 255 }).notNull(),
    number: integer().notNull(),
    startDate: date({ mode: 'date' }).notNull(),
    endDate: date({ mode: 'date' }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique('cycles_team_number_unique').on(t.teamId, t.number),
    index('cycles_team_id_idx').on(t.teamId),
  ],
)
