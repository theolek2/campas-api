// Instrukcja organizacji wypoczynku — wersja 7.3.26
// Stowarzyszenie Harcerstwa Katolickiego „Zawisza" · Federacja Skautingu Europejskiego
// Kurs św. Marty i św. Józefa — wypoczynek@skauci-europy.pl

export const INSTRUKCJA_PHASES = [
  {
    id: 'PR',
    phase: 'PRZYGOTOWANIE',
    tab: 'camp',
    icon: '📋',
    color: '#6b7280',
    bg: '#f3f4f6',
    items: [
      { id: 'PR.1', title: 'Termin wypoczynku', desc: 'Wyznaczyć przed rokiem harcerskim i wpisać do kalendarium jednostki. Uwzględnić prywatny kalendarz, wędrówkę letnią i kursy sierpniowe.', star: true, urgent: true },
      { id: 'PR.2', title: 'Rodzice i uczestnicy', desc: 'Poinformowanie rodziców uczestników o terminie, by mogli zaplanować wakacje.' },
      { id: 'PR.3', title: 'Kadra', desc: 'Kompletacja kadry: Duszpasterz, przyboczni, osoba do kontaktu z żywnością, znajomi, rodzice.', star: true },
    ],
  },

  {
    id: 'UC_KADRA',
    phase: 'UCZESTNICY I KADRA',
    tab: 'camp',
    icon: '👥',
    color: '#3b82f6',
    bg: '#eff6ff',
    note: 'Kiedy? Najlepiej: jesień-koniec roku, optymalnie: luty-kwiecień, najpóźniej: maj-czerwiec',
    subs: [
      {
        sub: 'UP',
        label: 'Uprawnienia',
        desc: 'Kwalifikacje kadry niezbędne do organizacji wypoczynku',
        items: [
          { id: 'UP.1', title: 'Dowód osobisty', desc: 'Kierownik i wychowawcy muszą być pełnoletni i mieć ważny dokument tożsamości.' },
          { id: 'UP.2', title: 'Patenty', desc: 'Oryginały dokumentów o ukończeniu kursów i poświadczone kserokopie. Kierownik: min. phm lub pwd + kurs + staż. Wychowawcy: min. pwd lub wykształcenie średnie + kurs.', star: true },
          { id: 'UP.3', title: 'Pełnomocnictwo', desc: 'Pełnomocnictwo dla kierownika wystawiane przez hufiec — umożliwia podpisywanie dokumentów z instytucjami.' },
          { id: 'UP.4', title: 'Kurs PP', desc: 'Oryginały zaświadczeń kursu pierwszej pomocy kierownika i wszystkich wychowawców.', star: true },
          { id: 'UP.5.1', title: 'Orzeczenie lekarskie — pełnienie funkcji', desc: 'Zaświadczenie o braku przeciwwskazań do pełnienia funkcji kierownika/wychowawcy.' },
          { id: 'UP.5.2', title: 'Orzeczenie lekarskie — kontakt z żywnością', desc: 'Orzeczenie sanitarno-epidemiologiczne dla personelu kuchennego i intendenta.' },
        ],
      },
      {
        sub: 'OD',
        label: 'Ochrona Dzieci i Młodzieży',
        items: [
          { id: 'OD.1', title: 'KRK — zaświadczenie o niekaralności', desc: 'Wszyscy członkowie kadry. Dokument ważny 12 miesięcy. Wolontariusze bezpłatnie (zaświadczenie z hufca).', star: true, urgent: true },
          { id: 'OD.2', title: 'RSPTS — sprawdzenie w rejestrze', desc: 'Każdy członek kadry musi być sprawdzony w Rejestrze Sprawców Przestępstw na Tle Seksualnym.', star: true },
          { id: 'OD.3', title: 'Polityka ODiM — certyfikaty', desc: 'Dokumentacja zapoznania kadry z Polityką Ochrony Dzieci i Młodzieży. Wydrukowanie Standardów ODiM 2025.' },
        ],
      },
      {
        sub: 'OK',
        label: 'Organizacja Kadry',
        items: [
          { id: 'OK.1', title: 'Skład i funkcje', desc: 'Skompletowanie kadry i podział zadań i odpowiedzialności.' },
          { id: 'OK.2', title: 'Zakres obowiązków', desc: 'Każdy wychowawca i kierownik musi podpisać dokument określający zakres jego obowiązków.' },
          { id: 'OK.3', title: 'Łączność — zagrożenia i telefony', desc: 'Aplikacja RSO, śledzenie pogody (Monitor Burz, IMGW). Sprawne komórki z zapasowymi ładowarkami.', tab: 'camp' },
          { id: 'OK.4', title: 'Dziennik zajęć', desc: 'Sukcesywnie uzupełniany dokument. Dostępny w wersji A4 lub jako książeczka A5.', tab: 'diary' },
          { id: 'OK.5', title: 'Wypadki — procedura i protokoły', desc: 'Zasady postępowania w razie wypadku. Protokół w 3 egz. min. 12 szt. Rejestr wypadków.' },
        ],
      },
      {
        sub: 'UC',
        label: 'Uczestnicy',
        items: [
          { id: 'UC.1', title: 'Baza Danych', desc: 'Wszyscy uczestnicy i kadra wpisani do Bazy, mają deklarację, opłaconą składkę i wpisaną funkcję.', star: true },
          { id: 'UC.2', title: 'Karty kwalifikacyjne', desc: 'Kierownik uzupełnia dane obozu → hufiec podpisuje → rodzice wypełniają i podpisują (oboje). Dołączyć Regulamin obozu.', star: true },
          { id: 'UC.3', title: 'Lista uczestników', desc: 'Aktualna lista osób zakwalifikowanych przez organizatora.' },
          { id: 'UC.4', title: 'Ekwipunek uczestnika', desc: 'Każdy uczestnik ma określoną listę rzeczy osobistych do zabrania.' },
          { id: 'UC.5', title: 'Transport — dojazd i powrót', desc: 'Ustalić sposób dotarcia i powrotu (rodzice, PKP, autokar, koszty, miejsce). Umowa ewakuacyjna.' },
          { id: 'UC.6', title: 'Zapoznanie z regulaminami', desc: 'Wykaz osób zapoznanych z Instrukcją ppoż., Regulaminem obozu i Regulaminem sanitarnym — do podpisu 1. dnia.', action: 'download', pdf: 'Regulamin obozu' },
          { id: 'UC.7', title: 'Kontakty do rodziców', desc: 'Do informowania w nagłych przypadkach i/lub o stanie zdrowia dziecka.' },
        ],
      },
      {
        sub: 'UB',
        label: 'Ubezpieczenia',
        items: [
          { id: 'UB.1', title: 'Ubezpieczenie NNW', desc: 'Polisa NNW wraz z listą uczestników dla wszystkich uczestników i kadry obozu.' },
          { id: 'UB.2', title: 'Ubezpieczenie OC', desc: 'Polisa OC wraz z listą kadry (członkowie czynni).' },
        ],
      },
    ],
  },

  {
    id: 'PLAN',
    phase: 'PLAN OBOZU',
    tab: 'plan',
    icon: '🗺️',
    color: '#22c55e',
    bg: '#f0fdf4',
    note: 'Kiedy? Najlepiej: jak najwcześniej, optymalnie: grudzień-luty, najpóźniej: marzec-kwiecień',
    subs: [
      {
        sub: 'TR',
        label: 'Teren Obozu',
        items: [
          { id: 'TR.1', title: 'Miejsce obozowe', desc: 'Kontakt z właścicielem (Nadleśnictwo/osoba prywatna) — najlepiej przez telefon. Miejsce osiągalne dla służb ratowniczych (do 100 m od drogi).', star: true, urgent: true, tab: 'camp' },
          { id: 'TR.2', title: 'Rekonesans', desc: 'Lustracja terenu: położenie gniazd, kaplicy, placu apelowego, magazynu żywnościowego, latryn. Spotkanie ze strażą pożarną na miejscu.' },
          { id: 'TR.3', title: 'Miejsce bezpieczne w terenie', desc: 'Otwarty teren z dala od drzew (młodnik/pole), niedaleko drogi asfaltowej dla autokaru ewakuacyjnego.' },
          { id: 'TR.4', title: 'Szkic zagospodarowania terenu', desc: 'Mapa obozu: namioty, gniazda, ustępy, kaplica, paleniska, punkty ppoż., miejsca zbiórki, drogi ewakuacyjne. Załącznik do opinii PSP.', urgent: true, tab: 'map' },
        ],
      },
      {
        sub: 'EW',
        label: 'Ewakuacja',
        items: [
          { id: 'EW.1', title: 'Zasady ewakuacji', desc: 'Prosta grafika z krokami ewakuacji. Kopia na tablicę ogłoszeń. Ewakuacja powinna przebiegać PRZED kataklizmem, nie w trakcie.' },
          { id: 'EW.2', title: 'Miejsce tymczasowego schronienia (MTS)', desc: 'Budynek wyznaczony w porozumieniu z Wójtem Gminy. Pisemna umowa z zarządcą. Straż może wymagać tej umowy do wystawienia opinii.', star: true, tab: 'camp' },
          { id: 'EW.3', title: 'Mapy ewakuacyjne', desc: 'Mapa dojścia do MTS + szkic dojazdu dla służb z zaznaczonymi miejscami bezpiecznymi.' },
        ],
      },
      {
        sub: 'PR_PROG',
        label: 'Program',
        items: [
          { id: 'PR_PROG.1', title: 'Plan pracy (ramowy plan dnia)', desc: 'Rozkład zajęć w ciągu dnia (może być bez godzin). Kopia na tablicę ogłoszeń.', tab: 'plan' },
          { id: 'PR_PROG.2', title: 'Jadłospis', desc: 'Lista posiłków na cały wypoczynek. Ważne: wykaz alergenów, pokrycie z fakturami.', tab: 'jadlospis' },
          { id: 'PR_PROG.3', title: 'Lista zakupów', desc: 'Lista potrzebnych produktów i materiałów.' },
        ],
      },
      {
        sub: 'RG',
        label: 'Regulaminy',
        items: [
          { id: 'RG.1.1', title: 'Regulamin obozu', desc: 'Wymagany spis zasad podpisywany przez uczestnika i rodzica. Kopia na tablicę ogłoszeń.', star: true, action: 'download', pdf: 'Regulamin obozu' },
          { id: 'RG.1.2', title: 'Prawo Harcerskie + Zasady Podstawowe', desc: 'Kopia na tablicę ogłoszeń.' },
          { id: 'RG.1.3', title: 'Regulamin zajęć harcerskich', desc: 'Z 2008 roku — z załącznikami: ubezpieczeń, poruszania, kąpieli, instrukcją ppoż., zajęciami niebezpiecznymi.' },
          { id: 'RG.2.1', title: 'Instrukcja ppoż. i ewakuacji', desc: 'Uzgodniona z właściwą PSP. Załącznik do opinii Straży. Kopia na tablicę ogłoszeń.', urgent: true, action: 'download', pdf: 'Instrukcja ppoż. i ewakuacji' },
          { id: 'RG.2.2', title: 'Regulamin sanitarny', desc: 'Na podstawie Instrukcji Sanitarnej — trzeba edytować. Kopia na tablicę ogłoszeń.' },
        ],
      },
    ],
  },

  {
    id: 'INST',
    phase: 'INSTYTUCJE',
    tab: 'docs',
    icon: '🏛️',
    color: '#eab308',
    bg: '#fefce8',
    note: 'Kiedy? Najlepiej gdy jest wybrane miejsce, optymalnie: styczeń-luty, najpóźniej: marzec-kwiecień',
    subs: [
      {
        sub: 'NL',
        label: 'Nadleśnictwo / Właściciel',
        items: [
          { id: 'NL.1', title: 'Zgoda na organizację obozu', desc: 'Przed właściwymi przygotowaniami uzyskać pisemną zgodę właściciela. Wniosek do Nadleśnictwa lub Wniosek o udostępnienie.', star: true, urgent: true },
          { id: 'NL.2', title: 'Pozwolenie na wykopy', desc: 'Dotyczy dołów chłonnych, latryn, ziemianek i innych prac ziemnych.' },
          { id: 'NL.3', title: 'Umowa las', desc: 'Pisemna umowa wynajęcia terenu z datą, liczbą osób, zakresem użytkowania, płatnością.' },
          { id: 'NL.4', title: 'Protokół zdawczo-odbiorczy', desc: 'Podpisanie u leśniczego przy przejęciu i zdaniu terenu.' },
        ],
      },
      {
        sub: 'GM',
        label: 'Gmina',
        items: [
          { id: 'GM.1', title: 'Pismo do Wójta', desc: 'Prośba o informacje dot. odpadów stałych. Jeśli właściciel wyraził zgodę na latryny — prośba o wskazanie sposobu odprowadzania wody.' },
          { id: 'GM.2', title: 'Odpowiedź Wójta', desc: 'Pisemna zgoda na użytkowanie dołów chłonnych i latryn.' },
          { id: 'GM.3', title: 'Wywóz śmieci', desc: 'Zamówienie/umowa na wywóz odpadów stałych (miejsce, termin, segregacja, worki, płatność).', star: true },
        ],
      },
      {
        sub: 'SP',
        label: 'Straż Pożarna',
        items: [
          { id: 'SP.1', title: 'Pismo przewodnie do PSP', desc: 'Do właściwej Komendy Miejskiej/Powiatowej PSP z prośbą o opinię ppoż.' },
          { id: 'SP.2', title: 'Załączniki do opinii PSP', desc: 'Środki łączności, Lista uczestników, Szkic terenu, Mapki ewakuacyjne, Regulamin, Instrukcja ppoż., Wytyczne ppoż., Protokół uzgodnień 2019.', urgent: true },
          { id: 'SP.3', title: 'Opinia PSP', desc: 'MINIMUM 1,5 MIESIĄCA przed obozem! Straż ma miesiąc od spotkania na miejscu. Wymagana do zgłoszenia do kuratorium.', star: true, urgent: true },
        ],
      },
      {
        sub: 'KR',
        label: 'Kuratorium',
        items: [
          { id: 'KR.1', title: 'Konto organizatora', desc: 'Każdy hufiec ma jedno wspólne konto. Hufcowy może dodawać pracowników.' },
          { id: 'KR.2', title: 'Zgłoszenie wypoczynku', desc: 'NAJPÓŹNIEJ 21 DNI przed wypoczynkiem! Na stronie wypoczynek.men.gov.pl.', star: true, urgent: true },
          { id: 'KR.3', title: 'Zatwierdzenie zgłoszenia', desc: 'Odpowiedź z kuratorium — zatwierdzenie z numerem (wydruk z systemu).' },
        ],
      },
      {
        sub: 'SE',
        label: 'Sanepid',
        items: [
          { id: 'SE.1', title: 'Instrukcja Sanitarna', desc: 'Instrukcja GIS dot. wymagań higieniczno-sanitarnych dla obozów namiotowych. UWAGA: aktualizacja co roku wiosną!' },
          { id: 'SE.2', title: 'Wymagania sanitarne', desc: 'Skrócona wersja — spis rzeczy. Warto odwiedzić lokalny sanepid przed obozem.' },
        ],
      },
      {
        sub: 'KT',
        label: 'Kontakty',
        items: [
          { id: 'KT.1', title: 'Poinformowanie służb', desc: 'Na co najmniej 14 dni przed obozem: PSP, Policja, Szpital/SOR, Wójt/Sołtys, Nadleśnictwo.', star: true },
          { id: 'KT.2', title: 'Kontakty kryzysowe', desc: 'Lista telefonów do: Opieki zdrowotnej, Policji, Właściciela terenu, PSP, Gminy, Sanepidu, Kuratorium, Biura Stowarzyszenia, Psychologa.', star: true },
        ],
      },
    ],
  },

  {
    id: 'FIN',
    phase: 'FINANSE I SPRZĘT',
    tab: 'tasks',
    icon: '💰',
    color: '#ef4444',
    bg: '#fef2f2',
    note: 'Kiedy? Najlepiej marzec-kwiecień, optymalnie kwiecień-maj, najpóźniej maj-czerwiec',
    subs: [
      {
        sub: 'BZ',
        label: 'Budżet',
        items: [
          { id: 'BZ.1', title: 'Kosztorys', desc: 'Plan finansowy z podziałem na kategorie wydatków — by podać koszt obozu rodzicom.', star: true, urgent: true },
          { id: 'BZ.2', title: 'Pieniądze za obóz', desc: 'KP (płatność gotówką) lub Wniosek o zaliczkę (przelew). Rozważyć osobne konto bankowe na czas wypoczynku.' },
        ],
      },
      {
        sub: 'ST',
        label: 'Sprzęt',
        items: [
          { id: 'ST.1', title: 'Lista sprzętu jednostki', desc: 'Inwentaryzacja: ile czego jest, co trzeba dokupić, w jakiej skrzyni.' },
          { id: 'ST.2', title: 'Sprzęt zastępu', desc: 'Każdy zastęp ma swoją listę — wysłać zastępowym sugerowany sprzęt.' },
          { id: 'ST.3', title: 'Pionierka — żerdzie i plandeki', desc: 'Żerdzie od leśniczego (metry przestrzenne S3). Plandeki w kolorach zielonym lub brązowym.' },
          { id: 'ST.4', title: 'Zdrowie — woda, czystość, żywność', desc: 'Zbiorniki wody, środki czystości, izolatka, magazyn żywnościowy (ziemianka), deski do krojenia.' },
          { id: 'ST.5', title: 'Bezpieczeństwo — apteczka i sprzęt gaśniczy', desc: 'Apteczka medyczna (bez leków), gaśnice (min. jedna przy każdym ognisku), koce gaśnicze, wiadra, oznaczenia ewakuacyjne.', star: true },
        ],
      },
      {
        sub: 'PJ',
        label: 'Pojazdy',
        items: [
          { id: 'PJ.1', title: 'Umowa użyczenia pojazdu', desc: 'Jeśli szef nie ma własnego samochodu — umowa z właścicielem na cały okres faktur.', tab: 'docs' },
          { id: 'PJ.2', title: 'Zlecenie wyjazdu służbowego', desc: 'Podpisane przez dwie osoby w hufcu (skarbnik + hufcowy). Nie można wysłać samego siebie.' },
          { id: 'PJ.3', title: 'Ewidencja przebiegu pojazdu', desc: 'Wszystkie trasy powiązane z konkretnym poleceniem wyjazdu.' },
          { id: 'PJ.4', title: 'Faktury za paliwo', desc: 'Faktury muszą zawierać numer rejestracyjny pojazdu.' },
        ],
      },
      {
        sub: 'WD',
        label: 'Wydatki',
        items: [
          { id: 'WD.1', title: 'Faktury', desc: 'Uproszczone (do 450 zł, paragon z NIP-em) lub VAT (pow. 450 zł, e-Faktura z kodem KSeF).' },
          { id: 'WD.2', title: 'Tylne strony faktur', desc: 'Kartki A4 z danymi obozu — przypinać dokumenty mniejsze niż A4. Kserować faktury na papierze termicznym.' },
          { id: 'WD.3', title: 'Tabela wydatków / aplikacja', desc: 'Na bieżąco wpisywać faktury do tabeli lub aplikacji. 1 koszulka = faktury z jednego dnia.' },
          { id: 'WD.4', title: 'Rozliczenie', desc: 'Najpóźniej 14 dni po zakończeniu obozu. Formularz rozliczenia (pierwsze 3 strony dla szefa).', star: true },
        ],
      },
    ],
  },

  {
    id: 'NA',
    phase: 'NA OBOZIE',
    tab: 'during',
    icon: '⛺',
    color: '#f97316',
    bg: '#fff7ed',
    subs: [
      {
        sub: 'NA_START',
        label: 'Sam początek',
        items: [
          { id: 'NA.1', title: 'Szkolenie z bezpieczeństwa', desc: 'Szkolenie BHP i ppoż. dla uczestników: budowa palenisk, używanie narzędzi i sprzętu ppoż., ewakuacja.' },
          { id: 'NA.2', title: 'Zebranie podpisów', desc: 'Uczestnicy i kadra podpisują wykaz zapoznania z instrukcjami i regulaminami.' },
          { id: 'NA.3', title: 'Oznaczenia ewakuacyjne', desc: 'Oznaczyć drogi ewakuacji od gniazd, latryn do placu apelowego i miejsca bezpiecznego.' },
          { id: 'NA.4', title: 'Próbne ewakuacje', desc: 'W pierwszych dniach przynajmniej dwie próbne ewakuacje (dzienną i nocną). Kamizelki odblaskowe przy drogach publicznych.' },
          { id: 'NA.5', title: 'Tablica ogłoszeń', desc: 'Zadaszona, przy placu apelowym. Tabliczka zakaz palenia, kontakty kryzysowe, szkic terenu, mapa ewakuacji, plan dnia, regulamin, prawo harcerskie, instrukcja ppoż.' },
          { id: 'NA.6', title: 'Przyjazd służb', desc: 'Leśniczy (protokół zdawczo-odbiorczy), PSP (szkolenie, dane kontaktowe), Policja (pogadanka). Sanepid i Kuratorium od 2. dnia.' },
          { id: 'NA.7', title: 'Pionierka', desc: 'Funkcjonalna, bezpieczna, estetyczna. Izolatka, ziemianka, maszt, kaplica, kuchnia/jadalnia, latryny, miejsca do mycia, gniazda zastępów.' },
        ],
      },
      {
        sub: 'NA_DAILY',
        label: 'Codziennie',
        items: [
          { id: 'NA.D1', title: 'Kontakt z PSP', desc: 'Codzienny raport do wyznaczonej jednostki PSP — liczba kadry i uczestników (rano i wieczorem o stałej godzinie).' },
          { id: 'NA.D2', title: 'Zbieranie faktur', desc: 'Na bieżąco zbierać faktury i wpisywać do tabeli/aplikacji.' },
          { id: 'NA.D3', title: 'Dziennik zajęć', desc: 'Wpisy wychowawców + adnotacje kierownika "skontrolowano" — na bieżąco.' },
          { id: 'NA.D4', title: 'Ewidencja wypadków', desc: 'Rejestr wypadków, w tym ukąszenia kleszczy (zaznaczać miejsce wbicia kółkiem na skórze).' },
          { id: 'NA.D5', title: 'Uzupełnianie kart uczestników', desc: 'Na bieżąco wpisywać daty przyjazdów/wyjazdów, spostrzeżenia i stan zdrowia.' },
          { id: 'NA.D6', title: 'Kontakt z rodzicami', desc: 'Informowanie rodziców o pogorszeniu stanu zdrowia uczestnika.' },
        ],
      },
    ],
  },

  {
    id: 'PO',
    phase: 'PO OBOZIE',
    tab: 'tasks',
    icon: '🏁',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    items: [
      { id: 'PO.1', title: 'Przekazanie dokumentów do archiwum', desc: 'Zgłoszenie wypoczynku, protokoły pokontrolne, umowy, karty kwalifikacyjne, protokoły powypadkowe, rejestr wypadków, kopie dokumentów kadry, dziennik zajęć.' },
      { id: 'PO.2', title: 'Rozliczenie', desc: 'Najpóźniej 14 dni po zakończeniu obozu. Dokumenty chronologicznie, małe kwitki skserowane, wszystko opisane.', star: true },
      { id: 'PO.3', title: 'Zabezpieczenie sprzętu', desc: 'Wysuszyć i złożyć namioty, oczyścić narzędzia, wypłukać baniaki i pojemniki na żywność.' },
    ],
  },
]

// Flat lista wszystkich itemów (dla localStorage/Supabase)
export function getAllItems() {
  const items = []
  for (const phase of INSTRUKCJA_PHASES) {
    if (phase.items) {
      items.push(...phase.items.map(i => ({ ...i, phase: phase.id })))
    }
    if (phase.subs) {
      for (const sub of phase.subs) {
        items.push(...sub.items.map(i => ({ ...i, phase: phase.id, sub: sub.sub })))
      }
    }
  }
  return items
}

export const ALL_ITEMS = getAllItems()
export const TOTAL_ITEMS = ALL_ITEMS.length
