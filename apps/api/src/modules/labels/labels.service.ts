import type { CreateLabelInput } from '@lynx/types'
import { and, eq } from 'drizzle-orm'

import { db } from '../../db/client'
import { labels } from '../../db/schema'
import { ConflictError } from '../../lib/errors'

export async function createLabel(input: CreateLabelInput) {
  const existing = await db.query.labels.findFirst({
    where: and(eq(labels.workspaceId, input.workspaceId), eq(labels.name, input.name)),
  })
  if (existing) {
    throw new ConflictError(`A label named "${input.name}" already exists in this workspace`)
  }

  const [label] = await db.insert(labels).values(input).returning()
  if (!label) throw new Error('Failed to create label')
  return label
}

export async function listLabelsForWorkspace(workspaceId: string) {
  return db.query.labels.findMany({ where: eq(labels.workspaceId, workspaceId) })
}
