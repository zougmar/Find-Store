import { useEffect, useRef } from 'react'
import { ADMIN_SYNC_EVENT } from '../utils/adminSync'

export default function useAutoRefresh(callback, { interval = 20000, scopes = [] } = {}) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback
  const scopesKey = scopes.join('|')

  useEffect(() => {
    let lastRun = 0

    const run = () => {
      if (document.visibilityState === 'hidden') return
      const now = Date.now()
      if (now - lastRun < 1200) return
      lastRun = now
      callbackRef.current()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') run()
    }

    const onAdmin = (event) => {
      const scope = event.detail?.scope
      const allowed = scopesKey ? scopesKey.split('|') : []
      if (!allowed.length || allowed.includes(scope) || scope === 'all') {
        lastRun = 0
        run()
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', run)
    window.addEventListener(ADMIN_SYNC_EVENT, onAdmin)
    const timer = window.setInterval(run, interval)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', run)
      window.removeEventListener(ADMIN_SYNC_EVENT, onAdmin)
      window.clearInterval(timer)
    }
  }, [interval, scopesKey])
}
