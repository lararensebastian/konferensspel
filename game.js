// ==========================================================
// GAME — no dependencies, GitHub Pages-ready, offline
// ==========================================================

(() => {
  "use strict";

  // ---------- helpers ----------
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const pad2 = (n) => String(n).padStart(2, "0");

  // Tiny sound (WebAudio) for feedback
  let AC = null;
  const sound = {
    on: true,
    ctx() {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      return AC;
    },
    beep(kind="ok") {
      if (!sound.on) return;
      try{
        const ctx = sound.ctx();
        const t = ctx.currentTime;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);

        const map = {
          ok:  [520, 660, 780],
          bad: [180, 140, 110],
          tick:[720],
          win: [520, 660, 780, 1040]
        };

        const freqs = map[kind] || map.ok;
        o.type = (kind==="bad") ? "sawtooth" : "sine";
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);

        freqs.forEach((f, i) => o.frequency.setValueAtTime(f, t + i*0.10));
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        o.start(t);
        o.stop(t + 0.5);
      }catch(e){}
    }
  };

  // ---------- state ----------
  const S = {
    started: false,
    over: false,
    role: null,
    timeLeft: LAB.config.durationSeconds,
    timerRef: null,

    evidence: 0,
    evidenceMax: LAB.config.maxEvidence,

    roomSolved: {},          // id -> true
    roomHintsUsed: {},       // id -> count
    studioMissteps: 0,       // specific metric for meta digit
    archiveBadChosen: [],    // for meta
    archiveGoodCount: 3,     // derived: how many good principles exist (fixed 3)
    log: [],
  };

  // ---------- UI mount ----------
  const app = $("#app");
  $("#hudEvidenceMax").textContent = String(S.evidenceMax);

  $("#btnSound").addEventListener("click", () => {
    sound.on = !sound.on;
    $("#btnSound").textContent = sound.on ? "🔊" : "🔇";
    $("#btnSound").setAttribute("aria-label", sound.on ? "Ljud på" : "Ljud av");
  });

  $("#btnHelp").addEventListener("click", () => {
    $("#dlgHelp").showModal();
  });

  // facilitator dialog - only meaningful for role facilitator
  function openFac(){
    const dlg = $("#dlgFac");
    const box = $("#facContent");
    box.innerHTML = `
      <div class="tagRow">
        <span class="tag">Spelledar-cues</span>
        <span class="tag">Utan full spoil</span>
      </div>
      <h3>Cues</h3>
      <ul>${LAB.facilitator.cues.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      <h3>Tidsschema</h3>
      <ul>${LAB.facilitator.timing.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
    `;
    dlg.showModal();
  }

  // Close dialogs with Escape (native) already, but keep consistent
  ["dlgHelp","dlgFac"].forEach(id => {
    const dlg = document.getElementById(id);
    dlg.addEventListener("click", (e) => {
      const rect = dlg.getBoundingClientRect();
      const inDialog = rect.top <= e.clientY && e.clientY <= rect.top + rect.height
                    && rect.left <= e.clientX && e.clientX <= rect.left + rect.width;
      if (!inDialog) dlg.close();
    });
  });

  // ---------- render helpers ----------
  function esc(s){
    return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
  }

  function setScene(id){
    $$(".scene", app).forEach(n => n.classList.remove("active"));
    const el = $("#"+id, app);
    if (el) el.classList.add("active");
    window.scrollTo({top:0, behavior:"instant"});
  }

  function addLog(line){
    const t = timeStamp();
    S.log.push(`[${t}] ${line}`);
    S.log = S.log.slice(-20);
    const logEl = $("#logBox");
    if (logEl) logEl.textContent = S.log.join("\n");
  }

  function timeStamp(){
    const total = LAB.config.durationSeconds - S.timeLeft;
    const m = Math.floor(total/60), s = total%60;
    return `${pad2(m)}:${pad2(s)}`;
  }

  function renderHud(){
    const m = Math.floor(S.timeLeft/60), s = S.timeLeft%60;
    const el = $("#hudTime");
    el.textContent = `${pad2(m)}:${pad2(s)}`;
    el.classList.toggle("warn", S.timeLeft<=180 && S.timeLeft>60);
    el.classList.toggle("danger", S.timeLeft<=60);
    $("#hudEvidence").textContent = String(S.evidence);
  }

  function startTimer(){
    clearInterval(S.timerRef);
    S.timerRef = setInterval(() => {
      if (S.over) return;
      S.timeLeft = clamp(S.timeLeft - 1, 0, 99999);
      renderHud();
      if (S.timeLeft === 60) sound.beep("tick");
      if (S.timeLeft <= 0){
        endGame(false);
      }
    }, 1000);
  }

  function penaltyHint(){
    S.timeLeft = clamp(S.timeLeft - LAB.config.hintPenaltySeconds, 0, 99999);
    renderHud();
  }

  function confetti(){
    const colors = ["#f2c14e","#53d18a","#6bb7ff","#b79cff","#ff5d5d","#ffffff"];
    for(let i=0;i<90;i++){
      const d = document.createElement("div");
      d.className = "confetti";
      const size = 6 + Math.random()*10;
      d.style.left = (Math.random()*100) + "vw";
      d.style.width = size + "px";
      d.style.height = size + "px";
      d.style.background = colors[Math.floor(Math.random()*colors.length)];
      d.style.animationDuration = (1.5 + Math.random()*2.2) + "s";
      d.style.animationDelay = (Math.random()*0.25) + "s";
      d.style.opacity = String(0.85);
      document.body.appendChild(d);
      d.addEventListener("animationend", () => d.remove());
    }
  }

  // ---------- build scenes ----------
  function mount(){
    app.innerHTML = `
      <section id="sceneStart" class="scene active">
        <div class="hero">
          <div class="panel">
            <div class="pad">
              <div class="tagRow">
                <span class="tag">Noir · Meta-escape room</span>
                <span class="tag">Lärande genom spel</span>
                <span class="tag">15 minuter</span>
              </div>
              <h1 class="h1">Ni ska spela en lektionsmodell.<br/>Och märka att ni gör det.</h1>
              <p class="sub">${LAB.story.coldOpen.map(l=>esc(l)).join(" ")}</p>

              <hr class="sep" />

              <div class="grid2">
                <div class="card">
                  <h3>Uppdrag</h3>
                  <p><strong>${esc(LAB.story.goal)}</strong></p>
                  <ul>
                    <li>Välj roll</li>
                    <li>Utforska tre rum (valfri ordning)</li>
                    <li>Knäck kassaskåpet</li>
                    <li>Debrief</li>
                  </ul>
                </div>
                <div class="card">
                  <h3>Det här imponerar</h3>
                  <p>Ni får både <strong>känslan</strong> av ett escape room och <strong>verktyg</strong> att bygga ett eget direkt efter.</p>
                  <div class="note" style="margin-top:10px">
                    <strong>Pro-tip:</strong> Kör på projektor. Låt laget prata högt.
                  </div>
                </div>
              </div>

              <div class="row">
                <button id="btnChooseRole" class="btn primary" type="button">Välj roll →</button>
                <button id="btnQuickStart" class="btn" type="button">Starta utan roller</button>
                <button id="btnOpenHelp" class="btn ghost" type="button">Vad är ett escape room?</button>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="pad">
              <h3 style="margin:0 0 8px">Vad ni får med er</h3>
              <div class="card">
                <ul>
                  <li><strong>Tydlighet</strong> (eleven vet vad som räknas)</li>
                  <li><strong>Tempo</strong> (mindre väntan, fler aktiva)</li>
                  <li><strong>Hjälp</strong> (hur du stöttar utan att ge svaret)</li>
                  <li><strong>Planering</strong> (börja med målet)</li>
                  <li><strong>Avslut</strong> (så det fastnar)</li>
                </ul>
              </div>
              <hr class="sep" />
              <h3 style="margin:0 0 8px">Bevislogg</h3>
              <div id="logBox" class="log" aria-label="Logg">[00:00] Labbet väntar…</div>
              <div class="row">
                <button id="btnSummarize" class="btn small" type="button" title="Sammanfatta loggen">Sammanfatta</button>
                <button id="btnFac" class="btn small" type="button" title="Spelledarvy" disabled>Spelledarvy</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sceneRoles" class="scene">
        <div class="panel">
          <div class="pad">
            <div class="tagRow">
              <span class="tag">Steg 1</span>
              <span class="tag">Roller</span>
            </div>
            <h2 style="margin:0 0 8px">Välj roll i laget</h2>
            <p class="sub">Roller gör att ett escape room blir <strong>samarbete</strong> i stället för “alla gör allt”. Välj en som känns rimlig.</p>
            <div class="choiceGrid" id="roleGrid"></div>
            <div class="row">
              <button id="btnRoleBack" class="btn" type="button">← Tillbaka</button>
            </div>
          </div>
        </div>
      </section>

      <section id="sceneMap" class="scene">
        <div class="panel">
          <div class="pad">
            <div class="tagRow">
              <span class="tag">Steg 2</span>
              <span class="tag">Utforska</span>
              <span class="tag">Valfri ordning</span>
            </div>
            <h2 style="margin:0 0 8px">Tre steg. Tre vanliga klassrumsproblem.</h2>
            <p class="sub">Välj ett steg. Lös en kort uppgift. Ni samlar ‘bevis’ (lärdomar). När alla tre är klara öppnas kassaskåpet.</p>
            <div class="map" id="roomMap"></div>
            <hr class="sep" />
            <div class="row">
              <button id="btnGoSafe" class="btn primary" type="button" disabled>Gå till kassaskåpet →</button>
              <button id="btnRestart" class="btn danger" type="button">Starta om</button>
            </div>
          </div>
        </div>
      </section>

      <section id="sceneRoom" class="scene">
        <div class="panel">
          <div class="pad">
            <div class="tagRow">
              <span class="tag">Rum</span>
              <span id="roomTag" class="tag">—</span>
            </div>
            <div class="workbench">
              <div>
                <h2 id="roomTitle" style="margin:0 0 8px">—</h2>
                <p id="roomDesc" class="sub">—</p>

                <div id="puzzleMount" class="puzzle"></div>

                <div class="row">
                  <button id="btnRoomHint" class="btn" type="button">Hint (−10s)</button>
                  <button id="btnRoomBack" class="btn" type="button">← Till kartan</button>
                </div>

                <div id="roomToast" class="toast" style="display:none"></div>
              </div>

              <div>
                <div class="card">
                  <h3>Det här tränar</h3>
                  <p id="roomHintText">—</p>
                </div>
                <div class="card" style="margin-top:12px">
                  <h3>Bevislogg</h3>
                  <div class="log" id="logBox2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sceneSafe" class="scene">
        <div class="panel">
          <div class="pad">
            <div class="tagRow">
              <span class="tag">Steg 3</span>
              <span class="tag">Kassaskåpet</span>
            </div>
            <h2 style="margin:0 0 8px">${esc(LAB.meta.title)}</h2>
            <p class="sub">${LAB.meta.intro.map(x=>esc(x)).join(" ")}</p>
            <div class="card">
              <p><strong>Regel:</strong> ${esc(LAB.meta.explain)}</p>
              <p class="muted" style="margin-top:8px">Det är medvetet “mätbart”: ni lär er att designval ska gå att följa upp.</p>
            </div>

            <div class="workbench" style="margin-top:12px">
              <div class="card">
                <h3>Era siffror</h3>
                <ul id="digitList" style="margin:8px 0 0; padding-left:18px; color:var(--muted)"></ul>
              </div>
              <div class="card">
                <h3>Slå koden</h3>
                <input id="safeInput" class="input" type="text" inputmode="numeric" maxlength="4" placeholder="____" aria-label="Ange fyrsiffrig kod" />
                <div class="row">
                  <button id="btnCheckSafe" class="btn primary" type="button">Öppna →</button>
                  <button id="btnSafeBack" class="btn" type="button">← Till kartan</button>
                </div>
                <div id="safeToast" class="toast" style="display:none"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sceneWin" class="scene">
        <div class="panel">
          <div class="pad">
            <div class="tagRow">
              <span class="tag">CASE LÖST</span>
              <span class="tag">Debrief</span>
            </div>
            <h1 class="h1" style="font-size:38px">Engagemanget är tillbaka.</h1>
            <p class="sub">Ni spelade ett mini-escape room om… hur man bygger mini-escape rooms som faktiskt lär ut.</p>

            <div class="grid2" style="margin-top:12px">
              <div class="card">
                <h3>Takeaways</h3>
                <ul>${LAB.debrief.takeaway.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
              </div>
              <div class="card">
                <h3>Diskussionsfrågor</h3>
                <ol style="margin:8px 0 0; padding-left:18px; color:var(--muted)">
                  ${LAB.debrief.questions.map(x=>`<li style="margin:6px 0">${esc(x)}</li>`).join("")}
                </ol>
              </div>
            </div>

            <div id="designerBonus" class="card" style="margin-top:12px; display:none">
              <h3>Bygg i morgon (snabbmall)</h3>
              <ol style="margin:8px 0 0; padding-left:18px; color:var(--muted)">
                ${LAB.debrief.buildTomorrowTemplate.map(x=>`<li style="margin:6px 0">${esc(x)}</li>`).join("")}
              </ol>
            </div>

            <div class="row">
              <button id="btnPlayAgain" class="btn primary" type="button">Spela igen</button>
              <button id="btnBackToMap" class="btn" type="button">Till kartan</button>
            </div>
          </div>
        </div>
      </section>

      <section id="sceneLose" class="scene">
        <div class="panel">
          <div class="pad">
            <div class="tagRow">
              <span class="tag">TIDEN SLUT</span>
              <span class="tag">Men lärandet lever</span>
            </div>
            <h1 class="h1" style="font-size:36px">Ni hann inte öppna kassaskåpet.</h1>
            <p class="sub">Bra. Nu har ni ett äkta klassrumsproblem: tidsramar. Ta 3 minuter debrief ändå – då var det värt det.</p>
            <div class="grid2" style="margin-top:12px">
              <div class="card">
                <h3>Snabb-debrief</h3>
                <ol style="margin:8px 0 0; padding-left:18px; color:var(--muted)">
                  <li>Vad fastnade ni på – och varför?</li>
                  <li>Vilken hint hade ni behövt?</li>
                  <li>Vad tar ni med er till nästa lektion?</li>
                </ol>
              </div>
              <div class="card">
                <h3>Tips</h3>
                <ul style="margin:8px 0 0; padding-left:18px; color:var(--muted)">
                  <li>Skala ner: 1 mål, 1 pussel, 1 kod.</li>
                  <li>Playtesta med en kollega i 5 min.</li>
                  <li>Gör framsteg synligt (delmål).</li>
                </ul>
              </div>
            </div>
            <div class="row">
              <button id="btnTryAgain" class="btn primary" type="button">Försök igen</button>
              <button id="btnBackStart" class="btn" type="button">Till start</button>
            </div>
          </div>
        </div>
      </section>
    `;

    // wire buttons
    $("#btnChooseRole").addEventListener("click", () => setScene("sceneRoles"));
    $("#btnQuickStart").addEventListener("click", () => begin(null));
    $("#btnOpenHelp").addEventListener("click", () => $("#dlgHelp").showModal());

    $("#btnRoleBack").addEventListener("click", () => setScene("sceneStart"));

    $("#btnRestart").addEventListener("click", () => resetAll(true));
    $("#btnGoSafe").addEventListener("click", () => openSafe());

    $("#btnRoomBack").addEventListener("click", () => setScene("sceneMap"));

    $("#btnSafeBack").addEventListener("click", () => setScene("sceneMap"));
    $("#btnCheckSafe").addEventListener("click", () => checkSafe());

    $("#btnPlayAgain").addEventListener("click", () => resetAll(true));
    $("#btnTryAgain").addEventListener("click", () => resetAll(true));
    $("#btnBackStart").addEventListener("click", () => resetAll(false));
    $("#btnBackToMap").addEventListener("click", () => setScene("sceneMap"));

    $("#btnSummarize").addEventListener("click", () => summarizeLog());
    $("#btnFac").addEventListener("click", () => openFac());

    // role grid
    const grid = $("#roleGrid");
    grid.innerHTML = LAB.roles.map(r => `
      <div class="choice" role="button" tabindex="0" data-role="${esc(r.id)}">
        <strong>${esc(r.name)}</strong>
        <span>${esc(r.blurb)}</span>
        <div class="tagRow" style="margin-top:10px">
          <span class="tag">Perk</span>
          <span class="tag">${esc(r.perk)}</span>
        </div>
      </div>
    `).join("");

    $$(".choice", grid).forEach(el => {
      const pick = () => begin(el.getAttribute("data-role"));
      el.addEventListener("click", pick);
      el.addEventListener("keydown", (e) => { if (e.key==="Enter" || e.key===" ") { e.preventDefault(); pick(); } });
    });

    // map
    renderMap();

    // sync log
    syncLogBoxes();
  }

  function syncLogBoxes(){
    const l = S.log.join("\n");
    const a = $("#logBox");
    const b = $("#logBox2");
    if (a) a.textContent = l || "[00:00] Labbet väntar…";
    if (b) b.textContent = l || "[00:00] Labbet väntar…";
  }

  function summarizeLog(){
    // lightweight “summary” without AI: just last 5 key lines + counts
    const last = S.log.slice(-6);
    const solved = Object.keys(S.roomSolved).length;
    const hints = Object.values(S.roomHintsUsed).reduce((a,b)=>a+(b||0),0);
    addLog(`Sammanfattning: ${solved}/3 rum lösta, hints: ${hints}, bevis: ${S.evidence}/${S.evidenceMax}.`);
    last.forEach(l => addLog("↳ " + l.replace(/^\[\d\d:\d\d\]\s*/, "")));
    syncLogBoxes();
  }

  // ---------- game flow ----------
  function begin(roleId){
    S.started = true;
    S.role = roleId;
    addLog(roleId ? `Roll vald: ${roleName(roleId)}.` : "Start utan roller.");
    addLog("Mål: 6 bevis. Tre rum. En kod.");
    if (roleId === "facilitator"){
      $("#btnFac").disabled = false;
      addLog("Spelledare: du kan öppna Spelledarvy när som helst.");
    }
    if (roleId === "logician"){
      addLog("Logiker-perk: en extra tänk-hint utan tidsstraff (används automatiskt vid första hint).");
    }
    if (roleId === "communicator"){
      addLog("Kommunikatör-perk: 'Sammanfatta' är extra användbar vid kaos.");
    }
    if (roleId === "designer"){
      // show at win
      const d = $("#designerBonus");
      if (d) d.style.display = "block";
      addLog("Designer-perk: du får byggmall i debrief.");
    }

    syncLogBoxes();
    setScene("sceneMap");
    renderHud();
    startTimer();
  }

  function resetAll(toMap){
    clearInterval(S.timerRef);
    Object.assign(S, {
      started:false, over:false, role:null,
      timeLeft: LAB.config.durationSeconds,
      evidence: 0,
      roomSolved: {},
      roomHintsUsed: {},
      studioMissteps: 0,
      archiveBadChosen: [],
      log: ["[00:00] Labbet väntar…"]
    });
    renderHud();
    mount();
    if (toMap){
      begin(null);
    } else {
      setScene("sceneStart");
    }
  }

  function endGame(won){
    S.over = true;
    clearInterval(S.timerRef);
    renderHud();
    if (won){
      sound.beep("win");
      confetti();
      setScene("sceneWin");
    } else {
      sound.beep("bad");
      setScene("sceneLose");
    }
  }

  // ---------- map ----------
  function renderMap(){
    const map = $("#roomMap");
    if (!map) return;

    map.innerHTML = LAB.rooms.map(r => {
      const solved = !!S.roomSolved[r.id];
      const state = solved ? "Löst" : "Oöppnat";
      const cls = solved ? "room solved" : "room";
      return `
        <div class="${cls}" role="button" tabindex="0" data-room="${esc(r.id)}">
          <div class="rTop">
            <div>
              <div class="rName">${esc(r.icon)} ${esc(r.title)}</div>
              <div class="rHint">${esc(r.hint)}</div>
            </div>
          </div>
          <div class="rDesc">${esc(r.desc)}</div>
          <div class="rState">${esc(state)}</div>
        </div>
      `;
    }).join("");

    $$(".room", map).forEach(el => {
      const go = () => openRoom(el.getAttribute("data-room"));
      el.addEventListener("click", go);
      el.addEventListener("keydown", (e) => { if (e.key==="Enter" || e.key===" ") { e.preventDefault(); go(); } });
    });

    // Safe button enabled only when all rooms solved
    const allSolved = LAB.rooms.every(r => S.roomSolved[r.id]);
    $("#btnGoSafe").disabled = !allSolved;
  }

  function openRoom(roomId){
    const r = LAB.rooms.find(x=>x.id===roomId);
    if (!r) return;
    setScene("sceneRoom");
    $("#roomTag").textContent = r.title.toUpperCase();
    $("#roomTitle").textContent = `${r.icon} ${r.title}`;
    $("#roomDesc").textContent = r.desc;
    $("#roomHintText").textContent = r.hint;

    const toast = $("#roomToast");
    toast.style.display = "none";
    toast.className = "toast";

    // mirror log
    syncLogBoxes();

    // hint button
    $("#btnRoomHint").onclick = () => showHint(r);

    // render puzzle
    renderPuzzle(r);
  }

  function toastRoom(kind, msg){
    const t = $("#roomToast");
    t.style.display = "block";
    t.className = "toast " + kind;
    t.textContent = msg;
  }

  function showHint(room){
    S.roomHintsUsed[room.id] = (S.roomHintsUsed[room.id] || 0) + 1;

    // Logician perk: first hint has no time penalty
    const isFree = (S.role === "logician" && S.roomHintsUsed[room.id] === 1);
    if (!isFree) penaltyHint();

    addLog(`${room.title}: Hint användes${isFree ? " (gratis perk)" : ""}.`);
    sound.beep("tick");
    toastRoom("hint", room.puzzle.hintCopy || "Tänk: börja med vad som räknas som framsteg.");

    syncLogBoxes();
  }

  function award(room){
    if (S.roomSolved[room.id]) return;
    S.roomSolved[room.id] = true;

    // evidence
    S.evidence = clamp(S.evidence + room.evidenceEarned, 0, S.evidenceMax);
    addLog(`✅ ${room.title} löst. Bevis +${room.evidenceEarned} (totalt ${S.evidence}/${S.evidenceMax}).`);
    sound.beep("ok");

    renderHud();
    renderMap();
    syncLogBoxes();

    // auto-return to map with a tiny delay (feels like a “door”)
    setTimeout(() => setScene("sceneMap"), 650);
  }

  // ---------- puzzles ----------
  function renderPuzzle(room){
    const p = room.puzzle;
    const mount = $("#puzzleMount");
    mount.innerHTML = "";

    const head = document.createElement("div");
    head.className = "card";
    head.innerHTML = `<h3>Pussel</h3><p>${esc(p.prompt)}</p>`;
    mount.appendChild(head);

    if (p.type === "matrix"){
      const box = document.createElement("div");
      box.className = "card";
      box.innerHTML = `
        <div class="muted" style="font-family:var(--mono); font-size:12px; letter-spacing:.12em; text-transform:uppercase">Markera tre</div>
        <div id="mxList" class="choiceGrid" style="grid-template-columns:1fr; margin-top:10px"></div>
        <div class="row">
          <button id="btnMxCheck" class="btn primary" type="button">Lås upp →</button>
        </div>
      `;
      mount.appendChild(box);

      const list = $("#mxList", box);
      list.innerHTML = p.options.map(o => `
        <label class="choice" style="display:flex; gap:10px; align-items:flex-start">
          <input type="checkbox" data-opt="${esc(o.id)}" style="margin-top:3px; transform:scale(1.15)" />
          <div>
            <strong style="font-size:14px">${esc(o.text)}</strong>
            <span style="display:block; margin-top:4px">${o.bad ? "⚠️ Risk: frustration/meningslöshet" : "✅ Stödjer lärande"}</span>
          </div>
        </label>
      `).join("");

      // limit selection to 3
      list.addEventListener("change", () => {
        const checked = $$("input[type=checkbox]:checked", list);
        if (checked.length > 3){
          checked[checked.length-1].checked = false;
          toastRoom("bad","Välj max tre.");
          sound.beep("bad");
        } else {
          toastRoom("",""); $("#roomToast").style.display = "none";
        }
      });

      $("#btnMxCheck", box).addEventListener("click", () => {
        const picked = $$("input[type=checkbox]:checked", list).map(i=>i.getAttribute("data-opt"));
        if (picked.length !== 3){
          toastRoom("bad","Du måste markera exakt tre.");
          sound.beep("bad");
          return;
        }
        // correct = all are the bad ones
        const ok = sameSet(picked, p.correctBad);
        if (ok){
          // meta variable: how many good principles exist is fixed 3; store chosen bad for transparency
          S.archiveBadChosen = picked.slice();
          S.archiveGoodCount = p.options.filter(x=>!x.bad).length; // should be 3
          toastRoom("ok", p.successCopy[0]);
          addLog(p.successCopy[1]);
          award(room);
        } else {
          toastRoom("bad", p.failCopy);
          sound.beep("bad");
          addLog(`${room.title}: Fel urval. Försök igen.`);
          syncLogBoxes();
        }
      });

    } else if (p.type === "routing"){
      const box = document.createElement("div");
      box.className = "card";
      box.innerHTML = `
        <div class="choiceGrid" id="rtGrid"></div>
        <div class="row"><button id="btnRtBack" class="btn" type="button">Jag vill tänka om</button></div>
      `;
      mount.appendChild(box);

      const grid = $("#rtGrid", box);
      grid.innerHTML = p.choices.map(c => `
        <div class="choice" role="button" tabindex="0" data-choice="${esc(c.id)}">
          <strong>${esc(c.title)}</strong>
          <span>${esc(c.text)}</span>
        </div>
      `).join("");

      const pick = (id) => {
        const choice = p.choices.find(x=>x.id===id);
        if (!choice) return;
        if (choice.correct){
          toastRoom("ok", p.successCopy[0]);
          addLog(p.successCopy[1]);
          award(room);
        } else {
          S.studioMissteps += 1;
          toastRoom("bad", p.failCopy + ` (Felval: ${S.studioMissteps})`);
          sound.beep("bad");
          addLog(`${room.title}: Fel plan vald. Felval++ (${S.studioMissteps}).`);
          syncLogBoxes();
        }
      };

      $$(".choice", grid).forEach(el => {
        const go = () => pick(el.getAttribute("data-choice"));
        el.addEventListener("click", go);
        el.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); go(); }});
      });

      $("#btnRtBack", box).addEventListener("click", () => {
        toastRoom("",""); $("#roomToast").style.display="none";
      });

    } else if (p.type === "match"){
      const box = document.createElement("div");
      box.className = "card";
      box.innerHTML = `
        <div class="muted" style="font-family:var(--mono); font-size:12px; letter-spacing:.12em; text-transform:uppercase">Matcha</div>
        <div id="mtList" style="display:grid; gap:10px; margin-top:10px"></div>
        <div class="row"><button id="btnMtCheck" class="btn primary" type="button">Lås upp →</button></div>
      `;
      mount.appendChild(box);

      const list = $("#mtList", box);
      list.innerHTML = p.goals.map(g => `
        <div class="choice" style="cursor:default">
          <strong>${esc(g.text)}</strong>
          <div style="margin-top:8px">
            <select class="input" data-goal="${esc(g.id)}" aria-label="Välj mekanik för ${esc(g.text)}">
              <option value="">Välj mekanik…</option>
              ${p.mechanics.map(m => `<option value="${esc(m.id)}">${esc(m.text)}</option>`).join("")}
            </select>
          </div>
        </div>
      `).join("");

      $("#btnMtCheck", box).addEventListener("click", () => {
        const sels = $$("select", list);
        if (sels.some(s=>!s.value)){
          toastRoom("bad","Välj mekanik för alla tre.");
          sound.beep("bad");
          return;
        }
        let ok = 0;
        sels.forEach(s => {
          const gid = s.getAttribute("data-goal");
          if (p.correct[gid] === s.value) ok++;
        });
        if (ok === sels.length){
          toastRoom("ok", p.successCopy[0]);
          addLog(p.successCopy[1]);
          award(room);
        } else {
          toastRoom("bad", `${p.failCopy} (${ok}/${sels.length} rätt)`);
          sound.beep("bad");
          addLog(`${room.title}: ${ok}/${sels.length} rätt matchningar. Försök igen.`);
          syncLogBoxes();
        }
      });
    }

    // if already solved, disable
    if (S.roomSolved[room.id]){
      const t = document.createElement("div");
      t.className = "toast ok";
      t.textContent = "Det här rummet är redan löst. Bra jobbat.";
      mount.appendChild(t);
      $("#btnRoomHint").disabled = true;
    } else {
      $("#btnRoomHint").disabled = false;
    }
  }

  function sameSet(a,b){
    if (a.length !== b.length) return false;
    const sa = new Set(a), sb = new Set(b);
    for(const x of sa) if(!sb.has(x)) return false;
    return true;
  }

  // ---------- safe ----------
  function openSafe(){
    // ensure digits computed and shown
    const list = $("#digitList");
    list.innerHTML = "";

    const digits = computeDigits();
    digits.forEach(d => {
      list.innerHTML += `<li><strong>${esc(d.label)}:</strong> <span style="font-family:var(--mono)">${esc(String(d.value))}</span></li>`;
    });

    $("#safeToast").style.display = "none";
    $("#safeToast").className = "toast";
    $("#safeInput").value = "";
    $("#safeInput").focus();

    addLog("🔐 Kassaskåpet: dags att använda hur ni spelade som kod.");
    syncLogBoxes();
    setScene("sceneSafe");
  }

  function computeDigits(){
    // d2: good principles in archive (3) — derived from data or from solve
    const archive = LAB.rooms.find(r=>r.id==="archive");
    const archiveGoodCount = archive?.puzzle?.options?.filter(x=>!x.bad).length ?? 3;

    // d3: rooms solved without using hint
    let noHintRooms = 0;
    LAB.rooms.forEach(r => {
      if (S.roomSolved[r.id] && (S.roomHintsUsed[r.id] || 0) === 0) noHintRooms++;
    });

    // d4: missteps in studio (cap at 9)
    const studioMissteps = clamp(S.studioMissteps, 0, 9);

    const digits = [
      { label: "Antal barriärer", value: 3 },
      { label: "Bra principer (Arkivet)", value: archiveGoodCount },
      { label: "Rum lösta utan hint", value: noHintRooms },
      { label: "Felval i Studion", value: studioMissteps }
    ];
    return digits;
  }

  function expectedCode(){
    const d = computeDigits().map(x=>String(x.value));
    return d.join("").slice(0,4);
  }

  function checkSafe(){
    const input = ($("#safeInput").value || "").replace(/\D/g,"").slice(0,4);
    const need = expectedCode();

    const t = $("#safeToast");
    t.style.display = "block";

    if (input.length !== 4){
      t.className = "toast bad";
      t.textContent = "Ange exakt 4 siffror.";
      sound.beep("bad");
      return;
    }

    if (input === need){
      t.className = "toast ok";
      t.textContent = "✅ Kassaskåpet öppnas. Inuti: en lapp — 'Begin with goals.'";
      addLog("✅ Kassaskåpet öppnat. Fall löst.");
      syncLogBoxes();
      endGame(true);
    } else {
      t.className = "toast bad";
      t.textContent = "Fel kod. Tipset: skriv siffrorna i ordning som listan visar.";
      sound.beep("bad");
      addLog("Kassaskåpet: fel kod. Justera siffrorna.");
      syncLogBoxes();
    }
  }

  function roleName(id){
    return (LAB.roles.find(r=>r.id===id)?.name) || id;
  }

  // ---------- init ----------
  mount();
  renderHud();

  // keyboard niceties
  document.addEventListener("keydown", (e) => {
    // If in dialogs, let native handle
    if (document.querySelector("dialog[open]")) return;

    const active = $(".scene.active", app)?.id;
    if (active === "sceneStart" && e.key === "Enter"){
      $("#btnChooseRole").click();
    }
    if (active === "sceneSafe" && e.key === "Enter"){
      $("#btnCheckSafe").click();
    }
  });

})();
