// Szablony dokumentów Skautów Europy — wersje wysokiej jakości (z PDF)
// {{variable}} = auto-fill z meta
// {{CHOICE:id:opcja1|opcja2}} = klikalne pole wyboru (żółte)

const SENDER = `
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;font-size:10pt;">
  <div>
    <div style="font-weight:bold;">Skauci Europy</div>
    <div>Stowarzyszenie Harcerstwa Katolickiego „Zawisza"</div>
    <div>Federacja Skautingu Europejskiego</div>
    <div style="margin-top:6px;"><b>Hufiec:</b> {{hufiec}}</div>
    <div style="margin-top:8px;"><b>Kierownik wypoczynku:</b></div>
    <div>Imię i nazwisko: {{kierownik}}</div>
    <div>E-mail: {{email}}</div>
    <div>Telefon: {{tel_kierownik}}</div>
  </div>
  <div style="text-align:right;white-space:nowrap;">{{miejsce}}, dnia {{data_dzis}}</div>
</div>`

export const DOC_TEMPLATES = {

  zawiadomienie: {
    label: 'Zawiadomienie o obozie',
    icon: '📨',
    multiRecipient: true,
    recipients: [
      { id: 'policja',      label: 'Policja',              addr: 'Komenda Powiatowa Policji w {{powiat}}' },
      { id: 'psp',          label: 'Straż Pożarna (PSP)',  addr: 'Komenda Powiatowa PSP w {{powiat}}\n{{psp}}' },
      { id: 'szpital',      label: 'Szpital/Przychodnia',  addr: '{{szpital}}' },
      { id: 'wojt',         label: 'Wójt/Sołtys',         addr: 'Wójt Gminy {{gmina}}' },
      { id: 'nadlesnictwo', label: 'Nadleśnictwo',         addr: 'Nadleśnictwo {{nadlesnictwo}}' },
    ],
    html: `${SENDER}
<div style="margin-bottom:18px;">{{recipient_name}}</div>

<p style="font-weight:bold;text-align:center;font-size:12pt;margin:18px 0 14px;">Zawiadomienie o organizacji obozu harcerskiego</p>

<p>Szanowni Państwo,</p>
<p>zgodnie z „Protokołem Uzgodnień w zakresie bezpieczeństwa na obozach harcerskich pod namiotami" z dnia 19 czerwca 2019 r. uprzejmie informuję, że w terminie od <b>{{date_start}}</b> do <b>{{date_end}}</b> na terenie Nadleśnictwa <b>{{nadlesnictwo}}</b>, w obrębie leśnictwa <b>{{lesnictwo}}</b> (oddział leśny nr <b>{{oddzial_lesny}}</b>), odbędzie się obóz harcerski <b>{{jednostka}}</b>.</p>
<p>Organizatorem obozu jest <b>{{hufiec}}</b> działający w ramach Stowarzyszenia Harcerstwa Katolickiego „Zawisza" – Federacji Skautingu Europejskiego (Skauci Europy), reprezentowany przez kierownika wypoczynku <b>{{kierownik}}</b> (<b>{{tel_kierownik}}</b>). W obozie weźmie udział około <b>{{uczestnicy}}</b> uczestników w wieku <b>{{wiek}}</b> lat oraz <b>{{liczba_kadry}}</b> osób kadry wychowawczej. Uczestnikami będą {{CHOICE:plec:dziewczęta|chłopcy}} należący do {{CHOICE:galaz:gromad|drużyn}} Skautów Europy wraz z pełnoletnimi opiekunami.</p>
<p>Osoby wyznaczone do kontaktu ze służbami:</p>
<ul style="margin:6px 0 6px 22px;">
  <li>Kierownik: <b>{{kierownik}}</b>, tel. <b>{{tel_kierownik}}</b></li>
  <li>Wychowawca: <b>{{kontakt1}}</b>, tel. <b>{{tel_kontakt1}}</b></li>
  <li>Wychowawca: <b>{{kontakt2}}</b>, tel. <b>{{tel_kontakt2}}</b></li>
</ul>
<p>Uczestnicy oraz kadra zostaną zapoznani z zasadami bezpieczeństwa. Mapa terenu obozu w załączeniu.</p>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis kierownika</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Pieczęć i podpis hufcowego</div></div>
</div>`,
  },

  przewodnie: {
    label: 'Pismo przewodnie (PSP)',
    icon: '🔥',
    attachments: [
      { id: 'kontakty',   label: 'Środki łączności',   icon: '📞', type: 'contacts' },
      { id: 'uczestnicy', label: 'Lista uczestników',   icon: '👥', type: 'participants' },
      { id: 'regulamin',  label: 'Regulamin obozu',     icon: '📋', type: 'regulamin' },
      { id: 'ppoz',       label: 'Instrukcja ppoż.',    icon: '🔥', type: 'ppoz' },
    ],
    html: `${SENDER}
<div style="margin-bottom:18px;">
  <p>Komenda {{CHOICE:psp_typ:Powiatowej|Miejskiej}} Straży Pożarnej</p>
  <p>w <b>{{powiat}}</b></p>
  <p>{{psp}}</p>
</div>
<p style="font-weight:bold;text-align:center;font-size:12pt;margin:18px 0 14px;">Wniosek o wydanie opinii w zakresie bezpieczeństwa przeciwpożarowego</p>
<p>Szanowni Państwo,</p>
<p>zwracam się z uprzejmą prośbą o wydanie opinii w zakresie bezpieczeństwa przeciwpożarowego dotyczącej organizacji obozu harcerskiego <b>{{jednostka}}</b>, planowanego w terminie od <b>{{date_start}}</b> do <b>{{date_end}}</b> na terenie Nadleśnictwa <b>{{nadlesnictwo}}</b>, w obrębie leśnictwa <b>{{lesnictwo}}</b> (oddział leśny nr <b>{{oddzial_lesny}}</b>).</p>
<p>Organizatorem obozu jest <b>{{hufiec}}</b>, działający w ramach Stowarzyszenia Harcerstwa Katolickiego „Zawisza" – Federacji Skautingu Europejskiego (Skauci Europy), reprezentowany przez kierownika wypoczynku <b>{{kierownik}}</b> (<b>{{tel_kierownik}}</b>). W obozie weźmie udział około <b>{{uczestnicy}}</b> uczestników w wieku <b>{{wiek}}</b> lat oraz <b>{{liczba_kadry}}</b> osób kadry wychowawczej. Uczestnikami będą {{CHOICE:plec:dziewczęta|chłopcy}} należący do {{CHOICE:galaz:gromad|drużyn}} Skautów Europy wraz z pełnoletnimi opiekunami.</p>
<p>Uczestnicy i kadra zostaną zapoznani z zasadami bezpieczeństwa p.poż. Osoby do kontaktu ze służbami:</p>
<ul style="margin:6px 0 6px 22px;">
  <li><b>{{kontakt1}}</b>, tel. <b>{{tel_kontakt1}}</b></li>
  <li><b>{{kontakt2}}</b>, tel. <b>{{tel_kontakt2}}</b></li>
</ul>
<p>W załączeniu przesyłam:</p>
<ul style="margin:6px 0 6px 22px;">
  <li>Środki łączności (📑OK.3.3)</li>
  <li>Lista uczestników (📑UC.3)</li>
  <li>Szkic zagospodarowania terenu (📑TR.4)</li>
  <li>Mapki ewakuacyjne (📑EW.2)</li>
  <li>Regulamin obozu (📑RG.1.1)</li>
  <li>Instrukcja ppoż. i ewakuacji (📑RG.2.1)</li>
</ul>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis kierownika</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Pieczęć i podpis hufcowego</div></div>
</div>`,
  },

  wojt: {
    label: 'Pismo do Wójta',
    icon: '🏛️',
    html: `<div style="text-align:right;margin-bottom:18px;font-size:10pt;color:#555;">
  {{miejsce}}, dnia {{data_dzis}}
</div>

<table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
  <tr style="vertical-align:top;">
    <td style="width:48%;padding-right:12px;border-right:1px solid #ccc;">
      <p style="font-weight:bold;font-size:11pt;margin:0 0 4px;">Skauci Europy</p>
      <p style="margin:0 0 4px;font-size:10pt;">Stowarzyszenie Harcerstwa Katolickiego „Zawisza"<br/>Federacja Skautingu Europejskiego</p>
      <p style="margin:8px 0 0;"><b>Hufiec:</b> {{hufiec}}</p>
      <p style="margin:6px 0 0;"><b>Kierownik wypoczynku:</b></p>
      <p style="margin:2px 0;">Imię i nazwisko: {{kierownik}}<br/>E-mail: {{email}}<br/>Telefon: {{tel_kierownik}}</p>
    </td>
    <td style="width:4%;">&nbsp;</td>
    <td style="width:48%;padding-left:12px;">
      <p style="margin:0 0 4px;"><b>Sz. P.</b> .........................................</p>
      <p style="margin:2px 0;font-style:italic;font-size:9pt;">Imię i nazwisko</p>
      <p style="margin:8px 0 0;"><b>Wójt</b> {{gmina}}</p>
      <p style="margin:2px 0;font-style:italic;font-size:9pt;">Nazwa gminy</p>
    </td>
  </tr>
</table>

<p style="font-weight:bold;text-align:center;font-size:12pt;margin:18px 0 14px;">Wniosek o wyrażenie zgody na użytkowanie latryn oraz dołów chłonnych</p>

<p style="text-align:justify;margin-bottom:6pt;font-size:12pt;">Szanowny Panie,</p>

<p style="text-align:justify;margin-bottom:6pt;font-size:12pt;">w związku z planowaną organizacją obozu harcerskiego na terenie Gminy <b>{{gmina}}</b>, w obrębie Nadleśnictwa <b>{{nadlesnictwo}}</b> (oddział leśny nr <b>{{oddzial_lesny}}</b>), zwracam się z uprzejmą prośbą o wyrażenie pisemnej zgody na wykopanie i użytkowanie latryn naturalnych oraz dołów chłonnych na czas trwania wypoczynku, tj. od <b>{{date_start}}</b> do <b>{{date_end}}</b>.</p>

<p style="text-align:justify;margin-bottom:6pt;font-size:12pt;">Organizatorem obozu jest <b>{{hufiec}}</b>, działający w ramach Stowarzyszenia Harcerstwa Katolickiego „Zawisza" – Federacji Skautingu Europejskiego (Skauci Europy), reprezentowany przez kierownika wypoczynku <b>{{kierownik}}</b> (<b>{{tel_kierownik}}</b>). W obozie weźmie udział około <b>{{uczestnicy}}</b> uczestników w wieku <b>{{wiek}}</b> lat oraz <b>{{liczba_kadry}}</b> osób kadry wychowawczej. Uczestnikami będą {{CHOICE:plec:dziewczęta|chłopcy}} należący do {{CHOICE:galaz:gromad|drużyn}} Skautów Europy wraz z pełnoletnimi opiekunami.</p>

<p style="text-align:justify;margin-bottom:6pt;font-size:12pt;">Obóz organizowany jest za zgodą Nadleśnictwa <b>{{nadlesnictwo}}</b>, na podstawie zawartej umowy. Wydarzenie zostanie zgłoszone do właściwego Kuratorium Oświaty oraz zorganizowane z zachowaniem obowiązujących przepisów przeciwpożarowych i sanitarnych.</p>

<p style="text-align:justify;margin-bottom:6pt;font-size:12pt;">Obóz prowadzony będzie w oparciu o klasyczny system zastępowy (odmienny od modelu funkcjonującego w innych organizacjach harcerskich). Podstawową jednostką wychowawczą jest kilkuosobowy zastęp stanowiący stałą, autonomiczną wspólnotę. Każdy zastęp samodzielnie przygotowuje posiłki, odpowiada za porządek oraz buduje własną infrastrukturę obozową.</p>

<p style="text-align:justify;margin-bottom:6pt;font-size:12pt;">W pierwszych 3-5 dniach obozu uczestnicy wznoszą w ramach pionierki swoje konstrukcje obejmujące platformy namiotowe z wyplatanymi pryczami, stoły (jadalny i kuchenny), punkt do mycia rąk, zmywalnię, półki na sprzęt oraz bramę wejściową. Konstrukcje wykonywane są wyłącznie z żerdzi i sznurka, bez użycia gwoździ, z zastosowaniem tradycyjnych wiązań oraz połączeń kołkowych.</p>

<p style="text-align:justify;margin-bottom:6pt;font-size:12pt;">Powołując się na aktualną „Instrukcję w sprawie wymagań higieniczno-sanitarnych dla stacjonarnych obozów pod namiotami" Głównego Inspektoratu Sanitarnego oraz w związku z pozytywnym rozpatrzeniem tożsamego wniosku skierowanego do Nadleśnictwa, jako właściciela terenu, zwracam się również do Państwa z prośbą o wyrażenie zgody na:</p>

<ul style="margin:0 0 6pt 30pt;font-size:12pt;">
  <li style="margin-bottom:3pt;">wykopanie dołów chłonnych na wodę pochodzącą z czynności higienicznych, zgodnie z § 32 ust. 2 ww. Instrukcji.</li>
  <li style="margin-bottom:3pt;">wykopanie i użytkowanie latryn naturalnych, zgodnie z § 27 ust. 1, 6 i 7 ww. Instrukcji.</li>
</ul>

<p style="text-align:justify;margin-bottom:6pt;font-size:12pt;">Rozwiązania te zostaną wykonane i zabezpieczone zgodnie z obowiązującymi przepisami. Stosowane będą wyłącznie środki biodegradowalne, a latryny będą regularnie odkażane preparatami zawierającymi kultury bakterii.</p>

<p style="text-align:justify;margin-bottom:6pt;font-size:12pt;">Jednocześnie uprzejmie proszę o informację dotyczącą zasad postępowania z odpadami komunalnymi na terenie Gminy oraz wskazanie podmiotu odpowiedzialnego za odbiór odpadów. Odpady nieorganiczne będą gromadzone selektywnie i przekazywane do odbioru w ramach zawartej umowy na wywóz śmieci.</p>

<p style="text-align:justify;margin-bottom:6pt;font-size:12pt;">Poszukujemy również miejsca tymczasowego schronienia na wypadek ewakuacji z możliwością skorzystania ze schronienia przez jednostkę – np. szkoły/ świetlicy wiejskiej/ domu parafialnego/ leśniczówki/ remizy strażackiej/ agroturystyki itp. Miejsce to dobrze by było możliwie blisko obozu i z bezpośrednim dostępem tj. kontaktem do osoby dysponującej kluczem.</p>

<p style="text-align:justify;margin-bottom:6pt;font-size:12pt;">Będziemy wdzięczni za pozytywne rozpatrzenie niniejszego wniosku.</p>

<p style="text-align:justify;margin-bottom:6pt;font-size:12pt;">Z wyrazami szacunku</p>

<p style="margin-top:20pt;">........................................</p>
<p style="font-size:9pt;font-style:italic;margin-top:0;">podpis kierownika wypoczynku</p>

<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis kierownika</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Pieczęć i podpis hufcowego</div></div>
</div>`,
  },

  nadlesnictwo: {
    label: 'Wniosek do Nadleśnictwa',
    icon: '🌲',
    html: `${SENDER}
<div style="margin-bottom:18px;">
  <p>Nadleśnictwo <b>{{nadlesnictwo}}</b></p>
</div>
<p style="font-weight:bold;text-align:center;font-size:12pt;margin:18px 0 14px;">Wniosek o udostępnienie terenu leśnego w celu organizacji obozu harcerskiego</p>
<p>Szanowni Państwo,</p>
<p>zwracam się z uprzejmą prośbą o udostępnienie terenu leśnego w obrębie Nadleśnictwa <b>{{nadlesnictwo}}</b>, leśnictwa <b>{{lesnictwo}}</b> (oddział leśny nr <b>{{oddzial_lesny}}</b>), w celu organizacji obozu harcerskiego <b>{{jednostka}}</b> w terminie od <b>{{date_start}}</b> do <b>{{date_end}}</b>.</p>
<p>Organizatorem obozu jest <b>{{hufiec}}</b>, działający w ramach Stowarzyszenia Harcerstwa Katolickiego „Zawisza" – Federacji Skautingu Europejskiego (Skauci Europy), reprezentowany przez kierownika wypoczynku <b>{{kierownik}}</b> (<b>{{tel_kierownik}}</b>).</p>
<p>W obozie weźmie udział około <b>{{uczestnicy}}</b> uczestników w wieku <b>{{wiek}}</b> lat oraz <b>{{liczba_kadry}}</b> osób kadry wychowawczej. Uczestnikami będą {{CHOICE:plec:dziewczęta|chłopcy}} należący do {{CHOICE:galaz:gromad|drużyn}} Skautów Europy.</p>
<p>Zobowiązujemy się do przestrzegania przepisów o ochronie lasu, utrzymania czystości oraz przywrócenia terenu do stanu pierwotnego po zakończeniu obozu.</p>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis kierownika</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Pieczęć i podpis hufcowego</div></div>
</div>`,
  },

  oswiadczenie: {
    label: 'Oświadczenie właściciela',
    icon: '📝',
    html: `
<div style="text-align:right;margin-bottom:22px;">{{miejsce}}, dnia {{data_dzis}}</div>
<p style="font-weight:bold;text-align:center;font-size:13pt;margin:0 0 6px;">OŚWIADCZENIE WŁAŚCICIELA TERENU</p>
<p style="text-align:center;margin-bottom:22px;">o wyrażeniu zgody na organizację obozu harcerskiego</p>
<p>Ja, niżej {{CHOICE:podp:podpisany|podpisana}} ................................................................., {{CHOICE:zamiesz:zamieszkały|zamieszkała}} w ................................................................., legitymujący się dowodem osobistym nr .................................................................,</p>
<p style="font-weight:bold;margin-top:12px;">oświadczam, że wyrażam zgodę na:</p>
<ol style="margin:8px 0 8px 22px;">
  <li>Rozbicie obozu harcerskiego na terenie działki nr <b>{{nr_dzialki}}</b> w miejscowości <b>{{miejsce}}</b>,</li>
  <li>Korzystanie z terenu przez jednostkę <b>{{jednostka}}</b> w terminie od <b>{{date_start}}</b> do <b>{{date_end}}</b>,</li>
  <li>Użytkowanie istniejącej infrastruktury (..................).</li>
</ol>
<p>W obozie weźmie udział ok. <b>{{uczestnicy}}</b> osób, w tym kierownik oraz <b>{{liczba_kadry}}</b> wychowawców. Uczestnicy są w wieku <b>{{wiek}}</b> lat.</p>
<p>Zgoda obejmuje w szczególności kopanie dołów chłonnych i latryn, rozpalanie ognisk w wyznaczonych miejscach, postawienie beczkowozu z wodą oraz składowanie odpadów w wydzielonym miejscu.</p>
<p>Organizator zobowiązuje się do przywrócenia terenu do stanu pierwotnego po zakończeniu obozu.</p>
<p style="margin-top:14px;"><b>Dane kontaktowe kierownika obozu:</b></p>
<p>Imię i nazwisko: <b>{{kierownik}}</b></p>
<p>Nr telefonu: <b>{{tel_kierownik}}</b> &nbsp;&nbsp; E-mail: <b>{{email}}</b></p>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis właściciela</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis kierownika</div></div>
</div>`,
  },

  schronienie: {
    label: 'Umowa tymcz. schronienie',
    icon: '🏠',
    html: `
<p style="font-weight:bold;text-align:center;font-size:12pt;margin:0 0 6px;">Umowa na korzystanie z budynku jako miejsca tymczasowego schronienia</p>
<p style="text-align:center;margin-bottom:18px;font-size:10pt;">w czasie niesprzyjających warunków pogodowych dla uczestników obozu harcerskiego</p>
<p>Zawarta w dniu <b>{{data_dzis}}</b> pomiędzy:</p>
<p><b>{{bezp_budynek}}</b> reprezentowaną przez ............................................., zwanego dalej „Użyczający",</p>
<p>a Stowarzyszeniem Harcerstwa Katolickiego „Zawisza" Federacja Skautingu Europejskiego, reprezentowanym przez <b>{{kierownik}}</b>, zwanym dalej „Korzystającym".</p>
<p style="font-weight:bold;margin-top:14px;">§1.</p>
<p>Użyczający oświadcza, że zarządza budynkiem w <b>{{bezp_miejscowosc}}</b> (adres: <b>{{bezp_adres}}</b>) i deklaruje, że udostępni Korzystającemu Budynek (dla około <b>{{uczestnicy}}</b> osób) w dniach od <b>{{date_start}}</b> do <b>{{date_end}}</b> w razie niesprzyjających warunków pogodowych.</p>
<p style="font-weight:bold;margin-top:12px;">§2.</p>
<p>Użyczający oddaje Korzystającemu do korzystania Budynek, a w szczególności: sale, zaplecze sanitarne oraz pomieszczenia umożliwiające przygotowanie posiłków.</p>
<p style="font-weight:bold;margin-top:12px;">§3.</p>
<p>Korzystający zobowiązuje się do przestrzegania regulaminów, utrzymania porządku oraz pokrycia ewentualnych kosztów wynikłych z użytkowania obiektu.</p>
<p style="font-weight:bold;margin-top:12px;">§4.</p>
<p>Umowa obowiązuje w czasie trwania obozu harcerskiego <b>{{jednostka}}</b> organizowanego przez <b>{{hufiec}}</b>.</p>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Użyczający</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Korzystający (Kierownik)</div></div>
</div>`,
  },

  pojazd: {
    label: 'Umowa użyczenia pojazdu',
    icon: '🚗',
    html: `
<p style="font-weight:bold;text-align:center;font-size:13pt;margin:0 0 6px;">UMOWA BEZPŁATNEGO UŻYCZENIA SAMOCHODU</p>
<p style="text-align:center;margin-bottom:18px;">Zawarta dnia: <b>{{data_dzis}}</b> w <b>{{miejsce}}</b></p>
<p>pomiędzy: ......................................................, zwanym dalej Użyczającym</p>
<p>oraz: <b>{{hufiec}}</b>, Stowarzyszenie Harcerstwa Katolickiego „Zawisza", zwanym dalej Biorącym.</p>
<p style="font-weight:bold;margin-top:14px;">§1</p>
<p>1. Użyczający użycza Biorącemu samochód marki: ..............., koloru ..............., nr rejestracyjny: ..............., rok produkcji: ..............., którego jest właścicielem.</p>
<p>2. Użyczający oświadcza, że samochód jest sprawny, posiada ubezpieczenie OC oraz ważny przegląd techniczny.</p>
<p style="font-weight:bold;margin-top:12px;">§2</p>
<p>Wszelkie zmiany umowy mogą nastąpić tylko w formie pisemnej pod rygorem nieważności.</p>
<p style="font-weight:bold;margin-top:12px;">§3</p>
<p>Użyczający wyraża zgodę na używanie samochodu w ramach działalności statutowej — organizacji obozu harcerskiego <b>{{jednostka}}</b> w terminie od <b>{{date_start}}</b> do <b>{{date_end}}</b>.</p>
<p style="font-weight:bold;margin-top:12px;">§4</p>
<p>Biorący zobowiązuje się nie oddawać pojazdu osobom trzecim oraz pokrywać koszty eksploatacji.</p>
<p style="font-weight:bold;margin-top:12px;">§5</p>
<p>Umowa obowiązuje od <b>{{date_start}}</b> do <b>{{date_end}}</b>.</p>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Użyczający</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Biorący (Kierownik)</div></div>
</div>`,
  },

  szkola: {
    label: 'Wniosek o pomieszczenia szkolne',
    icon: '🏫',
    html: `${SENDER}
<div style="margin-bottom:18px;">
  <p>Sz. P. .......................................</p>
  <p>Dyrektor .......................................................................................................</p>
</div>
<p style="font-weight:bold;text-align:center;font-size:12pt;margin:18px 0 14px;">Wniosek o udostępnienie pomieszczeń szkolnych</p>
<p>Szanowny Panie Dyrektorze,</p>
<p>zwracam się z uprzejmą prośbą o wyrażenie zgody na udostępnienie pomieszczeń szkoły w celu organizacji {{CHOICE:typ:biwaku|zimowiska}} harcerskiego.</p>
<p>Wyjazd planowany jest w terminie od <b>{{date_start}}</b> do <b>{{date_end}}</b>. Organizatorem jest <b>{{jednostka}}</b> działająca w ramach Stowarzyszenia Harcerstwa Katolickiego „Zawisza" – Federacji Skautingu Europejskiego (Skauci Europy).</p>
<p>W wydarzeniu weźmie udział około <b>{{uczestnicy}}</b> uczestników w wieku <b>{{wiek}}</b> lat oraz <b>{{liczba_kadry}}</b> pełnoletnich opiekunów.</p>
<p>Zwracamy się o możliwość korzystania z: sal lekcyjnych (nocleg), sali gimnastycznej, zaplecza sanitarnego oraz kuchni/stołówki.</p>
<p>Zobowiązujemy się do przestrzegania regulaminów szkoły, zapewnienia całodobowej opieki, pokrycia ewentualnych kosztów oraz przywrócenia pomieszczeń do stanu pierwotnego.</p>
<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis kierownika</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Pieczęć i podpis hufcowego</div></div>
</div>`,
  },

  regulamin: {
    label: 'Regulamin obozu',
    icon: '📋',
    html: `
<p style="font-weight:bold;text-align:center;font-size:14pt;margin:0 0 20px;">REGULAMIN OBOZU HARCERSKIEGO W {{miejsce}}</p>

<p style="font-weight:bold;margin-top:16px;font-size:11pt;">I. ORGANIZATOR</p>
<ol style="margin:6px 0 12px 22px;">
  <li style="margin-bottom:5px;">Organizatorem jest: Stowarzyszenie Harcerstwa Katolickiego „Zawisza" Federacja Skautingu Europejskiego — <b>{{hufiec}}</b></li>
  <li style="margin-bottom:5px;">Przedstawicielem organizatora i kierownikiem wypoczynku (obóz harcerski <b>{{jednostka}}</b> — sprawuje bezpośredni nadzór nad stanem ochrony przeciwpożarowej): <b>{{kierownik}}</b></li>
  <li style="margin-bottom:5px;">Funkcję wychowawców sprawują: <b>{{kontakt1}}</b>, <b>{{kontakt2}}</b></li>
</ol>

<p style="font-weight:bold;margin-top:16px;font-size:11pt;">II. PROGRAM I ORGANIZACJA OBOZU</p>
<ol style="margin:6px 0 12px 22px;">
  <li style="margin-bottom:5px;">Ze względu na specyfikę obozu FSE podczas zajęć opiekę nad uczestnikami obozu sprawuje wychowawca.</li>
  <li style="margin-bottom:5px;">Od strony higieniczno-sanitarnej obóz spełnia wymogi określone w Instrukcji Głównego Inspektora Sanitarnego.</li>
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
      <li>opieki nad powierzonym sprzętem i ekwipunkiem.</li>
    </ol>
  </li>
  <li style="margin-bottom:5px;">W razie złego samopoczucia lub wypadku uczestnicy są zobowiązani natychmiast poinformować wychowawcę lub komendanta obozu.</li>
  <li style="margin-bottom:5px;">Uczestnicy dbają o bezpieczeństwo swoje i innych — wszystkie zagrożenia mające wpływ na bezpieczeństwo uczestników należy zgłaszać kierownikowi lub wychowawcom.</li>
  <li style="margin-bottom:5px;">Uczestnicy są posłuszni poleceniom w czasie ewakuacji, po przeliczeniu w miejscu zbiórki do ewakuacji nie oddalają się od grupy i sprawnie przemieszczają się w bezpieczne miejsce.</li>
</ol>

<p style="font-weight:bold;margin-top:16px;font-size:11pt;">IV. ZAKAZY I NAKAZY</p>
<ol style="margin:6px 0 12px 22px;">
  <li style="margin-bottom:5px;">Uczestnikom zabrania się:
    <ol type="a" style="margin:4px 0 4px 20px;">
      <li>oddalania się od grupy w czasie trwania obozu bez zgody instruktora,</li>
      <li>picia alkoholu, palenia tytoniu oraz zażywania innych środków odurzających,</li>
      <li>zabierania ze sobą na obóz sprzętów elektronicznych; zakres używania telefonów komórkowych określa komendant obozu,</li>
      <li>krzyków, niszczenia przyrody, rozpalania ognisk w miejscach niedozwolonych,</li>
      <li>przyjmowania leków bez wiedzy wychowawcy, kierownika.</li>
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

<p style="margin-top:28px;text-align:center;font-style:italic;">Oświadczam, że zapoznałem/am się z regulaminem i zgadzam się na udział syna/córki<br/>w obozie <b>{{jednostka}}</b> na określonych wyżej warunkach.</p>

<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis uczestnika / rodzica</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;">Podpis komendanta obozu</div></div>
</div>`,
  },

  ppoz: {
    label: 'Instrukcja ppoż. i ewakuacji',
    icon: '🔥',
    html: `
<p style="font-weight:bold;text-align:center;font-size:13pt;margin:0 0 4px;">REGULAMIN ZASAD PROWADZENIA ZAJĘĆ HARCERSKICH</p>
<p style="text-align:center;margin-bottom:2px;font-size:10pt;">Stowarzyszenie Harcerstwa Katolickiego „Zawisza" · Federacja Skautingu Europejskiego</p>
<p style="text-align:center;margin-bottom:18px;font-size:10pt;color:#888;">załącznik 4</p>

<p style="font-weight:bold;text-align:center;font-size:12pt;margin:14px 0 10px;background:#fee2e2;padding:6px;border-radius:4px;">CZĘŚĆ 1 – OGÓLNA INSTRUKCJA PRZECIWPOŻAROWA</p>

<p style="font-weight:bold;margin-top:12px;">§ 1</p>
<p>Instrukcja określa zasady ochrony przeciwpożarowej obowiązujące podczas wszelkich zajęć organizowanych przez jednostki organizacyjne Stowarzyszenia.</p>

<p style="font-weight:bold;margin-top:12px;">§ 2</p>
<ol style="margin:6px 0 10px 22px;">
  <li style="margin-bottom:5px;">Podczas zajęć w szczególności <b>zabrania się</b>:
    <ul style="margin:4px 0 4px 20px;">
      <li>rozpalania ognisk w odległości mniejszej niż 100 metrów od ściany lasu, stogów siana itp., z wyjątkiem miejsc wyznaczonych lub wskazanych przez leśniczego/właściciela lasu,</li>
      <li>chodzenia po lesie z otwartym ogniem, poza sytuacjami, gdy uzyskano pozwolenie,</li>
      <li>posługiwania się ogniem (ognisko, kuchnia polowa, świeczki, pochodnie itp.) w namiotach oraz w ich najbliższym otoczeniu, to jest w promieniu 5m od nich,</li>
      <li>instalowania urządzeń elektrycznych oraz dokonywania napraw sieci elektrycznej lub gazowej przez osoby nieuprawnione.</li>
    </ul>
  </li>
  <li style="margin-bottom:5px;">Podczas zajęć w szczególności <b>należy</b>:
    <ul style="margin:4px 0 4px 20px;">
      <li>zachować szczególną ostrożność i rozwagę przy używaniu ognia, stosując ogólne normy przeciwpożarowe,</li>
      <li>zapoznać z zasadami ochrony przeciwpożarowej uczestników zajęć, w trakcie których używany jest ogień albo przedmioty łatwopalne.</li>
    </ul>
  </li>
  <li style="margin-bottom:5px;">Podczas stacjonarnych zajęć wielodniowych (biwaków, obozów letnich i zimowych itp.) należy ponadto:
    <ul style="margin:4px 0 4px 20px;">
      <li>ustalić i podać do wiadomości uczestników sygnały i sieć alarmową, sposób zawiadamiania straży pożarnej oraz drogę i sposób ewakuacji na wypadek pożaru,</li>
      <li>zorganizować wystarczającą liczbę punktów przeciwpożarowych zawierających oznakowany sprzęt (gaśnice, hydronetki, wiadra, łopaty, beczki z wodą, skrzynie z piaskiem, tłumice, koce gaśnicze itp.),</li>
      <li>zminimalizować zagrożenie pożarowe poprzez wyeliminowanie potencjalnych jego źródeł.</li>
    </ul>
  </li>
</ol>

<p style="font-weight:bold;margin-top:12px;">§ 3</p>
<p>Przy wyborze miejsca na ognisko należy brać pod uwagę kierunek wiejącego wiatru oraz inne warunki atmosferyczne. Miejsce na ognisko należy oczyścić z chrustu, ściółki, trawy itp. Przed rozpoczęciem ogniska należy wyznaczyć osobę, która będzie stale nad nim czuwała i zabezpieczy teren po zakończeniu (ogień zgasi wodą, popiół przysypie ziemią, przywróci terenowi wygląd pierwotny).</p>

<p style="font-weight:bold;margin-top:12px;">§ 4</p>
<p>Każdy uczestnik zajęć ma obowiązek natychmiastowego zawiadomienia OOB o zauważonym pożarze lub jego potencjalnym źródle.</p>

<p style="font-weight:bold;margin-top:12px;">§ 5</p>
<p>W przypadku powstania pożaru należy: zachować spokój, natychmiast przystąpić do gaszenia i zawiadomić straż pożarną, zapewnić bezpieczną ewakuację uczestników. Po przybyciu straży pożarnej podporządkować się poleceniom kierującego akcją.</p>

<p style="font-weight:bold;margin-top:12px;">§ 6–8</p>
<p>Zasady ochrony ppoż. komendant zajęć powinien uzgodnić ze strażą pożarną i władzami leśnymi. Jeżeli czas trwania zajęć przekracza 14 dni — przeprowadzić jeden próbny alarm ppoż. na początku zajęć. Z zasadami instrukcji należy zapoznać uczestników przed rozpoczęciem zajęć.</p>

<p style="font-weight:bold;text-align:center;font-size:12pt;margin:20px 0 10px;background:#fee2e2;padding:6px;border-radius:4px;">CZĘŚĆ 2 – INSTRUKCJA POSTĘPOWANIA W RAZIE POŻARU NA BIWAKU/OBOZIE</p>

<p style="font-weight:bold;margin-top:12px;">I. ALARMOWANIE</p>
<ol style="margin:6px 0 10px 22px;">
  <li style="margin-bottom:5px;">Kto zauważy pożar, zobowiązany jest niezwłocznie zawiadomić:
    <ul style="margin:4px 0 4px 20px;">
      <li>osoby znajdujące się w strefie zagrożenia,</li>
      <li><b>STRAŻ POŻARNĄ — tel. 998</b> (lub lokalną jednostkę: ................................),</li>
      <li>komendanta obozu: <b>{{kierownik}}</b>, tel. <b>{{tel_kierownik}}</b></li>
      <li>wychowawcę: <b>{{kontakt1}}</b>, tel. <b>{{tel_kontakt1}}</b></li>
    </ul>
  </li>
  <li style="margin-bottom:5px;">Po uzyskaniu połączenia ze strażą pożarną należy wyraźnie podać: <b>gdzie się pali</b> (dokładny adres i położenie obozu), <b>co się pali</b>, czy są zagrożeni ludzie, numer telefonu i swoje nazwisko. <u>Odłożyć słuchawkę dopiero po otrzymaniu potwierdzenia przyjęcia zgłoszenia.</u></li>
  <li style="margin-bottom:5px;">Zachować spokój i nie dopuścić do powstania paniki.</li>
  <li style="margin-bottom:5px;">W razie potrzeby alarmować: POGOTOWIE — 999, POLICJA — 997, Zarządca obiektu (leśnictwo: ................................).</li>
</ol>

<p style="font-weight:bold;margin-top:12px;">II. AKCJA RATOWNICZO-GAŚNICZA</p>
<ol style="margin:6px 0 10px 22px;">
  <li style="margin-bottom:5px;">Równocześnie z alarmowaniem należy przystąpić do akcji ratowniczo-gaśniczej przy użyciu podręcznego sprzętu gaśniczego.</li>
  <li style="margin-bottom:5px;">Do czasu przybycia straży pożarnej kierownictwo nad akcją obejmuje komendant obozu.</li>
  <li style="margin-bottom:5px;">Każdy przystępujący do akcji pamiętaj: w pierwszej kolejności zadbaj o bezpieczeństwo ludzi; stosuj gaśnice śniegowe, proszkowe lub halonowe; usuń z zasięgu ognia materiały palne, butle z gazem, cenne dokumenty.</li>
</ol>

<p style="font-weight:bold;margin-top:12px;">III. ZASADY EWAKUACJI</p>
<ol style="margin:6px 0 10px 22px;">
  <li style="margin-bottom:5px;">Komendant ogłasza ewakuację obozu.</li>
  <li style="margin-bottom:5px;">Uczestnicy niezwłocznie zbierają się na placu apelowym.</li>
  <li style="margin-bottom:5px;">Wychowawca sprawdza stan uczestników.</li>
  <li style="margin-bottom:5px;">Wszyscy pod kierownictwem komendanta udają się wyznaczoną drogą do ustalonego bezpiecznego miejsca. <b>Pod żadnym pozorem uczestnicy nie mogą oddalać się od grupy.</b></li>
</ol>

<p style="font-weight:bold;text-align:center;font-size:12pt;margin:20px 0 10px;background:#fee2e2;padding:6px;border-radius:4px;">CZĘŚĆ 3 – INSTRUKCJA BEZPIECZEŃSTWA POŻAROWEGO NA BIWAKU/OBOZIE</p>

<p style="font-weight:bold;margin-top:12px;">I. PRZEPISY WSTĘPNE</p>
<p>Postanowienia niniejszej Instrukcji obowiązują wszystkich obozowiczów bez wyjątku w czasie przebywania na terenie obozu. Osoby winne nieprzestrzegania przepisów będą pociągnięte do odpowiedzialności.</p>

<p style="font-weight:bold;margin-top:12px;">II. PRZEPISY PORZĄDKOWE</p>
<ol style="margin:6px 0 10px 22px;">
  <li style="margin-bottom:5px;">Na terenie obozu zabronione jest m.in.: używanie otwartego ognia poza wyznaczonymi miejscami; przechowywanie materiałów palnych bliżej niż 0,5 m od miejsc przeznaczonych do palenia ognisk; używanie lamp naftowych niezgodnie z przeznaczeniem; palenie tytoniu (całkowity zakaz).</li>
  <li style="margin-bottom:5px;">Ciecze palne (benzyna, nafta, spirytus) przechowywać wyłącznie w pojemnikach z materiałów trudnozapalnych, szczelnie zamkniętych.</li>
  <li style="margin-bottom:5px;">Wszelkie nieprawidłowości w zakresie bezpieczeństwa pożarowego należy natychmiast zgłosić komendantowi obozu.</li>
  <li style="margin-bottom:5px;">Po zakończeniu dziennych zajęć sprawdzić, czy wszystkie piece, ogniska i lampy zostały zgaszone.</li>
  <li style="margin-bottom:5px;">Wartownicy pełniący straż nocną używają wyłącznie latarek.</li>
</ol>

<p style="font-weight:bold;margin-top:12px;">III. SPRZĘT GAŚNICZY</p>
<p>Każdy obozowicz obowiązany jest: znać rodzaje i sposób użycia podręcznego sprzętu gaśniczego, znać miejsca jego rozmieszczenia na terenie obozu.</p>

<p style="font-weight:bold;margin-top:12px;">IV. POSTĘPOWANIE W PRZYPADKU POWSTANIA POŻARU</p>
<p>Każdy obozowicz, z chwilą zauważenia pożaru, obowiązany jest: zaalarmować harcerzy w najbliższym otoczeniu pożaru i komendanta obozu; powiadomić <b>STRAŻ POŻARNĄ — tel. 998</b>; przystąpić do akcji gaśniczej z zachowaniem szczególnej ostrożności i dbając o własne bezpieczeństwo. Wszyscy harcerze bezwzględnie podporządkowują się rozkazom komendanta obozu, a po przybyciu straży — jej dowódcy.</p>

<div style="margin-top:40px;display:flex;justify-content:space-between;">
  <div style="text-align:center;"><div>miejscowość, data</div><div style="border-top:1px solid #333;width:190px;padding-top:4px;margin-top:30px;">.................................</div></div>
  <div><div style="border-top:1px solid #333;width:190px;padding-top:4px;text-align:center;margin-top:30px;">Podpis kierownika obozu</div></div>
</div>`,
  },

  kontaktowa: {
    label: 'Lista kontaktowa',
    icon: '📞',
    html: `
<p style="font-weight:bold;text-align:center;font-size:14pt;margin:0 0 4px;">LISTA KONTAKTOWA OBOZU</p>
<p style="text-align:center;margin-bottom:14px;color:#555;">{{jednostka}} · {{date_start}} – {{date_end}} · {{miejsce}}</p>

<table style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:14px;">
  <tr style="background:#2d6a2d;color:#fff;"><th style="padding:6px 8px;text-align:left;" colspan="2">KIEROWNICTWO OBOZU</th></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;width:38%;">Kierownik obozu</td><td style="padding:5px 8px;"><b>{{kierownik}}</b> · {{tel_kierownik}}</td></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;">Wychowawca</td><td style="padding:5px 8px;"><b>{{kontakt1}}</b> · {{tel_kontakt1}}</td></tr>
  <tr><td style="padding:5px 8px;">Wychowawca</td><td style="padding:5px 8px;"><b>{{kontakt2}}</b> · {{tel_kontakt2}}</td></tr>
</table>

<table style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:14px;">
  <tr style="background:#2d6a2d;color:#fff;"><th style="padding:6px 8px;text-align:left;" colspan="2">KONTAKTY ALARMOWE</th></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;width:38%;">Pogotowie / Alarmowy</td><td style="padding:5px 8px;"><b>999 / 112</b></td></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;">Straż Pożarna</td><td style="padding:5px 8px;"><b>998</b> · {{psp}}</td></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;">Policja</td><td style="padding:5px 8px;"><b>997</b> · {{policja}}</td></tr>
  <tr><td style="padding:5px 8px;">Szpital / Przychodnia</td><td style="padding:5px 8px;">{{szpital}}</td></tr>
</table>

<table style="width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:14px;">
  <tr style="background:#2d6a2d;color:#fff;"><th style="padding:6px 8px;text-align:left;" colspan="3">STOWARZYSZENIE — KONTAKTY CENTRALNE</th></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;">Biuro Stowarzyszenia</td><td style="padding:5px 8px;">22 822 32 29 / 668 415 726</td><td style="padding:5px 8px;color:#666;">biuro@skauci-europy.pl</td></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;">Ochrona Dzieci i Młodzieży</td><td style="padding:5px 8px;">731 988 833</td><td style="padding:5px 8px;color:#666;">ochrona.dim@skauci-europy.pl</td></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;">Psycholog</td><td style="padding:5px 8px;">730 988 833</td><td style="padding:5px 8px;color:#666;">wsparcie.psychologiczne@skauci-europy.pl</td></tr>
  <tr><td style="padding:5px 8px;">Szef Kursu (Wypoczynek)</td><td style="padding:5px 8px;">508 510 456</td><td style="padding:5px 8px;color:#666;">wypoczynek@skauci-europy.edu.pl</td></tr>
</table>

<table style="width:100%;border-collapse:collapse;font-size:10pt;">
  <tr style="background:#2d6a2d;color:#fff;"><th style="padding:6px 8px;text-align:left;" colspan="2">HUFIEC: {{hufiec}}</th></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;width:38%;">Hufcowa/y</td><td style="padding:5px 8px;">.................................</td></tr>
  <tr style="border-bottom:1px solid #ddd;"><td style="padding:5px 8px;">Z-ca Hufcowej/go</td><td style="padding:5px 8px;">.................................</td></tr>
  <tr><td style="padding:5px 8px;">Asystent/ka ds. wypoczynku</td><td style="padding:5px 8px;">.................................</td></tr>
</table>`,
  },
}
