export interface AdminUser {
  id: string
  email: string
  name?: string
}

export function isAuthenticated() {
  if (typeof window === "undefined") return false

  return localStorage.getItem("admin") === "true"
}

export function getAdminUser(): AdminUser | null {
  if (typeof window === "undefined") return null

  const raw = localStorage.getItem("adminUser")

  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function login(user: AdminUser) {
  localStorage.setItem("admin", "true")
  localStorage.setItem("adminUser", JSON.stringify(user))
}

export function logout() {
  localStorage.removeItem("admin")
  localStorage.removeItem("adminUser")
}