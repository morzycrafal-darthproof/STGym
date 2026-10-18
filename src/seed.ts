import { parsePlanText } from './lib/parser'
import type { Plan } from './types'

// Programs from rozpiska.md, with typos fixed so the parser can read them.

const STRENGTH = `
Tydzień 1: Rozruch i budowanie objętości

Dzień 1: Przysiad (główny) + Ławka (słaby punkt / akcesoria)
Przysiad ze sztangą: 4 serie x 6 powtórzeń – 105/110/115/120 kg (ok. RPE 6.5–7)
Wyciskanie z pauzą: 4 serie x 8 powtórzeń – 75/77,5/80/82,5 kg
RDL (rumuński martwy ciąg): 3 serie x 8 powtórzeń – 90–100/110 kg
Wiosłowanie sztangą w oparciu: 4 serie x 8 powtórzeń – 60–70 kg
Wznosy hantli bokiem + triceps: 3 serie x 12–15 powtórzeń

Dzień 2: Wyciskanie (główne) + Martwy ciąg (wariacja)
Wyciskanie na ławce poziomej: 4 serie x 6 powtórzeń – 85/87,5/90/92,5 kg (ok. RPE 7)
Martwy ciąg na podwyższeniu (deficit ~3–5 cm): 3 serie x 6 powtórzeń – 120/125/130/135 kg
Przysiad przedni (front squat): 3 serie x 7 powtórzeń – RPE 7, 70/75/80/85 kg
Pompki na poręczach (dips): 3 serie x 8–10 powtórzeń
Przyciąganie drążka do brzucha: 4 serie x 10–12 powtórzeń

Dzień 3: Martwy ciąg (główny) + Przysiad (pauza)
Martwy ciąg klasyczny: 4 serie x 5 powtórzeń – 135/140/145/150 kg (ok. RPE 7)
Wyciskanie wąskim chwytem (close-grip bench): 3 serie x 8 powtórzeń – 72,5/75/77,5/80 kg
Przysiad z pauzą (2 sekundy na dole): 3 serie x 5 powtórzeń – 90/95/100/105 kg
Uginanie nóg na maszynie: 3 serie x 12 powtórzeń
Superserie na plecy i klatkę (3 serie):
Ściąganie linki z góry + rozpiętki 10–12 powtórzeń
Uginanie ramion w oparciu + wznosy bokiem 10–12 powtórzeń
`

const VOLUME = `
Dzień 1
Przysiady na 6
Suwnica
Dwójki i czwórki na maszynie
Ława 4x8 + podciąganie

Dzień 2
Martwy ciąg z pauzą
Przysiad przedni
Wiosło sztangą + hantle na skosie
Wyciąg z góry + OHP
Biceps + triceps

Dzień 3
Wiosłowanie w oparciu o ławkę
Wyciskanie z pauzą
Rozpiętki + plecy na lince
Biceps + triceps
Wznosy bokiem
`

const BODYBUILDING = `
Dzień 1
Przysiad ze sztangą (tempo, pauza)
Wykroki
Dwójki i czwórki na maszynie
Wyciskanie na ławce płaskiej cunami
Rozpiętki

Dzień 2
Martwy ciąg z trapbarem
Przysiad ATG 5 powtórzeń – 90 kg
Wiosłowanie sztangą z podłogi – 100 kg
Ściąganie linki z góry lub z dołu
Biceps + triceps

Dzień 3
Ławka (tempo, pauza)
Wyciskanie hantli na skosie
Wiosłowanie w oparciu o ławkę
OHP
Biceps + triceps
`

export function seedPlans(): Plan[] {
  return [
    parsePlanText(STRENGTH, 'Trójbój – nowa objętość', 'Blok siłowy, ciężary rosnące seria po serii.'),
    parsePlanText(VOLUME, 'Objętość (szkic)', 'Szkic – uzupełnij serie, powtórzenia i ciężary.'),
    parsePlanText(BODYBUILDING, 'Trening kulturystyczny (szkic)', 'Szkic – uzupełnij serie, powtórzenia i ciężary.'),
  ]
}
