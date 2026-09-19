import type { Issue } from '@lynx/types'
import { cn } from '@lynx/shared'
import { motion } from 'motion/react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { PRIORITY_LABEL_KEYS, STATUS_DOT_COLORS } from './status-priority'

function IssueRowImpl({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  const { t } = useTranslation()

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      type="button"
      onClick={onClick}
      className="border-border hover:border-accent flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors"
    >
      <span className="text-muted-foreground w-16 shrink-0 text-xs">{issue.identifier}</span>
      <span
        className={cn(
          'h-2 w-2 shrink-0 rounded-full transition-colors duration-300',
          STATUS_DOT_COLORS[issue.status],
        )}
      />
      <span className="flex-1 truncate">{issue.title}</span>

      {issue.labels.length > 0 && (
        <span className="hidden gap-1 sm:flex">
          {issue.labels.map((label) => (
            <span
              key={label.id}
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: `${label.color}22`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </span>
      )}

      {issue.priority !== 'NO_PRIORITY' && (
        <span className="text-muted-foreground hidden shrink-0 text-xs sm:inline">
          {t(PRIORITY_LABEL_KEYS[issue.priority])}
        </span>
      )}

      <span className="text-muted-foreground w-24 shrink-0 truncate text-xs">
        {issue.assignee?.name ?? t('common.unassigned')}
      </span>
    </motion.button>
  )
}

export const IssueRow = memo(IssueRowImpl)
