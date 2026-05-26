export const FIXED_ACTIVITIES = [
  { id: 'f1',  name: 'Pobudka',           description: '' },
  { id: 'f2',  name: 'Toaleta poranna',   description: '' },
  { id: 'f3',  name: 'Ranna rozgrzewka',  description: '' },
  { id: 'f4',  name: 'Śniadanie',         description: '' },
  { id: 'f5',  name: 'Apel początkowy',   description: '' },
  { id: 'f6',  name: 'Msza',              description: '' },
  { id: 'f7',  name: 'Podwieczorek',      description: '' },
  { id: 'f8',  name: 'Obiad',             description: '' },
  { id: 'f9',  name: 'Czas dla siebie',   description: '' },
  { id: 'f10', name: 'Kolacja',           description: '' },
  { id: 'f11', name: 'Apel końcowy',      description: '' },
  { id: 'f12', name: 'Wieczorne ognisko', description: '' },
  { id: 'f13', name: 'Apel',             description: '' },
  { id: 'f14', name: 'Cisza nocna',       description: '' },
]

export const FIXED_MEALS = [
  { id: 'm1', name: 'Śniadanie',        description: 'Chleb, wędlina, ser, pomidor, herbata' },
  { id: 'm2', name: 'Drugie śniadanie', description: 'Kanapki, owoc, woda' },
  { id: 'm3', name: 'Obiad',            description: 'Catering / zupa + drugie danie' },
  { id: 'm4', name: 'Podwieczorek',     description: 'Ciasto, kompot, owoc' },
  { id: 'm5', name: 'Kolacja',          description: 'Kiełbasa z ogniska, chleb, herbata' },
]

export const DEFAULT_CAMP_ACTIVITIES = [
  { id: 'dc1',  name: 'INO',                  description: 'Impreza na orientację' },
  { id: 'dc2',  name: 'Gra terenowa',         description: '' },
  { id: 'dc3',  name: 'Zajęcia manualne',      description: '' },
  { id: 'dc4',  name: 'Wycieczka',            description: '' },
  { id: 'dc5',  name: 'Pielgrzymka',          description: '' },
  { id: 'dc6',  name: 'Eksploracja',          description: '' },
  { id: 'dc7',  name: 'Konkurs kulinarny',    description: '' },
  { id: 'dc8',  name: 'Pionierka',            description: '' },
  { id: 'dc9',  name: 'De-pionierka',         description: '' },
  { id: 'dc10', name: 'Przyjazd do obozu',    description: '' },
  { id: 'dc11', name: 'Olimpiada sportowa',   description: '' },
  { id: 'dc12', name: 'Bieg patrolowy',       description: '' },
  { id: 'dc13', name: 'Zwiad terenowy',       description: '' },
  { id: 'dc14', name: 'Ognisko z gawędą',     description: '' },
  { id: 'dc15', name: 'Samarytanka',          description: 'Pierwsza pomoc' },
  { id: 'dc16', name: 'Terenoznawstwo',       description: 'Mapa i kompas' },
  { id: 'dc17', name: 'Warsztaty',            description: 'Survival, łączność' },
  { id: 'dc18', name: 'Musztra',              description: '' },
  { id: 'dc19', name: 'Śpiewogranie',         description: 'Śpiewnik obozowy' },
]

export function makeDay(index) {
  return {
    id: `day_${Date.now()}_${index}`,
    label: '',
    slots: [],
  }
}

export function makeSlot(activityName = '', time = '', description = '') {
  return {
    id: `slot_${Date.now()}_${Math.random()}`,
    time,
    name: activityName,
    description,
  }
}
