import { useState, useRef, useEffect, useMemo, useCallback } from 'react'

const DOC_HEADER = ''
const DOC_FOOTER = ''

function parseChoices(html) {
  const choices = {}
  const regex = /\{\{CHOICE:([^:}]+):([^}]+)\}\}/g
  let m
  while ((m = regex.exec(html)) !== null) {
    const id = m[1]
    const options = m[2].split('|')
    if (!choices[id]) choices[id] = { options, selected: 0 }
  }
  return choices
}

// ── Generatory treści załączników ──────────────────────────────────────────────

function generateContactsHtml(meta) {
  const wychowawcy = (meta.wychowawcy || []).filter(w => w.name)
  return DOC_HEADER + `
<div style="text-align:center;font-size:13pt;font-weight:bold;margin-bottom:18px;">ŚRODKI ŁĄCZNOŚCI</div>
<div style="font-size:10pt;color:#555;margin-bottom:14px;">Załącznik do pisma przewodniego – dane kontaktowe kadry obozu</div>

<table style="width:100%;border-collapse:collapse;font-size:10.5pt;margin-bottom:18px;">
  <tr style="background:#2d6a2d;color:#fff;">
    <th style="padding:8px 10px;text-align:left;">Kierownik wypoczynku</th>
    <th style="padding:8px 10px;text-align:left;">Telefon</th>
    <th style="padding:8px 10px;text-align:left;">E-mail</th>
  </tr>
  <tr style="background:#f0fdf4;">
    <td style="padding:8px 10px;font-weight:bold;">${meta.kierownik || '...'}</td>
    <td style="padding:8px 10px;">${meta.tel_kierownik || '...'}</td>
    <td style="padding:8px 10px;">${meta.email || '...'}</td>
  </tr>
</table>

<table style="width:100%;border-collapse:collapse;font-size:10.5pt;">
  <tr style="background:#2d6a2d;color:#fff;">
    <th style="padding:8px 10px;text-align:left;width:3em;">Nr</th>
    <th style="padding:8px 10px;text-align:left;">Wychowawca</th>
    <th style="padding:8px 10px;text-align:left;">Telefon</th>
  </tr>
  ${wychowawcy.length === 0 ? `<tr><td colspan="3" style="padding:16px 10px;text-align:center;color:#999;">Brak wychowawców — dodaj w Danych Obozu</td></tr>` : ''}
  ${wychowawcy.map((w, i) => `
  <tr style="background:${i % 2 === 0 ? '#f0fdf4' : '#fff'};">
    <td style="padding:8px 10px;">${i + 1}</td>
    <td style="padding:8px 10px;font-weight:bold;">${w.name}</td>
    <td style="padding:8px 10px;">${w.phone || '...'}</td>
  </tr>`).join('')}
</table>

<div style="margin-top:20px;font-size:9pt;color:#666;border:1px solid #d1d5db;border-radius:8px;padding:12px 16px;background:#f9fafb;">
  <b>Numery alarmowe (stałe):</b><br/>
  &bull; Pogotowie: <b>999</b> / <b>112</b><br/>
  &bull; Straż Pożarna: <b>998</b> — ${meta.psp || '...'}<br/>
  &bull; Policja: <b>997</b> — ${meta.policja || '...'}<br/>
  &bull; Szpital/Przychodnia: ${meta.szpital || meta.przychodnia || '...'}
</div>
` + DOC_FOOTER
}

function generateParticipantsHtml(meta) {
  const MAX_PER_PAGE = 20
  const totalCount = Math.max(MAX_PER_PAGE, (parseInt(meta.uczestnicy) || 0) + 5)
  const pageCount = Math.ceil(totalCount / MAX_PER_PAGE)

  const tableBlock = (startRow, endRow) => `
<table style="width:100%;border-collapse:collapse;font-size:10pt;">
  <thead>
    <tr style="background:#2d6a2d;color:#fff;">
      <th style="padding:8px 10px;text-align:center;width:3em;">Lp.</th>
      <th style="padding:8px 10px;text-align:left;">Imię i nazwisko</th>
      <th style="padding:8px 10px;text-align:center;width:8em;">Rok urodzenia</th>
    </tr>
  </thead>
  <tbody>
    ${Array.from({ length: endRow - startRow }, (_, i) => {
      const n = startRow + i + 1
      return `<tr style="background:${n % 2 === 0 ? '#f0fdf4' : '#fff'};">
      <td style="padding:10px;text-align:center;color:#666;">${n}</td>
      <td style="padding:10px;color:#aaa;border-bottom:1px solid #e5e7eb;">............................</td>
      <td style="padding:10px;text-align:center;color:#aaa;border-bottom:1px solid #e5e7eb;">..........</td>
    </tr>`
    }).join('')}
  </tbody>
</table>`

  const pages = Array.from({ length: pageCount }, (_, i) =>
    tableBlock(i * MAX_PER_PAGE, Math.min((i + 1) * MAX_PER_PAGE, totalCount))
  ).join('<div style="page-break-after:always;height:0;"></div>')

  return DOC_HEADER + `
<div style="text-align:center;font-size:13pt;font-weight:bold;margin-bottom:10px;">LISTA UCZESTNIKÓW</div>
<div style="font-size:10pt;color:#555;margin-bottom:8px;">Załącznik do pisma przewodniego</div>

<p style="font-size:9pt;color:#e11d48;background:#fef2f2;padding:8px 12px;border-radius:6px;margin-bottom:14px;font-weight:bold;">⚠️ Tu trzeba wpisać imiona — kliknij w pola tabeli i edytuj</p>

${pages}

<div style="margin-top:22px;text-align:right;font-size:9pt;">
  <div style="display:inline-block;text-align:center;">
    <div style="border-top:1px solid #333;width:180px;margin-bottom:4px;"></div>
    <span style="color:#666;">podpis kierownika</span>
  </div>
</div>
` + DOC_FOOTER
}

