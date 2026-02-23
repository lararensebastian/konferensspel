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
      "Ni kliver in i Lärar-labbet. Lamporna surrar. På tavlan: ett enda ord – ENGAGEMANG.",
      "Rektor har lämnat en lapp: “Det försvann någon gång efter genomgång #3. Hitta det. Snabbt.”",
      "Ni är inte här för att lyssna. Ni är här för att spela er till kunskap."
    ],
    goal: "Samla 6 bevis och knäck slutkoden innan tiden tar slut."
  },

  roles: [
    {
      id: "facilitator",
      name: "Spelledare",
      blurb: "Håller tempo, läser upp text, bestämmer när ni tar en hint.",
      perk: "Får tillgång till Spelledarvy (utan full spoil)."
    },
    {
      id: "logician",
      name: "Logiker",
      blurb: "Ser mönster, håller koll på regler, gör sammanfattningar.",
      perk: "Får en extra “tänkfråga”-hint gratis (utan tidsstraff)."
    },
    {
      id: "designer",
      name: "Designer",
      blurb: "Översätter allt till didaktik: mål → mekanik → ledtråd → test.",
      perk: "Får en bonusrad i debrief med 'bygg i morgon'-mall."
    },
    {
      id: "communicator",
      name: "Kommunikatör",
      blurb: "Håller laget synkat, läser, fördelar uppgifter och återkopplar.",
      perk: "Kan aktivera “Sammanfatta loggen” (auto-sammanfattning)."
    }
  ],

  // Rooms are a map: you can visit in any order, but each gives a barrier key.
  rooms: [
    {
      id: "archive",
      title: "Arkivet",
      icon: "🗃️",
      desc: "Lådor, mappar och… en trasig checklista. Sortera bevis och hitta designfelet.",
      hint: "Det här rummet lär ut: alignment & tydlig målbild.",
      barrierKey: "A",
      evidenceEarned: 2,
      puzzle: {
        type: "matrix",
        prompt: "Ni hittar 6 ledtrådar. Tre är BRA (hjälper lärandemål). Tre är DÅLIGA (låter coolt men tränar fel sak). Markera tre som är DÅLIGA.",
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
          "Bevis A säkrat: ALIGNMENT betyder att varje pussel tränar rätt sak – och att 'vad som räknas' är tydligt."
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
      hint: "Det här rummet lär ut: flöde & parallella spår.",
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
          "Bevis B säkrat: FLÖDE = minska väntan, synliggör framsteg, låt grupper arbeta samtidigt."
        ],
        failCopy: "Det där skapar ofta väntan eller otydlighet. Vilket upplägg håller ALLA aktiva?",
        hintCopy: "Tips: I ett klassrum är 'väntan' en engagemangsdödare. Designa bort köer."
      }
    },
    {
      id: "field",
      title: "Fältlabbet",
      icon: "🧪",
      desc: "En väska med blandade komponenter. Koppla mekanik till lärandemål (mål → mekanik).",
      hint: "Det här rummet lär ut: designordning & mekanikmatchning.",
      barrierKey: "C",
      evidenceEarned: 2,
      puzzle: {
        type: "match",
        prompt: "Matcha tre lärandemål med rätt mekanik.",
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
          "Bevis C säkrat: DESIGNORDNING = Mål → Mekanik → Ledtrådar/estetik → Playtest."
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
    explain: "Koden är inte en summa. Den är ett kvitto. Skriv siffrorna i ordning: [barriärer]-[bra principer]-[utan hint]-[felval]."
  },

  debrief: {
    title: "Debrief (5–10 min)",
    questions: [
      "Vad fick er att känna framsteg? Vad kändes som stopp?",
      "Var märktes alignment (pussel tränar rätt sak) – och var hade det kunnat brytas?",
      "Hur skulle ni göra detta 'digilogt' i ett klassrum (fysiskt + digitalt)?",
      "Vilken mekanik i dag kan du återanvända i ditt ämne nästa vecka?",
      "Vilken hint-regel är rimlig för dina elever – och varför?"
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
      "Om gruppen fastnar: fråga 'Vad betyder framsteg här?' innan du ger hint.",
      "Be dem alltid säga högt: mål → mekanik → ledtråd. Det är designmuskel.",
      "Efter varje rum: ta 20 sekunder, låt dem formulera en lärdom i en mening."
    ],
    timing: [
      "0–2 min: roller + cold open",
      "2–11 min: tre rum (i valfri ordning)",
      "11–14 min: kassaskåp",
      "14–15 min: snabb debrief (eller fortsätt efter)"
    ]
  }
};
