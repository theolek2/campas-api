/**
 * MapGlobe — widoczny gdy brak lokalizacji obozu (ETAP 0 niezaliczony).
 * Animowana kula ziemska z przyciskiem do wyboru lokalizacji.
 */
export default function MapGlobe({ onChooseLocation }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="relative w-80 h-80 mb-8">
        {/* Animowana kula ziemska */}
        <img
          src="/map/globus.png"
          alt="Wybierz lokalizację"
          className="w-full h-full object-contain animate-spin"
          style={{ animationDuration: '20s' }}
        />
        {/* Pierścień */}
        <div className="absolute inset-0 rounded-full border-4 border-green-500/30 animate-ping" />
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-2">
        Zaczynamy organizację obozu!
      </h2>
      <p className="text-gray-500 text-center max-w-md mb-6">
        Pierwszy krok to znalezienie miejsca na obóz. Kliknij poniżej, aby wybrać lokalizację na mapie.
      </p>
      <button
        onClick={onChooseLocation}
        className="bg-green-700 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-green-800 transition shadow-lg"
      >
        🌍 Wybierz miejsce obozu
      </button>
    </div>
  )
}