function generateRegulaminHtml(meta) {
  const f = (v, dots = '....................') => v
    ? `<span style="background:#e0f2fe;padding:1px 4px;border-radius:3px;color:#0369a1;">${v}</span>`
    : `<span style="background:#e0f2fe;padding:1px 4px;border-radius:3px;color:#9ca3af;">${dots}</span>`
  const w1 = meta.wychowawcy?.[0]?.name || meta.kontakt1 || ''
  const w2 = meta.wychowawcy?.[1]?.name || meta.kontakt2 || ''
  return DOC_HEADER + `
<p style="font-weight:bold;text-align:center;font-size:14pt;margin:0 0 20px;">REGULAMIN OBOZU HARCERSKIEGO W ${f(meta.miejsce)}</p>

<p style="font-weight:bold;margin-top:16px;font-size:11pt;">I. ORGANIZATOR</p>
<ol style="margin:6px 0 12px 22px;">
  <li style="margin-bottom:5px;">Organizatorem jest: Stowarzyszenie Harcerstwa Katolickiego „Zawisza" Federacja Skautingu Europejskiego ${f(meta.hufiec)}</li>
  <li style="margin-bottom:5px;">Przedstawicielem organizatora i kierownikiem wypoczynku: obóz harcerski ${f(meta.miejsce, 'nazwę miejsca obozu')} oraz ${f(meta.jednostka, 'jednostka')} jest kierownik (komendant), który sprawuje bezpośredni nadzór nad stanem ochrony przeciwpożarowej): ${f(meta.kierownik, 'imię i nazwisko')}</li>
  <li style="margin-bottom:5px;">Funkcję wychowawców sprawują: ${f(w1, 'imię i nazwisko')}${w2 ? ', ' + f(w2) : ''}</li>
</ol>

<p style="font-weight:bold;margin-top:16px;font-size:11pt;">II. PROGRAM I ORGANIZACJA OZOBU</p>
<ol style="margin:6px 0 12px 22px;">
  <li style="margin-bottom:5px;">Ze względu na specyfikę obozu FSE podczas zajęć opiekę nad uczestnikami obozu sprawuje wychowawca.</li>
  <li style="margin-bottom:5px;">Od strony higieniczno-sanitarnej obóz spełnia wymogi określone w Instrukcji Głównego Inspektora Sanitarnego ${f('', 'data wydania najnowszej instrukcji')}</li>
  <li style="margin-bottom:5px;">Uczestnicy sami budują obozowiska zastępów. Podczas budowy obozu posługują się narzędziami, takimi jak piła, siekiera, dłuto, nóż, młotek itp.</li>
  <li style="margin-bottom:5px;">Posiłki przygotowywane są w zastępach (szóstkach), przez samych uczestników na paleniskach przez nich zbudowanych. Komendant obozu wyznacza zdrową osobę do nadzoru nad żywieniem, której stan zdrowia potwierdza aktualne orzeczenie lekarskie.</li>
  <li style="margin-bottom:5px;">W celu zapewnienia bezpieczeństwa komendant obozu może wyznaczyć zastęp, który będzie pełnił nocną wartę.</li>
</ol>

<p style="font-weight:bold;margin-top:16px;font-size:11pt;">III. PRAWA I OBOWIĄZKI UCZESTNIKÓW</p>
<ol style="margin:6px 0 12px 22px;">
  <li style="margin-bottom:5px;">Uczestnicy mogą korzystać ze sprzętu turystycznego, jakim dysponuje obóz.</li>
  <li style="margin-bottom:5px;">Uczestnicy są zobowiązani uczestniczyć w pełnym programie realizacji obozu.</li>
  <li style="margin-bottom:5px;">Uczestnicy wyznaczeni do pełnienia określonych funkcji są odpowiedzialni za wywiązanie się z nich przed zastępowym i komendantem obozu.</li>
  <li style="margin-bottom:5px;">Każdy uczestnik zobowiązany jest do zachowania postawy godnej harcerza oraz przestrzegania zasad harcerskiego współdziałania w grupie, a w szczególności do przestrzegania Prawa Harcerskiego.</li>
  <li style="margin-bottom:5px;">Uczestnicy zobowiązani są również do bezwzględnego przestrzegania wszelkich zarządzeń komendanta obozu, a także do:
    <ol type="a" style="margin:4px 0 4px 20px;">
      <li>zabrania ze sobą wyposażenia osobistego i zespołowego zgodnie z wykazem podanym przez drużynowego (latarkę, ubranie przeciwdeszczowe itp.),</li>
      <li>do opieki nad powierzonym sprzętem i ekwipunkiem.</li>
    </ol>
  </li>
  <li style="margin-bottom:5px;">W razie złego samopoczucia lub wypadku uczestnicy są zobowiązani natychmiast poinformować wychowawcę lub komendanta obozu.</li>
  <li style="margin-bottom:5px;">Uczestnicy dbają o bezpieczeństwo swoje i innych - wszystkie zagrożenia mające wpływ na bezpieczeństwo uczestników należy zgłaszać kierownikowi lub wychowawcom.</li>
  <li style="margin-bottom:5px;">Uczestnicy są posłuszni poleceniom w czasie ewakuacji, po przeliczeniu w miejscu zbiórki do ewakuacji nie oddalają się od grupy i sprawnie przemieszczają się w bezpieczne miejsce.</li>
</ol>

<p style="font-weight:bold;margin-top:16px;font-size:11pt;">IV. ZAKAZY I NAKAZY</p>
<ol style="margin:6px 0 12px 22px;">
  <li style="margin-bottom:5px;">Uczestnikom zabrania się:
    <ol type="a" style="margin:4px 0 4px 20px;">
      <li>oddalania się od grupy w czasie trwania obozu bez zgody instruktora,</li>
      <li>picia alkoholu, palenia tytoniu oraz zażywania innych środków odurzających,</li>
      <li>zabierania ze sobą na obóz sprzętów elektronicznych; zakres używania telefonów komórkowych określa komendant obozu,</li>
      <li>zabrania się krzyków, niszczenia przyrody, rozpalania ognisk w miejscach niedozwolonych,</li>
      <li>zabrania się przyjmowania leków bez wiedzy wychowawcy, kierownika.</li>
    </ol>
  </li>
  <li style="margin-bottom:5px;">Uczestnicy zobowiązani są do przestrzegania wszelkich zarządzeń i przepisów odpowiednich instytucji terenowych.</li>
</ol>

<p style="font-weight:bold;margin-top:16px;font-size:11pt;">V. SANKCJE</p>
<ol style="margin:6px 0 12px 22px;">
  <li style="margin-bottom:5px;">Ze względu na specyfikę formy zajęć wobec wszelkiego przekroczenia regulaminu będą wyciągnięte konsekwencje przez komendanta obozu.</li>
  <li style="margin-bottom:5px;">Skala sankcji zależy od stopnia wykroczenia: od upomnienia do wydalenia z obozu.</li>
  <li style="margin-bottom:5px;">Komendant obozu może zadecydować o dyscyplinarnym usunięciu z obozu całego zastępu.</li>
  <li style="margin-bottom:5px;">W wypadku wydalenia z obozu za odebranie uczestnika odpowiadają rodzice. Opłaty za uczestnictwo w obozie nie zwraca się.</li>
</ol>

<p style="margin-top:28px;text-align:center;font-style:italic;">Oświadczam, że zapoznałem/am się z regulaminem i zgadzam się na udział syna/córki<br/>w obozie ${f(meta.jednostka, '…..........................')} na określonych wyżej warunkach.</p>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div style="text-align:center;">
    <div style="border-top:1px solid #333;width:200px;padding-top:4px;">(podpis uczestnika, podpis rodzica)</div>
  </div>
  <div style="text-align:center;">
    <div style="border-top:1px solid #333;width:200px;padding-top:4px;">(podpis komendanta obozu)</div>
  </div>
</div>
` + DOC_FOOTER
}

