interface UserRow {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  createdAt: Date
}

export function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  }
}
