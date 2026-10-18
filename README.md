# STGym

Aplikacja do rozpisywania treningów trójbojowych i śledzenia postępów.

**Aplikacja:** https://morzycrafal-darthproof.github.io/STGym/

## Co potrafi

- **Plany** – tygodnie, dni i ćwiczenia z ciężarem, powtórzeniami i RPE dla każdej serii, superserie, duplikowanie tygodnia z progresją (+kg).
- **Import z tekstu** – wklej rozpiskę w formacie `Przysiad: 4 serie x 6 powtórzeń – 105/110/115/120 kg (RPE 7)`.
- **Trening** – serie wypełnione z planu, odhaczanie wykonanych, podpowiedź „ostatnio”, timer przerwy.
- **Postęp** – szacowane 1RM (Epley + RPE) dla przysiadu, ławki i martwego ciągu, wykresy, objętość tygodniowa, rekordy.

Dane zapisują się tylko w przeglądarce na danym urządzeniu. Kopię zrobisz w **Ustawienia → Eksportuj JSON**.

Na telefonie: otwórz link i wybierz „Dodaj do ekranu głównego”.

## Rozwój

```bash
npm install
npm run dev
```

Każdy push na `main` buduje i publikuje aplikację na GitHub Pages (`.github/workflows/deploy.yml`).
