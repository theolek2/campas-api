import { createContext, useContext, useState, useCallback } from 'react'

const AlertContext = createContext(null)

export function useAlert() {
  return useContext(AlertContext)
}

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([])

  const alert = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setAlerts(prev => [...prev, { id, message, type }])
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 4000)
  }, [])

  const dismiss = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  const colors = {
    info: 'bg-blue-600',
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-500',
  }

  return (
    <AlertContext.Provider value={alert}>
      <style>{`@keyframes slideIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {alerts.map(a => (
          <div key={a.id}
            className={`${colors[a.type] || colors.info} text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in`}
            style={{ animation: 'slideIn 0.3s ease' }}>
            <span className="flex-1">{a.message}</span>
            <button onClick={() => dismiss(a.id)} className="text-white/70 hover:text-white text-lg leading-none">&times;</button>
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  )
}
