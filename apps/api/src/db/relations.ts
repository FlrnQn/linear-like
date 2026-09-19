import { relations } from 'drizzle-orm'

import { activities } from './schema/activities'
import { comments } from './schema/comments'
import { cycles } from './schema/cycles'
import { issueLabels } from './schema/issue-labels'
import { issues } from './schema/issues'
import { labels } from './schema/labels'
import { projects } from './schema/projects'
import { sessions } from './schema/sessions'
import { teamMembers } from './schema/team-members'
import { teams } from './schema/teams'
import { users } from './schema/users'
import { workspaceMembers } from './schema/workspace-members'
import { workspaces } from './schema/workspaces'

export const usersRelations = relations(users, ({ many }) => ({
  workspaceMemberships: many(workspaceMembers),
  teamMemberships: many(teamMembers),
  createdIssues: many(issues, { relationName: 'creator' }),
  assignedIssues: many(issues, { relationName: 'assignee' }),
  comments: many(comments),
  activities: many(activities),
  sessions: many(sessions),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  teams: many(teams),
  projects: many(projects),
  labels: many(labels),
  activities: many(activities),
}))

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [teams.workspaceId], references: [workspaces.id] }),
  members: many(teamMembers),
  issues: many(issues),
  cycles: many(cycles),
}))

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [projects.workspaceId], references: [workspaces.id] }),
  issues: many(issues),
}))

export const cyclesRelations = relations(cycles, ({ one, many }) => ({
  team: one(teams, { fields: [cycles.teamId], references: [teams.id] }),
  issues: many(issues),
}))

export const labelsRelations = relations(labels, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [labels.workspaceId], references: [workspaces.id] }),
  issueLabels: many(issueLabels),
}))

export const issuesRelations = relations(issues, ({ one, many }) => ({
  team: one(teams, { fields: [issues.teamId], references: [teams.id] }),
  assignee: one(users, {
    fields: [issues.assigneeId],
    references: [users.id],
    relationName: 'assignee',
  }),
  creator: one(users, {
    fields: [issues.creatorId],
    references: [users.id],
    relationName: 'creator',
  }),
  project: one(projects, { fields: [issues.projectId], references: [projects.id] }),
  cycle: one(cycles, { fields: [issues.cycleId], references: [cycles.id] }),
  issueLabels: many(issueLabels),
  comments: many(comments),
  activities: many(activities),
}))

export const issueLabelsRelations = relations(issueLabels, ({ one }) => ({
  issue: one(issues, { fields: [issueLabels.issueId], references: [issues.id] }),
  label: one(labels, { fields: [issueLabels.labelId], references: [labels.id] }),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  issue: one(issues, { fields: [comments.issueId], references: [issues.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}))

export const activitiesRelations = relations(activities, ({ one }) => ({
  workspace: one(workspaces, { fields: [activities.workspaceId], references: [workspaces.id] }),
  issue: one(issues, { fields: [activities.issueId], references: [issues.id] }),
  actor: one(users, { fields: [activities.actorId], references: [users.id] }),
}))
