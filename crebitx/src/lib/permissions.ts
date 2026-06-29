export type UserRole = 'SUPER_ADMIN' | 'TENANT_OWNER' | 'TENANT_ADMIN' | 'STAFF' | 'VIEWER' | string | undefined | null

export function isOwnerRole(role: UserRole) {
  return role === 'SUPER_ADMIN' || role === 'TENANT_OWNER' || role === 'TENANT_ADMIN'
}

export function canManageSettings(role: UserRole) {
  return isOwnerRole(role)
}

export function canManageCustomers(role: UserRole) {
  return isOwnerRole(role) || role === 'STAFF'
}

export function canApplyRuleSuggestions(role: UserRole) {
  return isOwnerRole(role)
}

export function canMutateCustomerData(role: UserRole) {
  return canManageCustomers(role)
}
