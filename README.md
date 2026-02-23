# LÄRAR-LABBET: Case 47 — Engagemangets försvinnande (Escape room)

Ett offline, svinbra mini-escape room för lärare som **lär ut escape room-design genom att spelas**.

## ✅ Kör lokalt
1. Ladda ner/klona projektet
2. Öppna `index.html` i valfri webbläsare

## ✅ GitHub Pages (ingen build)
1. Skapa ett repo
2. Ladda upp filerna i root:
   - `index.html`
   - `styles.css`
   - `data.js`
   - `game.js`
   - `README.md`
3. GitHub: **Settings → Pages → Deploy from branch → main / root**
4. Klart.

## Tips
- Kör på projektor i helskärm (`F11`).
- Låt en person vara “Spelledare” (rollen i spelet).
- Hint kostar tid (10 sek), medvetet: “hint-ekonomi”.

## Ändra texter och pussel
All kopia och pussel-data ligger i `data.js`.
- Tidsgräns: `LAB.config.durationSeconds`
- Hintstraff: `LAB.config.hintPenaltySeconds`
- Innehåll, frågor, alternativ, debrief: `LAB.rooms` och `LAB.debrief`.

## Licens
Fri att använda i undervisning. Anpassa gärna.