function generatePpozHtml(meta) {
  const f = (v, dots = '....................') => v
    ? `<span style="background:#e0f2fe;padding:1px 4px;border-radius:3px;color:#0369a1;">${v}</span>`
    : `<span style="background:#e0f2fe;padding:1px 4px;border-radius:3px;color:#9ca3af;">${dots}</span>`
  const w1 = meta.wychowawcy?.[0]?.name || meta.kontakt1 || ''
  const t1 = meta.wychowawcy?.[0]?.phone || meta.tel_kontakt1 || ''
  return DOC_HEADER + `
<p style="font-weight:bold;text-align:center;font-size:13pt;margin:0 0 2px;">REGULAMIN ZASAD PROWADZENIA ZAJĘĆ HARCERSKICH W STOWARZYSZENIU HARCERSTWA KATOLICKIEGO „ZAWISZA" FEDERACJA SKAUTINGU EUROPEJSKIEGO</p>
<p style="text-align:center;margin-bottom:18px;font-size:10pt;">załącznik 4</p>

<p style="font-weight:bold;text-align:center;font-size:12pt;margin:14px 0 10px;">CZĘŚĆ 1 – OGÓLNA INSTRUKCJA PRZECIWPOŻAROWA</p>

<p style="margin-top:10px;"><b>§ 1</b></p>
<p>1. Instrukcja określa zasady ochrony przeciwpożarowej obowiązujące podczas wszelkich zajęć organizowanych przez jednostki organizacyjne Stowarzyszenia.</p>

<p style="margin-top:10px;"><b>§ 2</b></p>
<p>1. Podczas zajęć w szczególności zabrania się:</p>
<ul style="margin:4px 0 8px 22px;">
  <li>rozpalania ognisk w odległości mniejszej niż 100 metrów od ściany lasu, stogów siana itp., z wyjątkiem miejsc wyznaczonych lub wskazanych przez leśniczego/właściciela lasu,</li>
  <li>chodzenia po lesie z otwartym ogniem, poza sytuacjami, gdy uzyskano pozwolenie,</li>
  <li>posługiwania się ogniem (ognisko, kuchnia polowa, świeczki, pochodnie itp.) w namiotach oraz w ich najbliższym otoczeniu, to jest w promieniu 5m od nich,</li>
  <li>instalowania urządzeń elektrycznych oraz dokonywania napraw sieci elektrycznej lub gazowej przez osoby nieuprawnione.</li>
</ul>
<p>2. Podczas zajęć w szczególności należy:</p>
<ul style="margin:4px 0 8px 22px;">
  <li>zachować szczególną ostrożność i rozwagę przy używaniu ognia, stosując ogólne normy przeciwpożarowe, w tym zasady, o których mowa w niniejszej Instrukcji,</li>
  <li>zapoznać z zasadami ochrony przeciwpożarowej uczestników zajęć, w trakcie których używany jest ogień albo przedmioty łatwopalne.</li>
</ul>
<p>3. Podczas stacjonarnych zajęć wielodniowych (biwaków, obozów letnich i zimowych itp.) należy ponadto:</p>
<ul style="margin:4px 0 8px 22px;">
  <li>ustalić i podać do wiadomości uczestników sygnały i sieć alarmową, sposób zawiadamiania straży pożarnej oraz drogę i sposób ewakuacji na wypadek zaistnienia pożaru,</li>
  <li>zorganizować wystarczającą liczbę punktów przeciwpożarowych, zawierających oznakowany sprzęt przeciwpożarowy, uzgodniony z przedstawicielami straży pożarnej właściwej dla danego terenu (np. gaśnice, hydronetki, wiadra, łopaty, beczki z wodą, skrzynie z piaskiem, tłumice, koce gaśnicze itp.),</li>
  <li>zminimalizować zagrożenie pożarowe poprzez wyeliminowanie potencjalnych jego źródeł (np. zabezpieczenie kominów kuchni i pieców przed wylatywaniem z nich iskier).</li>
</ul>

<p style="margin-top:10px;"><b>§ 3</b></p>
<p>1. Przy wyborze miejsca na ognisko, oprócz zasady, o której mowa w § 2 ust. l lit. a) niniejszej Instrukcji, należy brać pod uwagę kierunek wiejącego wiatru oraz inne warunki atmosferyczne, a także zachować szczególną ostrożność, tak by nie doszło do zapalenia sprzętu biwakowego (np. namiotu).</p>
<p>2. Miejsce na ognisko należy oczyścić z chrustu, ściółki, trawy itp., tak aby ogień rozpalać na piasku, a w pobliżu ogniska należy zgromadzić sprzęt do gaszenia ognia.</p>
<p>4. Przed rozpoczęciem ogniska należy wyznaczyć osobę, która będzie stale nad nim czuwała, zwracając uwagę np. na kierunek wznoszenia się iskier, i która zabezpieczy teren po zakończeniu ogniska, to znaczy: ogień zgasi wodą, popiół przysypie ziemią, przywróci terenowi wygląd pierwotny, chyba że jest to stałe miejsce na ognisko.</p>

<p style="margin-top:10px;"><b>§ 4</b></p>
<p>Każdy uczestnik zajęć ma obowiązek natychmiastowego zawiadomienia OOB o zauważonym pożarze lub jego potencjalnym źródle.</p>

<p style="margin-top:10px;"><b>§ 5</b></p>
<p>1. W przypadku powstania pożaru należy: zachować spokój i przeciwdziałać panice, natychmiast przystąpić do gaszenia pożaru przy pomocy sprzętu oraz zawiadomić straż pożarną, zapewnić bezpieczną ewakuację uczestników zajęć, jeżeli nie mogą oni wspierać akcji gaśniczej.</p>
<p>2. Po przybyciu straży pożarnej na miejsce należy podporządkować się poleceniom kierującego akcją gaśniczą i ściśle z nim współpracować.</p>
<p>3. Po zakończeniu akcji sprzęt przeciwpożarowy należy niezwłocznie przygotować do ponownego użycia.</p>

<p style="margin-top:10px;"><b>§ 6</b></p>
<p>Zasady ochrony przeciwpożarowej obozów i innych wielodniowych zajęć stacjonarnych komendant tych zajęć powinien uzgodnić ze strażą pożarną i władzami leśnymi.</p>

<p style="margin-top:10px;"><b>§ 7</b></p>
<p>Jeżeli czas trwania zajęć stacjonarnych przekracza 14 dni, do kompetencji OOB tych zajęć należy przeprowadzenie jednego próbnego alarmu przeciwpożarowego na początku zajęć.</p>

<p style="margin-top:10px;"><b>§ 8</b></p>
<p>1. Niniejsza Instrukcja może być na bieżąco uzupełniana przez instruktora lub inną osobę prowadzącą zajęcia, jeżeli wymaga tego bezpieczeństwo uczestników.</p>
<p>2. Z zasadami wynikającymi z niniejszej Instrukcji należy każdorazowo zapoznać uczestników zajęć przed ich rozpoczęciem, uwzględniając również ewentualne uzupełnienia, o których mowa w ust. l.</p>

<p style="font-weight:bold;text-align:center;font-size:12pt;margin:20px 0 10px;">CZĘŚĆ 2 – INSTRUKCJA POSTĘPOWANIA W RAZIE POŻARU NA BIWAKU/OBOZIE</p>

<p><b>I. ALARMOWANIE</b></p>
<p>1. Kto zauważy pożar, zobowiązany jest niezwłocznie zawiadomić:</p>
<ul style="margin:4px 0 8px 22px;">
  <li>osoby znajdujące się w strefie zagrożenia,</li>
  <li>STRAŻ POŻARNĄ, nr telefonu: 998 (lub lokalną jednostkę straży, nr tel. ........................)</li>
  <li>wędrownika/przewodniczkę pełniącego/ą funkcję komendanta (${f(meta.kierownik, 'imię i nazwisko')}, nr tel. ${f(meta.tel_kierownik, 'nr tel.')})</li>
  <li>wędrownika/przewodniczkę pełniącego/ą funkcję wychowawcy (${f(w1, 'imię i nazwisko')}, nr tel. ${f(t1, 'nr tel.')})</li>
</ul>
<p>2. Po uzyskaniu telefonicznego połączenia ze strażą pożarną należy wyraźnie podać: gdzie się pali: dokładny adres oraz położenie obozu, co się pali: np. namiot, las, czy są zagrożeni ludzie, numer telefonu, z którego się mówi, i swoje nazwisko. <b>UWAGA! Odłożyć słuchawkę dopiero po otrzymaniu odpowiedzi, że straż pożarna przyjęła zgłoszenie. Odczekać chwilę przy telefonie na ewentualne sprawdzenie.</b></p>
<p>3. Należy zachować spokój i nie dopuścić do powstania paniki.</p>
<p>4. W razie potrzeby (nieszczęśliwy wypadek lub awaria) alarmować:</p>
<ul style="margin:4px 0 8px 22px;">
  <li>POGOTOWIE RATUNKOWE: 999</li>
  <li>POLICJĘ: 997</li>
  <li>ZARZĄDCĘ OBIEKTU (nazwa leśnictwa i nr tel. ........................)</li>
</ul>

<p style="margin-top:10px;"><b>II. AKCJA RATOWNICZO-GAŚNICZA</b></p>
<p>1. Równocześnie z alarmowaniem straży pożarnej należy przystąpić do akcji ratowniczo-gaśniczej przy użyciu podręcznego sprzętu gaśniczego.</p>
<p>2. Do czasu przybycia straży pożarnej kierownictwo nad akcją obejmuje komendant, wędrownik/przewodniczka lub osoba do tego przygotowana.</p>
<p>3. Każdy przystępujący do akcji ratowniczo-gaśniczej powinien pamiętać, że:</p>
<ul style="margin:4px 0 8px 22px;">
  <li>w pierwszej kolejności należy zadbać o bezpieczeństwo osób znajdujących się na terenie obozu,</li>
  <li>należy stosować gaśnice śniegowe, proszkowe, halonowe,</li>
  <li>należy usunąć z zasięgu ognia wszystkie materiały palne, a w szczególności butle z gazami sprężonymi, naczynia z płynami łatwopalnymi, cenne maszyny, urządzenia i ważne dokumenty,</li>
  <li>dopływ powietrza sprzyja rozprzestrzenianiu się ognia,</li>
  <li>szybkie i prawidłowe użycie podręcznego sprzętu gaśniczego umożliwia ugaszenie pożaru w zarodku.</li>
</ul>

<p style="margin-top:10px;"><b>III. Zasady Ewakuacji z Miejsca obozu</b></p>
<p>1. W przypadku konieczności przeprowadzenia ewakuacji, kierownictwo nad akcją obejmuje komendant, wędrownik/przewodniczka lub osoba wskazana przez komendanta obozu.</p>
<p>2. Celem ewakuacji jest zapewnienie bezpieczeństwa uczestnikom obozu poprzez umieszczenie ich poza miejscem występowania zagrożenia.</p>
<p>3. Ewakuacja winna przebiegać według następującego schematu: komendant ogłasza ewakuację obozu, uczestnicy niezwłocznie zbierają się na placu apelowym, wychowawca sprawdza stan uczestników, wszyscy, pod kierownictwem komendanta, wychowawcy lub osoby przez komendanta wskazanej, udają się wyznaczoną uprzednio drogą, do ustalonego na początku obozu bezpiecznego miejsca. <b>Pod żadnym pozorem uczestnicy nie mogą oddalać się od ewakuowanej grupy.</b></p>

<p style="margin-top:10px;"><b>IV. UWAGI KOŃCOWE</b></p>
<p>1. Na podstawie ustawy o ochronie przeciwpożarowej (tj. Dz. U. z 2002 r. nr 147, poz. 1229): "Kto zauważy pożar, klęskę żywiołową lub inne miejscowe zagrożenie, obowiązany jest niezwłocznie zawiadomić osoby znajdujące się w strefie zagrożenia oraz jednostkę ochrony przeciwpożarowej bądź policję lub wójta albo sołtysa".</p>
<p>2. Na podstawie Instrukcji Bezpieczeństwa Pożarowego Obiektu: Każdy obozowicz powinien przystąpić do gaszenia pożaru podręcznym sprzętem gaśniczym, pamiętając przede wszystkim o własnym bezpieczeństwie.</p>
<p>3. Instrukcja niniejsza wchodzi w życie z dniem podpisania i obowiązuje wszystkich pracowników.</p>
<p>4. Niniejsza Instrukcja odpowiada wymogom stawianym przez Państwową Straż Pożarną.</p>
<p style="margin-top:14px;">Podpis kierownika placówki: ..............................................</p>

<p style="font-weight:bold;text-align:center;font-size:12pt;margin:20px 0 10px;">CZĘŚĆ 3 – INSTRUKCJA BEZPIECZEŃSTWA POŻAROWEGO NA BIWAKU/OBOZIE</p>

<p><b>I. PRZEPISY WSTĘPNE</b></p>
<p>Podstawa wydania Instrukcji: Ustawa o ochronie przeciwpożarowej (tj. Dz. U. z 2002 r. nr 147, poz. 1229); Rozporządzenie Ministra Infrastruktury z dnia 12.04.2002 r. w sprawie warunków technicznych, jakim powinny odpowiadać budynki i ich usytuowanie (Dz. U. z 2002 r. nr 75, poz. 690 z późn. zmianami); Zakładowy Regulamin Ochrony Przeciwpożarowej.</p>
<p>Postanowienia niniejszej Instrukcji obowiązują wszystkich obozowiczów bez wyjątku, w czasie ich przebywania na terenie obozu. Osoby winne nieprzestrzegania postanowień zawartych w Instrukcji oraz ogólnych przepisów o ochronie przeciwpożarowej, pociągnięte będą do odpowiedzialności karnej lub służbowej, w myśl obowiązujących przepisów.</p>

<p style="margin-top:10px;"><b>II. PRZEPISY PORZĄDKOWE</b></p>
<p>1. Na terenie obozu oraz na terenach przyległych do niego zabronione jest wykonywanie czynności, które mogą spowodować pożar, jego rozprzestrzenienie się, utrudnienie prowadzenia działania ratowniczego lub ewakuacji, a w szczególności:</p>
<ul style="margin:4px 0 8px 22px;">
  <li>używanie otwartego ognia poza miejscami wyznaczonymi do tego celu przez właściciela lub zarządcę lasu;</li>
  <li>przechowywanie lub składowanie materiałów palnych w odległości mniejszej niż 0,5 m od: miejsc przeznaczonych do palenia ognisk, kuchni polowych;</li>
  <li>używanie lamp naftowych oraz pochodni niezgodnie z ich przeznaczeniem;</li>
  <li>pozostawianie zapalonych lamp naftowych oraz pochodni w pobliżu materiałów łatwopalnych np. butelki z naftą, odzieży itd.;</li>
  <li>samowolne napełnianie lamp naftowych;</li>
  <li>pozostawianie po zakończeniu pracy narzędzi nie oczyszczonych ze smarów palnych oraz podobnych substancji łatwopalnych;</li>
  <li>przechowywanie odzieży w miejscach nie przeznaczonych do tego celu.</li>
</ul>
<p>2. Przy używaniu lub przechowywaniu materiałów należy przestrzegać następujących zasad:</p>
<ul style="margin:4px 0 8px 22px;">
  <li>wszystkie czynności związane z wytwarzaniem, przetwarzaniem, obróbką, transportem lub składowaniem materiałów, należy wykonywać zgodnie z warunkami ochrony przeciwpożarowej, określonymi w instrukcji technologicznej, lub według wskazań ich producenta;</li>
  <li>zapas materiałów, przekraczający wielkością dzienne zapotrzebowanie, należy przechowywać w oddzielnym namiocie przystosowanym do takiego celu;</li>
  <li>materiały powinny być przechowywane w sposób uniemożliwiający powstanie pożaru lub wybuchu w następstwie procesu składowania lub wskutek wzajemnego oddziaływania;</li>
  <li>ciecze palne, jak np. benzyna, nafta, spirytus, eter itp., należy przechowywać wyłącznie w pojemnikach wykonanych z materiałów co najmniej trudno zapalnych, odprowadzających ładunki elektryczności statycznej, wyposażonych w szczelne zamknięcia: w namiotach i na terenie obozu pojemniki z cieczami powinny być dodatkowo zabezpieczone przed stłuczeniem;</li>
</ul>
<p>3. Wszelkie zauważone lub stwierdzone nieprawidłowości i usterki w zakresie bezpieczeństwa pożarowego w obozie należy natychmiast zgłosić komendantowi obozu.</p>
<p>4. Po zakończeniu dziennych zajęć należy dokładnie sprawdzić czy wszystkie piece, ogniska, lampy oraz inne przedmioty, stanowiące zagrożenie pożarowe, zostały zgaszone.</p>
<p>5. Wartownicy pełniący straż nocną używają jako oświetlenia wyłącznie latarek; zabrania się zapalania lamp naftowych, ognisk, pieców polowych itp.</p>
<p>6. Na terenie obozu obowiązuje całkowity zakaz palenia tytoniu.</p>

<p style="margin-top:10px;"><b>III. SPRZĘT GAŚNICZY</b></p>
<p>1. Każdy obozowicz obowiązany jest:</p>
<ul style="margin:4px 0 8px 22px;">
  <li>znać rodzaje oraz sposób użycia podręcznego sprzętu gaśniczego,</li>
  <li>znać miejsca rozmieszczenia sprzętu gaśniczego i innych środków gaśniczych znajdujących się na terenie obozu lub w bezpośrednim sąsiedztwie.</li>
</ul>

<p style="margin-top:10px;"><b>IV. POSTĘPOWANIE W PRZYPADKU POWSTANIA POŻARU</b></p>
<p>1. Każdy obozowicz, z chwilą zauważenia pożaru, obowiązany jest:</p>
<ul style="margin:4px 0 8px 22px;">
  <li>zaalarmować harcerzy w najbliższym otoczeniu pożaru, członków komendy, komendanta obozu,</li>
  <li>powiadomić STRAŻ POŻARNĄ, nr tel.: 998,</li>
  <li>przystąpić do akcji gaśniczej i ratowniczej, z zachowaniem szczególnej ostrożności i pamiętając o własnym bezpieczeństwie.</li>
</ul>
<p>2. Wszyscy harcerze, w czasie prowadzenia akcji ratowniczo-gaśniczej, winni bezwzględnie podporządkować się rozkazom prowadzącego akcję - komendanta obozu, a z chwilą przybycia Straży Pożarnej - dowódcy przybyłej jednostki straży.</p>

<div style="margin-top:36px;display:flex;justify-content:space-between;align-items:flex-end;">
  <div style="font-size:10pt;">miejscowość , data</div>
  <div style="text-align:center;">podpis kierownika obiektu<br/><div style="border-top:1px solid #333;width:200px;padding-top:4px;margin-top:20px;">............................</div></div>
</div>
` + DOC_FOOTER
}

