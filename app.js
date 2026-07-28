
// BuzzArena v3 — by twagirumukiza
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const views = ['homeView','lobbyView','gameView','resultsView'];
  const SOUND_KEY='ba_sound_enabled_v1';
  const savedSound=localStorage.getItem(SOUND_KEY);
  const state = { db:null, roomCode:null, playerId:null, playerName:null, isHost:false, room:null, currentTimer:null, sound:savedSound===null?true:savedSound==='1', localMode:false, timerFlags:{} };
  const els = Object.fromEntries(['homeView','lobbyView','gameView','resultsView','createName','joinName','topicSelect','timerRange','timerValue','roomCodeInput','createRoomBtn','joinRoomBtn','roomCodeLabel','roomMeta','playersList','copyLinkBtn','startGameBtn','waitingText','roundLabel','questionCounter','myScore','multiplierBanner','timerRing','timerText','questionText','answersText','buzzers','answerStatus','correctAnswerLabel','questionRanking','nextProgress','soundToggle','presenterToggle','modal','modalCard','modalIcon','modalTitle','modalText','modalBtn','toast','audioBuzz','audioTick','audioAmbient','audioTimeEnd','audioVictory'].map(id=>[id,$('#'+id)]));

  Presenter.setSoundEnabled(state.sound);
  Presenter.setHooks({ fanfare:()=>play(els.audioTimeEnd), victory:()=>{stop(els.audioAmbient); play(els.audioVictory);} });
  function syncToggleIcons(){
    els.soundToggle.textContent=state.sound?'🔊':'🔇'; els.soundToggle.classList.toggle('off',!state.sound);
    els.presenterToggle.textContent='🎙️'; els.presenterToggle.classList.toggle('off',!Presenter.isEnabled());
  }

  function showView(id){ views.forEach(v=>els[v].classList.toggle('active',v===id)); }
  function toast(msg){ els.toast.textContent=msg; els.toast.classList.remove('hidden'); setTimeout(()=>els.toast.classList.add('hidden'),2200); }
  function randomCode(){ return Math.random().toString(36).slice(2,8).toUpperCase(); }
  function randomId(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
  function topicName(v){ return ({general:'Culture générale',contemporary:'Culture contemporaine',history:'Histoire',cinema:'7ᵉ Art (Films & Séries cultes)'})[v]||v; }
  function isFirebaseReady(){ return FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.databaseURL; }
  function play(audio, restart=true){ if(!state.sound) return; try{ if(restart) audio.currentTime=0; audio.play().catch(()=>{}); }catch{} }
  function stop(audio){ try{audio.pause();audio.currentTime=0}catch{} }

  function initBackend(){
    if(isFirebaseReady()){
      firebase.initializeApp(FIREBASE_CONFIG); state.db=firebase.database();
    } else { state.localMode=true; console.warn('Mode démonstration local : configurez Firebase pour le multijoueur en ligne.'); }
  }

  els.timerRange.addEventListener('input',()=>els.timerValue.textContent=`${els.timerRange.value} s`);
  els.soundToggle.addEventListener('click',()=>{ state.sound=!state.sound; localStorage.setItem(SOUND_KEY,state.sound?'1':'0'); Presenter.setSoundEnabled(state.sound); syncToggleIcons(); if(!state.sound) [els.audioTick,els.audioAmbient].forEach(stop); else if(state.room?.phase!=='lobby') play(els.audioAmbient,false); });
  els.presenterToggle.addEventListener('click',()=>{ Presenter.setEnabled(!Presenter.isEnabled()); syncToggleIcons(); toast(Presenter.isEnabled()?'Présentateur TV activé':'Présentateur TV désactivé'); });
  els.copyLinkBtn.addEventListener('click',async()=>{ const link=`${location.origin}${location.pathname}?room=${state.roomCode}`; await navigator.clipboard.writeText(link); toast('Lien du salon copié'); });
  els.modalBtn.addEventListener('click',()=>{ els.modal.classList.add('hidden'); els.modalCard.classList.remove('champion-reveal'); });

  els.createRoomBtn.addEventListener('click', async()=>{
    const name=els.createName.value.trim(); if(!name) return toast('Saisissez votre pseudo');
    state.playerName=name; state.playerId=randomId(); state.isHost=true; state.roomCode=randomCode();
    const room={code:state.roomCode,hostId:state.playerId,topic:els.topicSelect.value,duration:+els.timerRange.value,phase:'lobby',round:0,questionIndex:-1,players:{[state.playerId]:{name,score:0,connected:true}},createdAt:Date.now()};
    if(state.localMode){ state.room=room; renderLobby(); showView('lobbyView'); }
    else { await state.db.ref(`rooms/${state.roomCode}`).set(room); subscribeRoom(); }
    history.replaceState(null,'',`?room=${state.roomCode}`);
  });

  els.joinRoomBtn.addEventListener('click', async()=>{
    const name=els.joinName.value.trim(), code=els.roomCodeInput.value.trim().toUpperCase();
    if(!name||!code) return toast('Saisissez votre pseudo et le code');
    if(state.localMode) return toast('Configurez Firebase pour rejoindre un salon en ligne');
    const snap=await state.db.ref(`rooms/${code}`).once('value'); if(!snap.exists()) return toast('Salon introuvable');
    const room=snap.val(); if(room.phase!=='lobby') return toast('La partie a déjà commencé');
    state.playerName=name; state.playerId=randomId(); state.roomCode=code; state.isHost=false;
    await state.db.ref(`rooms/${code}/players/${state.playerId}`).set({name,score:0,connected:true}); subscribeRoom();
  });

  function subscribeRoom(){
    state.db.ref(`rooms/${state.roomCode}`).on('value',snap=>{
      if(!snap.exists()) return toast('Le salon a été fermé');
      const prev=state.room; state.room=snap.val();
      routeRoom(prev,state.room);
    });
  }

  function routeRoom(prev,room){
    if(room.phase==='lobby'){ renderLobby(); showView('lobbyView'); return; }
    if(room.phase==='question'){
      const isFreshQuestion=!prev || prev.phase!=='question' || prev.questionIndex!==room.questionIndex || prev.round!==room.round;
      if(isFreshQuestion){
        if(prev && prev.phase==='lobby'){
          const names=Object.values(room.players||{}).map(p=>p.name);
          Presenter.say(Presenter.line('welcome',state.roomCode,{n:names.length}),{holdMs:3400});
          setTimeout(()=>Presenter.say(Presenter.line('theme',state.roomCode+'t',{theme:topicName(room.topic)}),{holdMs:3200}),2600);
        }
        if(prev && prev.phase==='finalists'){
          Presenter.say(Presenter.line('finalIntro',state.roomCode+'fi'),{holdMs:3400});
        }
        renderQuestion();
      }
      updateScore();
      return;
    }
    if(room.phase==='results'){
      if(!prev || prev.phase!=='results' || prev.questionIndex!==room.questionIndex) renderResults();
      return;
    }
    if(room.phase==='finalists' && (!prev || prev.phase!=='finalists')) announceFinalists();
    if(room.phase==='champion' && (!prev || prev.phase!=='champion')) announceChampion();
  }

  function renderLobby(){
    els.roomCodeLabel.textContent=state.roomCode; els.roomMeta.textContent=`${topicName(state.room.topic)} · ${state.room.duration} secondes par question`;
    els.playersList.innerHTML=''; Object.entries(state.room.players||{}).forEach(([id,p])=>{ els.playersList.insertAdjacentHTML('beforeend',`<div class="player-row"><span><span class="player-badge"></span> ${escapeHtml(p.name)} ${id===state.room.hostId?'👑':''}</span><strong>${p.score||0}</strong></div>`); });
    els.startGameBtn.classList.toggle('hidden',!state.isHost); els.waitingText.classList.toggle('hidden',state.isHost);
  }

  els.startGameBtn.addEventListener('click',async()=>{
    const players=Object.keys(state.room.players||{}); if(players.length<2 && !state.localMode) return toast('Il faut au moins deux joueurs');
    if(state.localMode && players.length<2){ state.room.players.bot={name:'Joueur démo',score:0,connected:true}; }
    const questions=buildQuestionSet(state.room.topic,10,true);
    await patchRoom({questions,round:1,questionIndex:0,phase:'question',finalists:null,answers:null,questionStartedAt:Date.now(),questionEndAt:Date.now()+state.room.duration*1000});
  });

  async function patchRoom(data){
    if(state.localMode){ Object.assign(state.room,data); routeRoom(null,state.room); }
    else await state.db.ref(`rooms/${state.roomCode}`).update(data);
  }

  function currentQuestion(){ return state.room.questions?.[state.room.questionIndex]; }
  function eligiblePlayers(){
    const ids=Object.keys(state.room.players||{});
    return state.room.round===2 || state.room.round===3 ? ids.filter(id=>(state.room.finalists||[]).includes(id)) : ids;
  }

  function renderQuestion(){
    showView('gameView'); const q=currentQuestion(); if(!q) return;
    stop(els.audioTimeEnd); play(els.audioAmbient,false); stop(els.audioTick); play(els.audioTick,false);
    els.roundLabel.textContent=state.room.round===1?'MANCHE 1':state.room.round===2?'FINALE':'QUESTION DÉCISIVE';
    const total=state.room.round===1?10:state.room.round===2?6:1;
    els.questionCounter.textContent=`Question ${state.room.questionIndex+1} / ${total}`;
    els.questionText.textContent=q.text; els.answersText.innerHTML=q.choices.map((c,i)=>`<div class="answer-line"><strong>${'ABCD'[i]}</strong>${escapeHtml(c)}</div>`).join('');
    els.multiplierBanner.textContent=q.multiplier===3?'QUESTION TRIPLE ×3':q.multiplier===2?'QUESTION DOUBLE ×2':'BARÈME NORMAL ×1';
    els.multiplierBanner.className='multiplier-banner'+(q.multiplier===2?' double':q.multiplier===3?' triple':'');
    $$('.buzzer-btn').forEach(b=>{b.disabled=false;b.classList.remove('selected')}); els.answerStatus.textContent='Choisissez une réponse.'; updateScore(); startTimer();
    state.timerFlags={half:false,low:false};
    const seed=q.id||(state.roomCode+state.room.round+state.room.questionIndex);
    const delay=(state.room.questionIndex===0 && state.room.round===1)?5200:200;
    setTimeout(()=>{
      if(q.multiplier===3){ els.multiplierBanner.classList.add('drumroll-shake'); Presenter.say(Presenter.line('introTriple',seed),{holdMs:2600}); Presenter.drumroll(1500); setTimeout(()=>els.multiplierBanner.classList.remove('drumroll-shake'),1500); }
      else if(q.multiplier===2){ Presenter.say(Presenter.line('introDouble',seed),{holdMs:2400}); }
      else { Presenter.say(Presenter.line('introNormal',seed,{i:state.room.questionIndex+1,n:total}),{holdMs:2200}); }
    },delay);
  }

  function startTimer(){
    clearInterval(state.currentTimer); const duration=state.room.duration; const seed=(currentQuestion()?.id)||(state.roomCode+state.room.round+state.room.questionIndex);
    const tick=()=>{
      const remaining=Math.max(0,(state.room.questionEndAt-Date.now())/1000); els.timerText.textContent=Math.ceil(remaining);
      const pct=Math.max(0,remaining/duration*100); els.timerRing.style.background=`conic-gradient(var(--accent2) ${pct}%,#26334d 0)`;
      if(!state.timerFlags.half && remaining<=duration/2 && remaining>duration/2-1 && duration>10){ state.timerFlags.half=true; Presenter.say(Presenter.line('timerHalf',seed+'h'),{holdMs:1800}); }
      if(!state.timerFlags.low && remaining<=5 && remaining>4.2){ state.timerFlags.low=true; Presenter.say(Presenter.line('timerLow',seed+'l'),{holdMs:1800}); }
      if(remaining<=0){clearInterval(state.currentTimer);stop(els.audioTick);play(els.audioTimeEnd); $$('.buzzer-btn').forEach(b=>b.disabled=true); if(state.isHost) finalizeQuestion();}
    };
    tick(); state.currentTimer=setInterval(tick,200);
  }

  els.buzzers.addEventListener('click',async e=>{
    const btn=e.target.closest('.buzzer-btn'); if(!btn||btn.disabled) return;
    if(!eligiblePlayers().includes(state.playerId)) return toast('Vous êtes spectateur de cette manche');
    const choice=+btn.dataset.choice; $$('.buzzer-btn').forEach(b=>b.disabled=true); btn.classList.add('selected'); els.answerStatus.textContent='Réponse enregistrée'; play(els.audioBuzz);
    const answer={choice,submittedAt:Date.now()};
    if(state.localMode){ state.room.answers=state.room.answers||{}; state.room.answers[state.playerId]=answer; setTimeout(()=>{state.room.answers.bot={choice:Math.floor(Math.random()*4),submittedAt:Date.now()+300}; if(state.isHost) finalizeQuestion();},600); }
    else await state.db.ref(`rooms/${state.roomCode}/answers/${state.playerId}`).set({...answer,submittedAt:firebase.database.ServerValue.TIMESTAMP});
  });

  async function finalizeQuestion(){
    if(state.room.phase!=='question') return;
    if(!state.localMode){ const snap=await state.db.ref(`rooms/${state.roomCode}`).once('value'); state.room=snap.val(); }
    const q=currentQuestion(), answers=state.room.answers||{}, players=state.room.players||{}, started=state.room.questionStartedAt, duration=state.room.duration*1000;
    const ranking=eligiblePlayers().map(id=>{ const a=answers[id]; const correct=!!a&&a.choice===q.correct; const elapsed=a?Math.max(0,a.submittedAt-started):duration; const points=correct?Math.round((1000+500*Math.max(0,1-elapsed/duration))*q.multiplier):0; return {id,name:players[id].name,correct,elapsed,points}; }).sort((a,b)=>b.correct-a.correct || a.elapsed-b.elapsed);
    const updates={phase:'results',resultRanking:ranking}; ranking.forEach(r=>{ updates[`players/${r.id}/score`]=(players[r.id].score||0)+r.points; });
    if(state.localMode){ ranking.forEach(r=>state.room.players[r.id].score=updates[`players/${r.id}/score`]); Object.assign(state.room,{phase:'results',resultRanking:ranking}); routeRoom(null,state.room); }
    else await state.db.ref(`rooms/${state.roomCode}`).update(updates);
  }

  function renderResults(){
    clearInterval(state.currentTimer); stop(els.audioTick); showView('resultsView'); const q=currentQuestion(); els.correctAnswerLabel.textContent=`Bonne réponse : ${'ABCD'[q.correct]} — ${q.choices[q.correct]}`;
    els.questionRanking.innerHTML=(state.room.resultRanking||[]).map((r,i)=>`<div class="rank-row ${r.correct?'correct':'wrong'}"><strong>${i+1}</strong><span>${escapeHtml(r.name)} ${r.correct?'✓':'✕'}</span><strong>+${r.points}</strong></div>`).join('');
    els.nextProgress.style.width='0'; requestAnimationFrame(()=>{els.nextProgress.style.transition='width 4s linear';els.nextProgress.style.width='100%'});
    presentAnalysis();
    if(state.isHost) setTimeout(advanceGame,4200);
  }

  function totalQuestionsRemaining(){ const total=state.room.round===1?10:state.room.round===2?6:1; return total-(state.room.questionIndex+1); }

  function computeAnalysis(){
    const players=state.room.players||{}, ranking=state.room.resultRanking||[];
    const prevScores={};
    Object.keys(players).forEach(id=>{ const entry=ranking.find(r=>r.id===id); prevScores[id]=(players[id].score||0)-(entry?entry.points:0); });
    const prevOrder=Object.keys(players).sort((a,b)=>prevScores[b]-prevScores[a]);
    const newOrder=Object.keys(players).sort((a,b)=>(players[b].score||0)-(players[a].score||0));
    const prevLeader=prevOrder[0], newLeader=newOrder[0];
    let comebackId=null, bestJump=0;
    newOrder.forEach((id,i)=>{ const prevIdx=prevOrder.indexOf(id); const jump=prevIdx-i; if(jump>bestJump){bestJump=jump;comebackId=id;} });
    const fastestCorrect=[...ranking].filter(r=>r.correct).sort((a,b)=>a.elapsed-b.elapsed)[0];
    const top2=newOrder.slice(0,2); const gap=top2.length===2?Math.abs((players[top2[0]].score||0)-(players[top2[1]].score||0)):9999;
    const leaderChanged=prevLeader!==newLeader && (players[newLeader].score||0)>0 && newOrder.length>1;
    return {leaderChanged,newLeader,comebackId,bestJump,fastestCorrect,gapClose:gap<=500,ranking};
  }

  function presentAnalysis(){
    const a=computeAnalysis(), q=currentQuestion(), seed=(q.id||'')+'-a', lines=[];
    if(a.fastestCorrect && a.fastestCorrect.elapsed<3500){ lines.push(Presenter.line('fastReflex',seed+'r',{name:a.fastestCorrect.name,s:(a.fastestCorrect.elapsed/1000).toFixed(1)})); }
    if(a.leaderChanged){ lines.push(Presenter.line('newLeader',seed+'n',{name:state.room.players[a.newLeader].name})); }
    else if(a.comebackId && a.bestJump>=2){ lines.push(Presenter.line('comeback',seed+'c',{name:state.room.players[a.comebackId].name})); }
    else { const allWrong=!a.ranking.some(r=>r.correct); lines.push(allWrong?Presenter.line('allWrong',seed+'w'):Presenter.line('generic',seed+'g')); }
    const remaining=totalQuestionsRemaining();
    if(a.gapClose && remaining>0 && remaining<=2){ lines.push(Presenter.line('closeFinish',seed+'f',{n:remaining})); }
    lines.slice(0,2).forEach((t,i)=>setTimeout(()=>Presenter.say(t,{holdMs:2600}),i*2700));
  }

  async function advanceGame(){
    const r=state.room.round, i=state.room.questionIndex;
    if((r===1&&i<9)||(r===2&&i<5)) return patchRoom({questionIndex:i+1,phase:'question',answers:null,resultRanking:null,questionStartedAt:Date.now(),questionEndAt:Date.now()+state.room.duration*1000});
    if(r===1){
      const sorted=Object.entries(state.room.players).sort((a,b)=>(b[1].score||0)-(a[1].score||0)); const finalists=sorted.slice(0,2).map(x=>x[0]);
      await patchRoom({phase:'finalists',finalists}); if(state.isHost) setTimeout(()=>startFinal(),3500); return;
    }
    const finalists=state.room.finalists; const p=state.room.players; const s1=p[finalists[0]].score||0,s2=p[finalists[1]].score||0;
    if(s1===s2){ const questions=buildQuestionSet(state.room.topic,1,false); return patchRoom({questions,round:3,questionIndex:0,phase:'question',answers:null,resultRanking:null,questionStartedAt:Date.now(),questionEndAt:Date.now()+state.room.duration*1000}); }
    const champion=s1>s2?finalists[0]:finalists[1]; await patchRoom({phase:'champion',champion});
  }

  function announceFinalists(){
    const [a,b]=state.room.finalists.map(id=>state.room.players[id].name);
    Presenter.say(Presenter.line('finalists',state.roomCode+'fin',{a,b}),{holdMs:3600}); Presenter.fanfare();
    showModal('⚡','Les deux finalistes',`${a} affronte ${b} dans une finale de 6 questions.`);
  }
  async function startFinal(){
    const questions=buildQuestionSet(state.room.topic,6,false); await patchRoom({questions,round:2,questionIndex:0,phase:'question',answers:null,resultRanking:null,questionStartedAt:Date.now(),questionEndAt:Date.now()+state.room.duration*1000}); }

  function announceChampion(){
    const name=state.room.players[state.room.champion].name; stop(els.audioAmbient);
    Presenter.say(Presenter.line('championBuild',state.roomCode+'cb'),{holdMs:2000});
    Presenter.drumroll(1900);
    setTimeout(()=>{
      Presenter.say(Presenter.line('championReveal',state.roomCode+'cr'),{holdMs:1700});
      Presenter.suspense(1900);
      setTimeout(()=>{
        Presenter.victory();
        Presenter.confettiBurst(3200);
        showModal('🏆','Champion de BuzzArena',`🎉 …${name} !! Félicitations, champion de BuzzArena ! 🎉`,true);
      },2000);
    },2000);
  }
  function showModal(icon,title,text,champion=false){
    els.modalIcon.textContent=icon; els.modalTitle.textContent=title; els.modalText.textContent=text;
    els.modalCard.classList.toggle('champion-reveal',!!champion); els.modal.classList.remove('hidden');
  }
  function updateScore(){ els.myScore.textContent=state.room?.players?.[state.playerId]?.score||0; }
  function escapeHtml(s=''){ return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  initBackend(); syncToggleIcons();
  const incoming=new URLSearchParams(location.search).get('room'); if(incoming){els.roomCodeInput.value=incoming.toUpperCase();els.joinName.focus();}
})();
