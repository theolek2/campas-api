export default function LandingPage({ onEnterApp, onJoinCamp }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #14532d 0%, #166534 40%, #15803d 100%)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="CampAs" className="h-10 w-10 object-contain" onError={e => { e.target.style.display = 'none' }} />
          <div>
            <div className="text-white font-bold text-xl tracking-wide">CampAs</div>
            <div className="text-green-300 text-xs">Skauci Europy · System Obozowy</div>
          </div>
        </div>
        <button
          onClick={onEnterApp}
          className="text-green-200 hover:text-white text-sm font-medium transition px-3 py-1.5 rounded-lg hover:bg-white/10"
        >
          Zaloguj się →
        </button>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
            Witaj w systemie<br />
            <span className="text-green-300">CampAs</span>
          </h1>
          <p className="text-green-200 text-lg max-w-md mx-auto">
            Kompleksowe narzędzie do organizacji obozów harcerskich Skautów Europy
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-3xl">

          {/* Obóz */}
          <button
            onClick={onEnterApp}
            className="group bg-white rounded-2xl shadow-xl p-6 text-left hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 flex flex-col gap-3"
          >
            <div className="text-4xl">🏕️</div>
            <div>
              <div className="font-bold text-gray-900 text-lg group-hover:text-green-700 transition">Zarządzanie obozem</div>
              <div className="text-gray-500 text-sm mt-1">Dokumenty, plan zajęć, jadłospis, mapa, zadania dla kadry</div>
            </div>
            <div className="mt-auto">
              <span className="inline-flex items-center gap-1 text-green-700 font-semibold text-sm">
                Wejdź <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </span>
            </div>
          </button>

          {/* SWI */}
          <a
            href="/swi"
            className="group bg-white rounded-2xl shadow-xl p-6 text-left hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 flex flex-col gap-3 no-underline"
          >
            <div className="text-4xl">🛒</div>
            <div>
              <div className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition">SWI</div>
              <div className="text-gray-500 text-sm mt-1">System Wspomagania Intendentów — zakupy, budżet, zapasy</div>
            </div>
            <div className="mt-auto">
              <span className="inline-flex items-center gap-1 text-blue-700 font-semibold text-sm">
                Przejdź <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </span>
            </div>
          </a>

          {/* Dołącz */}
          <button
            onClick={onJoinCamp}
            className="group bg-white rounded-2xl shadow-xl p-6 text-left hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 flex flex-col gap-3"
          >
            <div className="text-4xl">🔑</div>
            <div>
              <div className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition">Dołącz do obozu</div>
              <div className="text-gray-500 text-sm mt-1">Masz kod od komendanta? Wpisz go i dołącz do swojego obozu</div>
            </div>
            <div className="mt-auto">
              <span className="inline-flex items-center gap-1 text-orange-600 font-semibold text-sm">
                Dołącz <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </span>
            </div>
          </button>

        </div>

        {/* Footer note */}
        <p className="text-green-400 text-xs mt-10 text-center">
          Stowarzyszenie Harcerstwa Katolickiego „Zawisza" · Federacja Skautingu Europejskiego
        </p>
      </div>
    </div>
  )
}