function generatePlaceholderHtml(icon, label) {
  return DOC_HEADER + `
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:480px;text-align:center;color:#9ca3af;">
  <div style="font-size:64px;margin-bottom:16px;">${icon}</div>
  <div style="font-size:16pt;font-weight:bold;color:#6b7280;margin-bottom:8px;">${label}</div>
  <div style="font-size:11pt;max-width:340px;">
    Ta sekcja zostanie uzupełniona później.<br/>
    Możesz dodać własny PDF — poeksportuj go jako obrazek i zaimportuj w edytorze.
  </div>
</div>
` + DOC_FOOTER
}

// ── PaginatedEditor ──────────────────────────────────────────────────────────

const PAGE_W = '210mm'
const PAGE_H = '297mm'
const PAGE_PX = 16

function PaginatedEditor({ initialHtml, activeTab, meta, attachments }) {
  const pagesRef = useRef([])
  const [pageCount, setPageCount] = useState(1)
  const reflowing = useRef(false)
  const reflowTimer = useRef(null)
  const initDone = useRef(false)

  const measurePageHPx = useCallback(() => Math.round(247 * 3.779527559), [])

  useEffect(() => {
    const pp = pagesRef.current.filter(Boolean)
    if (pp.length === 0) return
    pp[0].innerHTML = initialHtml || '<p><br></p>'
    initDone.current = true
  }, [initialHtml])

  const reflow = useCallback(() => {
    if (!initDone.current || reflowing.current) return
    reflowing.current = true

    const temp = document.createElement('div')
    temp.style.cssText = 'width:170mm;padding:0;position:absolute;visibility:hidden;box-sizing:border-box;font-family:"Segoe UI",Arial,sans-serif;font-size:10.5pt;line-height:1.55;color:#111;word-wrap:break-word;'
    document.body.appendChild(temp)

    const pp = pagesRef.current.filter(Boolean)
    const allNodes = []
    pp.forEach(el => {
      while (el.firstChild) {
        allNodes.push(el.firstChild)
        el.removeChild(el.firstChild)
      }
    })

    const pageHPx = pp.length > 0 && pp[0].clientHeight > 200
      ? pp[0].clientHeight
      : measurePageHPx()
    const pages = []
    let i = 0
    while (i < allNodes.length) {
      temp.innerHTML = ''
      const pageNodes = []
      while (i < allNodes.length) {
        const node = allNodes[i]
        temp.appendChild(node)
        if (Math.round(temp.scrollHeight) > pageHPx && pageNodes.length > 0) {
          temp.removeChild(node)
          break
        }
        pageNodes.push(node)
        i++
      }
      pages.push(pageNodes)
    }

    if (pages.length === 0) pages.push([])

    const needed = pages.length
    if (needed !== pageCount) setPageCount(needed)

    setTimeout(() => {
      const newPp = pagesRef.current.filter(Boolean)
      pages.forEach((nodes, pi) => {
        if (newPp[pi]) {
          newPp[pi].innerHTML = ''
          nodes.forEach(n => newPp[pi].appendChild(n))
        }
      })
      for (let pi = pages.length; pi < newPp.length; pi++) {
        newPp[pi].innerHTML = '<p><br></p>'
      }
      reflowing.current = false
    }, 0)

    temp.remove()
  }, [pageCount])

  useEffect(() => {
    const timer = setTimeout(() => reflow(), 150)
    return () => clearTimeout(timer)
  }, [initialHtml])

  const handlePageNav = useCallback((e, pageIdx) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    const el = e.currentTarget
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0).cloneRange()
    const rect = range.getClientRects()[0]
    if (!rect) return

    if (e.key === 'ArrowUp') {
      if (rect.top <= el.getBoundingClientRect().top + 10) {
        if (pageIdx > 0) {
          e.preventDefault()
          const prev = pagesRef.current[pageIdx - 1]
          if (prev) {
            prev.focus()
            requestAnimationFrame(() => {
              const r = document.createRange()
              r.selectNodeContents(prev)
              r.collapse(false)
              const s = window.getSelection()
              s.removeAllRanges()
              s.addRange(r)
            })
          }
        }
      }
      return
    }
    if (e.key === 'ArrowDown') {
      if (pageIdx >= pageCount - 1) return
      const oldY = rect.top
      window.__navCheck = () => {
        delete window.__navCheck
        const s2 = window.getSelection()
        if (!s2 || !s2.rangeCount) return
        const r2 = s2.getRangeAt(0).getClientRects()[0]
        if (!r2) return
        if (Math.abs(r2.top - oldY) < 2) {
          const next = pagesRef.current[pageIdx + 1]
          if (next) {
            next.focus()
            const nr = document.createRange()
            const fc = next.firstChild
            if (fc && fc.firstChild) { nr.setStart(fc.firstChild, 0) }
            else if (fc) { nr.setStart(fc, 0) }
            else { nr.selectNodeContents(next) }
            nr.collapse(true)
            const s3 = window.getSelection()
            s3.removeAllRanges()
            s3.addRange(nr)
          }
        }
      }
      setTimeout(() => { if (window.__navCheck) window.__navCheck() }, 20)
      return
    }
  }, [pageCount])

  const handleInput = useCallback(() => {
    if (reflowing.current) return
    clearTimeout(reflowTimer.current)
    reflowTimer.current = setTimeout(() => reflow(), 1200)
  }, [reflow])

  const isEditable = activeTab === 'main'
    || (attachments || []).find(a => a.id === activeTab)?.type === 'participants'
    || (attachments || []).find(a => a.id === activeTab)?.type === 'placeholder'

  return (
    <div className="campas-print-area flex flex-col items-center py-6" style={{ gap: `${PAGE_PX}px` }}>
      {Array.from({ length: pageCount }, (_, i) => (
        <div
          key={i}
          className="campas-print-page bg-white shadow-lg shrink-0 flex flex-col"
          style={{
            width: PAGE_W,
            height: PAGE_H,
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <img src="/naglowek.jpg?v=2" alt=""
            className="shrink-0"
            style={{ width: 'calc(100% - 10mm)', height: 'auto', objectFit: 'contain', display: 'block', margin: '5mm 5mm 0 5mm' }}
            onError={e => { e.currentTarget.style.display = 'none' }} />
          <div
            ref={el => { pagesRef.current[i] = el }}
            data-editor-page
            data-page={i}
            contentEditable={isEditable}
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={(e) => handlePageNav(e, i)}
            className="outline-none"
            style={{
              width: '100%',
              flex: 1,
              minHeight: 0,
              padding: '0 20mm',
              boxSizing: 'border-box',
              overflow: 'hidden',
              fontFamily: "'Segoe UI', Arial, sans-serif",
              fontSize: '10.5pt',
              lineHeight: '1.55',
              color: '#111',
            }}
          />
          <img src="/stopka.jpg?v=2" alt=""
            className="shrink-0"
            style={{ width: 'calc(100% - 10mm)', height: 'auto', objectFit: 'contain', display: 'block', margin: '0 5mm 5mm 5mm' }}
            onError={e => { e.currentTarget.style.display = 'none' }} />
        </div>
      ))}
    </div>
  )
}

// ── Główny komponent ──────────────────────────────────────────────────────────

export default function DocumentEditor({ templateHtml, meta, docLabel, onClose, onSave, recipients, multiRecipient, attachments }) {
  const editorRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState(() =>
    recipients ? recipients[0]?.id : null
  )
  const [choices, setChoices] = useState(() => parseChoices(templateHtml || ''))
  const [activeTab, setActiveTab] = useState('main')

  const currentRecipient = recipients?.find(r => r.id === selectedRecipient)

  const recipientName = (() => {
    if (!currentRecipient) return '<p style="color:#999;">Wybierz odbiorcę powyżej</p>'
    const gpsMap = { psp: meta.psp, policja: meta.policja, szpital: meta.szpital, wojt: meta.gmina, nadlesnictwo: meta.nadlesnictwo }
    const addr = gpsMap[currentRecipient.id] || currentRecipient.addr || ''
    return `<p style="font-weight:bold;margin-bottom:2px;">${currentRecipient.label}</p><p style="margin-bottom:8px;">${addr}</p>`
  })()

  const processedHtml = useMemo(() => {
    if (!templateHtml) return ''
    const wychowawcy = (meta.wychowawcy || []).filter(w => w.name)
    const today = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })

    const replacements = {
      data_dzis: today,
      jednostka: meta.jednostka || '.....................',
      kierownik: meta.kierownik || '.....................',
      tel_kierownik: meta.tel_kierownik || '.....................',
      miejsce: meta.miejsce || '.....................',
      termin: (meta.date_start && meta.date_end)
        ? `${meta.date_start} – ${meta.date_end}`
        : (meta.termin || '.....................'),
      date_start: meta.date_start || '.....................',
      date_end: meta.date_end || '.....................',
      uczestnicy: meta.uczestnicy || '...',
      wiek: meta.wiek || '.....................',
      email: meta.email || '.....................',
      liczba_kadry: meta.liczba_kadry || '...',
      gmina: meta.gmina || '.....................',
      powiat: meta.powiat || '.....................',
      wojewodztwo: meta.wojewodztwo || '.....................',
      nadlesnictwo: meta.nadlesnictwo || '.....................',
      lesnictwo: meta.lesnictwo || '.....................',
      oddzial_lesny: meta.oddzial_lesny || '...',
      nr_dzialki: meta.nr_dzialki || '.....................',
      policja: meta.policja || '.....................',
      psp: meta.psp || '.....................',
      szpital: meta.szpital || '.....................',
      przychodnia: meta.przychodnia || '.....................',
      tel_przychodnia: meta.tel_przychodnia || '.....................',
      hufiec: meta.hufiec || '.....................',
      bezp_miejscowosc: meta.bezp_miejscowosc || '.....................',
      bezp_budynek: meta.bezp_budynek || '.....................',
      bezp_adres: meta.bezp_adres || '.....................',
      schronienie: meta.schronienie || '.....................',
      recipient_name: recipientName,
      kontakt1: wychowawcy[0]?.name || '.................................',
      tel_kontakt1: wychowawcy[0]?.phone || '.........................',
      kontakt2: wychowawcy[1]?.name || '.................................',
      tel_kontakt2: wychowawcy[1]?.phone || '.........................',
    }

    let html = templateHtml

    for (const [key, val] of Object.entries(replacements)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      html = html.replace(regex,
        `<span style="background:#e0f2fe;padding:1px 4px;border-radius:3px;color:#0369a1;" data-var="${key}">${val}</span>`)
    }

    html = html.replace(/\{\{CHOICE:([^:}]+):([^}]+)\}\}/g, (_, id, opts) => {
      const options = opts.split('|')
      const selectedIdx = choices[id]?.selected ?? 0
      const selectedVal = options[selectedIdx] || options[0]
      const optionsHtml = options.map((o, i) =>
        `<option value="${i}"${i === selectedIdx ? ' selected' : ''}>${o}</option>`
      ).join('')
      return `<select contenteditable="false" data-choice="${id}"
        style="background:#fef3c7;border:1px solid #f59e0b;border-radius:4px;color:#92400e;
               padding:2px 6px;font-size:inherit;font-family:inherit;cursor:pointer;
               font-weight:bold;" onchange="window.__docChoice && window.__docChoice(this)">${optionsHtml}</select>`
    })

    return html
  }, [templateHtml, meta, recipientName, choices])

  const currentContent = useMemo(() => {
    if (activeTab === 'main') {
      return DOC_HEADER + processedHtml + DOC_FOOTER
    }
    const att = (attachments || []).find(a => a.id === activeTab)
    if (!att) return ''
    switch (att.type) {
      case 'contacts':     return generateContactsHtml(meta)
      case 'participants': return generateParticipantsHtml(meta)
      case 'regulamin':    return generateRegulaminHtml(meta)
      case 'ppoz':         return generatePpozHtml(meta)
      default:             return generatePlaceholderHtml(att.icon || '📄', att.label)
    }
  }, [activeTab, processedHtml, meta, attachments])

  useEffect(() => {
    window.__docChoice = (sel) => {
      const id = sel.getAttribute('data-choice')
      const idx = parseInt(sel.value)
      setChoices(prev => ({ ...prev, [id]: { ...prev[id], selected: idx } }))
    }
    return () => { delete window.__docChoice }
  }, [])

  const activeLabel = activeTab === 'main'
    ? docLabel
    : ((attachments || []).find(a => a.id === activeTab)?.label || docLabel)

  const handleExport = () => {
    const allPages = document.querySelectorAll('.campas-print-page')
    const visiblePages = []
    allPages.forEach(p => {
      const ed = p.querySelector('[data-editor-page]')
      const html = ed?.innerHTML || ''
      const empty = !html || html === '<p><br></p>' || html === '<br>' || !html.replace(/<[^>]*>/g, '').replace(/\s/g, '').trim()
      if (!empty) visiblePages.push(p.cloneNode(true))
    })
    if (visiblePages.length === 0) return

    const wrapper = document.createElement('div')
    wrapper.id = 'campas-print-clone'
    wrapper.style.cssText = 'position:absolute;top:0;left:0;width:210mm;background:white;z-index:99999;'

    visiblePages.forEach((p, i) => {
      p.style.cssText = `width:210mm;height:297mm;${i < visiblePages.length - 1 ? 'page-break-after:always;' : ''}box-shadow:none;margin:0;padding:0;background:white;overflow:hidden;position:relative;`
      const imgs = p.querySelectorAll('img')
      if (imgs[0]) imgs[0].style.cssText = 'position:absolute;top:5mm;left:5mm;right:5mm;height:auto;width:calc(100%-10mm);object-fit:contain;display:block;z-index:1;'
      if (imgs[1]) imgs[1].style.cssText = 'position:absolute;bottom:5mm;left:5mm;right:5mm;height:auto;width:calc(100%-10mm);object-fit:contain;display:block;z-index:1;'
      const ed = p.querySelector('[data-editor-page]')
      if (ed) {
        ed.querySelectorAll('select').forEach(sel => {
          const txt = sel.options[sel.selectedIndex]?.text || ''
          const span = document.createElement('span')
          span.textContent = txt
          sel.replaceWith(span)
        })
        ed.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;padding:30mm 20mm 20mm 20mm;box-sizing:border-box;overflow:hidden;font-family:"Segoe UI",Arial,sans-serif;font-size:10.5pt;line-height:1.55;color:#111;background:white;z-index:0;'
      }
      wrapper.appendChild(p)
    })

    const style = document.createElement('style')
    style.id = 'campas-print-style'
    style.textContent = `
      @media print {
        @page { size: A4; margin: 0; }
        body > *:not(#campas-print-clone) { display: none !important; }
        #campas-print-clone { display: block !important; position: static !important; background: white !important; }
        span[data-var] { background: transparent !important; color: inherit !important; }
        select { appearance: none; border: none !important; background: transparent !important; }
      }
    `
    document.head.appendChild(style)
    document.body.appendChild(wrapper)
    const origTitle = document.title
    const filename = (activeLabel || 'dokument').replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ _-]/g, '')
    document.title = filename
    const titleEl = document.querySelector('title')
    if (titleEl) titleEl.textContent = filename
    window.print()
    wrapper.style.display = 'none'
    document.title = origTitle
    if (titleEl) titleEl.textContent = origTitle
    setTimeout(() => {
      wrapper.remove()
      const s = document.getElementById('campas-print-style')
      if (s) s.remove()
    }, 1000)
  }

  const tabItems = [
    { id: 'main', label: docLabel || 'Pismo',   icon: '📄' },
    ...(attachments || []).map(a => ({ id: a.id, label: a.label, icon: a.icon || '📎' })),
  ]

  const isAttachment = activeTab !== 'main'
  const currentAtt = isAttachment ? (attachments || []).find(a => a.id === activeTab) : null

  return (
    <div className="fixed inset-0 z-[3000] flex bg-gray-900/60 backdrop-blur-sm">
      {/* ── Lewy sidebar ── */}
      <div className="w-52 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-100">
          <button onClick={onClose}
            className="w-full text-left text-xs text-gray-500 hover:text-red-600 flex items-center gap-1">
            <span className="text-lg leading-none">←</span> Zamknij
          </button>
        </div>
        <div className="p-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1 mt-1">Dokument</p>
          {tabItems.map(tab => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition mb-0.5 ${
                activeTab === tab.id
                  ? 'bg-green-100 text-green-800 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <span className="text-base">{tab.icon}</span>
              <span className="truncate text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
        {isAttachment && currentAtt && (
          <div className="mt-auto p-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {currentAtt.type === 'contacts'
                ? 'Auto-wypełniane z Danych Obozu'
                : currentAtt.type === 'participants'
                ? 'Kliknij w tabelę aby edytować'
                : 'Do uzupełnienia później'}
            </p>
          </div>
        )}
      </div>

      {/* ── Główny obszar ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 shrink-0 z-10">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-gray-800 text-sm truncate max-w-xs">{activeLabel}</h2>
              <span className="text-xs text-gray-400 hidden sm:block">
                {activeTab === 'main' ? 'Kliknij tekst aby edytować · 🟡 pola wyboru · 🔵 dane auto' : 'Załącznik'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExport} disabled={saving}
                className="text-xs bg-green-700 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-green-800 transition">
                🖨️ Drukuj / Zapisz PDF
              </button>
            </div>
          </div>

          {multiRecipient && recipients && activeTab === 'main' && (
            <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 mr-1">Odbiorca:</span>
              {recipients.map(r => (
                <button key={r.id}
                  onClick={() => setSelectedRecipient(r.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition ${
                    selectedRecipient === r.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400'
                  }`}>
                  {selectedRecipient === r.id ? '● ' : '○ '}{r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto" style={{ background: '#6b7280' }}>
          <PaginatedEditor
            initialHtml={currentContent}
            activeTab={activeTab}
            meta={meta}
            attachments={attachments}
          />
        </div>
      </div>
    </div>
  )
}
