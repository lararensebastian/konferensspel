// ==========================================================
// DATA — all copy & puzzle definitions in one file
// ==========================================================

const LAB = {
  config: {
    durationSeconds: 15 * 60,       // 15 min feels better for teacher workshop
    hintPenaltySeconds: 10,         // each hint costs time (teaches economy of hints)
    maxEvidence: 6,                 // 3 rooms + 3 meta clues = 6
  },

  story: {
    coldOpen: [
      "Ni sitter i konferensrummet 4008. Kaffet är varmt. Tiden är knapp.",
      "Ni ska snart bygga egna escape rooms i ämnesgrupper — men först måste ni spela ett.",
      "Ingen förkunskap behövs. Ett klassrums-escape room är bara: tydligt mål + små steg + samarbete + lås/koder som visar framsteg."
    ],
    goal: "Lös tre problem, samla 6 bevis och öppna kassaskåpet — då är ni redo för workshop."
  },

  roles: [
    {
      id: "facilitator",
      name: "Den som håller ihop det",
      blurb: "Läser upp, håller tempo, ser till att alla kommer till tals.",
      perk: "Kan öppna en kort ledarhjälp (utan spoilers)."
    },
    {
      id: "logician",
      name: "Den som ser mönster",
      blurb: "Håller koll på regler, sammanfattar, fångar detaljer.",
      perk: "Första hint i varje rum kostar ingen tid (en gång)."
    },
    {
      id: "designer",
      name: "Den som tänker klassrum",
      blurb: "Översätter allt till ‘hur gör jag detta med elever?’",
      perk: "Får en extra ‘bygg i morgon’-mall i slutet."
    },
    {
      id: "communicator",
      name: "Den som håller laget synkat",
      blurb: "Fördelar uppgifter, håller alla med, stoppar sidospår.",
      perk: "Kan trycka ‘Sammanfatta’ när det blir rörigt."
    }
  ],

  // Rooms are a map: you can visit in any order, but each gives a barrier key.
  rooms: [
    {
      id: "archive",
      title: "Arkivet",
      icon: "🗃️",
      desc: "Lådor, mappar och… en trasig checklista. Sortera bevis och hitta designfelet.",
      hint: "Det här rummet handlar om: att elever förstår exakt vad de ska göra (och varför).",
      barrierKey: "A",
      evidenceEarned: 2,
      puzzle: {
        type: "matrix",
        prompt: "Ni ser 6 påståenden om en lektion. Tre hjälper elever att lyckas. Tre brukar skapa frustration. Markera de tre som skapar problem.",
        options: [
          { id:"o1", text:"Varje pussel tränar ett tydligt lärandemål.", bad:false },
          { id:"o2", text:"Pusslen är maximalt svåra så att de 'känns äkta'.", bad:true },
          { id:"o3", text:"Det finns en synlig målbild: 'vad räknas som framsteg?'", bad:false },
          { id:"o4", text:"Ledtrådar saknar koppling till innehållet men är 'roliga'.", bad:true },
          { id:"o5", text:"Hints finns, och de är rimliga och förutsägbara.", bad:false },
          { id:"o6", text:"Poäng/regler är otydliga för att skapa mystik.", bad:true }
        ],
        correctBad: ["o2","o4","o6"],
        successCopy: [
          "✅ Ni hittade designfelet: det dåliga escape roomet prioriterade mystik framför lärande.",
          "Bevis A säkrat: När ‘vad som räknas’ är tydligt vågar fler elever försöka – och du tränar rätt sak."
        ],
        failCopy: "Inte riktigt. Vilka tre påståenden vill du ALDRIG se i ett klassrums-escape room?",
        hintCopy: "Tips: leta efter saker som gör elever frustrerade eller som inte tränar innehållet."
      }
    },
    {
      id: "studio",
      title: "Studion",
      icon: "🎛️",
      desc: "En kontrollpanel med tre spår. För att undvika flaskhalsar krävs parallella vägar.",
      hint: "Det här rummet handlar om: att slippa väntetid och få alla aktiva samtidigt.",
      barrierKey: "B",
      evidenceEarned: 2,
      puzzle: {
        type: "routing",
        prompt: "Ni behöver designa flöde. Välj den plan som minskar flaskhalsar (parallella spår) och håller alla aktiva.",
        choices: [
          {
            id:"c1",
            title:"Plan 1: En väg",
            text:"Alla gör samma pussel i turordning. Ett rätt svar låser upp nästa.",
            correct:false
          },
          {
            id:"c2",
            title:"Plan 2: Tre spår",
            text:"Tre olika pussel kan göras samtidigt. Varje lösning ger en siffra till slutkoden.",
            correct:true
          },
          {
            id:"c3",
            title:"Plan 3: Fri yta",
            text:"Eleverna får göra vad de vill. Läraren samlar ihop till slutet.",
            correct:false
          }
        ],
        successCopy: [
          "✅ Rätt. Parallella spår håller fler hjärnor igång.",
          "Bevis B säkrat: Bygg bort köer. Gör framsteg synligt. Låt flera saker kunna hända samtidigt."
        ],
        failCopy: "Det där brukar skapa väntan eller att några hamnar utanför. Vilket upplägg håller fler aktiva?",
        hintCopy: "Tips: I ett klassrum är 'väntan' en engagemangsdödare. Designa bort köer."
      }
    },
    {
      id: "field",
      title: "Fältlabbet",
      icon: "🧪",
      desc: "En väska med blandade komponenter. Koppla mekanik till lärandemål (mål → mekanik).",
      hint: "Det här rummet handlar om: att börja med målet och välja en rimlig aktivitet.",
      barrierKey: "C",
      evidenceEarned: 2,
      puzzle: {
        type: "match",
        prompt: "Matcha tre mål med en aktivitet som faktiskt tränar det målet.",
        goals: [
          { id:"G1", text:"Träna källkritik." },
          { id:"G2", text:"Begrepp i biologi (cellens delar)." },
          { id:"G3", text:"Samarbete och kommunikation." }
        ],
        mechanics: [
          { id:"M1", text:"QR → jämför två artiklar, identifiera trovärdig källa, få kod via Google Form." },
          { id:"M2", text:"Dra-och-släpp etiketter på cellbild → rätt placering ger lösenord." },
          { id:"M3", text:"Rollkort: tre fragment måste kombineras genom högläsning/sammanfattning." }
        ],
        correct: { G1:"M1", G2:"M2", G3:"M3" },
        successCopy: [
          "✅ Matchat. Ni designar som proffs.",
          "Bevis C säkrat: Börja med målet. Välj aktivitet. Lägg på form/stil sist. Testa snabbt med en kollega."
        ],
        failCopy: "Nära! Fråga: vilken mekanik tränar den specifika förmågan – inte bara 'är kul'?",
        hintCopy: "Tips: källkritik = bedöma trovärdighet. Cell = namnge/placera. Samarbete = beroende mellan personer."
      }
    }
  ],

  // Meta puzzles: revealed as you solve rooms. They give digits for final safe.
  meta: {
    title: "Kassaskåpet",
    intro: [
      "Tre barriärer öppnar kassaskåpet… men inte utan kod.",
      "Koden är fyra siffror. Ni hittar siffrorna genom hur ni spelade."
    ],
    // digits rule: teaches measurement + reflection
    digits: [
      { id:"d1", label:"Antal barriärer", value: 3 }, // fixed
      { id:"d2", label:"Antal BRA principer ni identifierade i Arkivet", valueFrom: "archiveGoodCount" },
      { id:"d3", label:"Antal rum ni löste utan hint", valueFrom: "noHintRooms" },
      { id:"d4", label:"Antal felval i Studion", valueFrom: "studioMissteps" }
    ],
    // we compute a 4-digit code by concatenating digits, not summing (more escape-room-ish)
    // Example: 3-3-2-1 => 3321
    explain: "Koden är ett kvitto på hur ni spelade. Skriv siffrorna i ordning: barriärer – bra saker ni såg – rum utan hint – felval."
  },

  debrief: {
    title: "Debrief (5–10 min)",
    questions: [
      "Vad gjorde att ni kände att ni kom framåt?",
      "Var blev det rörigt — och vad hade gjort det enklare?",
      "Vilken del hade funkat i din undervisning nästa vecka?",
      "Vad behöver dina elever för att våga börja?",
      "Hur vill du ge hjälp utan att ge svaret direkt?"
    ],
    takeaway: [
      "Börja med målen. Välj mekanik som tränar exakt det du vill mäta.",
      "Designa flöde: parallella spår, tydlig framstegsbild, rimliga hintar.",
      "Playtest: 1 gång med kollega, 1 gång med elev – innan du kör skarpt."
    ],
    buildTomorrowTemplate: [
      "1) Skriv 1 mål (EN mening).",
      "2) Välj 1 mekanik (match/sortera/decoda/återkoppla).",
      "3) Skriv 3 ledtrådar som pekar mot samma svar.",
      "4) Bestäm hintregel (ex: 1 gratis, sen 10s).",
      "5) Kör 10 min med kollega → fixa bottleneck."
    ]
  },

  facilitator: {
    cues: [
      "Om gruppen fastnar: fråga ‘Vad är nästa lilla steg?’ innan du ger hint.",
      "Be dem säga: ‘Vad ska eleven kunna visa här?’ (inte ‘vad är det roliga?’).",
      "Efter varje rum: be någon säga en lärdom i en mening."
    ],
    timing: [
      "0–2 min: start + (valfri) roll",
      "2–12 min: tre rum (valfri ordning)",
      "12–15 min: kassaskåp",
      "15+ min: debrief och övergång till ämnesgrupper"
    ]
  }
};
