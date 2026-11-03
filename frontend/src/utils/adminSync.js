export const ADMIN_SYNC_EVENT = 'findstore-admin-sync'

export function notifyAdminChange(scope) {
  window.dispatchEvent(new CustomEvent(ADMIN_SYNC_EVENT, {
    detail: { scope, at: Date.now() }
  }))
}

export function subscribeAdminChange(handler) {
  const listener = (event) => handler(event.detail || {})
  window.addEventListener(ADMIN_SYNC_EVENT, listener)
  return () => window.removeEventListener(ADMIN_SYNC_EVENT, listener)
}
