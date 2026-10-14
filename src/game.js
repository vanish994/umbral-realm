(() => {
  const STORAGE_KEY = "umbral-realm-playtest-v4";
  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } })();
  const state = {
    hp: Number(saved.hp ?? 100), xp: Number(saved.xp ?? 0), level: Number(saved.level ?? 1),
    coins: Number(saved.coins ?? 0), talked: Boolean(saved.talked),
    defeated: Boolean(saved.defeated), charges: Number(saved.charges ?? 7),
    enemyHp: Number(saved.enemyHp ?? 70), action: saved.action === "far" ? "far" : "close"
  };
  let sceneRef, player, guide, enemy, cursors, moveKeys, toastTimer, actionReady = true;
  const touch = {up:false,down:false,left:false,right:false};
  const el = id => document.getElementById(id);
  function say(message) {
    el("status").textContent = message;
    el("toast").textContent = message;
    el("toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el("toast").classList.remove("show"), 2300);
  }
  function maxHp(){ return 100 + (state.level - 1) * 10; }
  function updateHud() {
    state.hp = Math.max(0, Math.min(maxHp(), state.hp));
    el("hp-label").textContent = state.hp + " / " + maxHp();
    el("hp-bar").style.width = (state.hp / maxHp() * 100) + "%";
    const next = state.level * 100;
    el("xp-label").textContent = state.xp + " / " + next + " XP";
    el("xp-bar").style.width = (state.xp / next * 100) + "%";
    el("level").textContent = "Nv. " + state.level;
    el("coins").textContent = "◈ " + state.coins;
    el("charge-label").textContent = "Energia: " + state.charges + " / 7";
    el("action-close").classList.toggle("selected", state.action === "close");
    el("action-far").classList.toggle("selected", state.action === "far");
    el("action-close").setAttribute("aria-pressed", String(state.action === "close"));
    el("action-far").setAttribute("aria-pressed", String(state.action === "far"));
    const alive = !state.defeated && state.enemyHp > 0;
    el("enemy-label").textContent = alive ? "ERRANTE" : "ÁREA SEGURA";
    el("enemy-hp-label").textContent = alive ? Math.ceil(state.enemyHp) + " / 70" : "Superado";
    el("enemy-hp-bar").style.width = (alive ? Math.max(0,state.enemyHp) / 70 * 100 : 0) + "%";
    el("combat-info").textContent = state.action === "close" ? "Ação próxima • sem custo" : "Ação distante • consome energia";
  }
  function saveGame() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); say("Progresso salvo neste dispositivo."); }
    catch { say("Não foi possível salvar neste navegador."); }
  }
  if (!window.Phaser) {
    el("game").innerHTML = '<p style="padding:20px;color:#e7dfd0">O motor do jogo não carregou. Confira a conexão e recarregue.</p>';
    return;
  }
  class WorldScene extends Phaser.Scene {
    constructor(){ super("world"); }
    create(){
      sceneRef = this;
      this.cameras.main.setBackgroundColor("#18201b");
      const g = this.add.graphics();
      g.fillStyle(0x26382b); g.fillRect(0,0,960,640);
      for(let y=20;y<640;y+=32){for(let x=16;x<960;x+=32){const n=(x*13+y*7)%17;if(n<5){g.fillStyle(n%2?0x1d2c23:0x223127);g.fillRect(x,y,16,16);g.fillStyle(0x3a4932);g.fillRect(x+3,y+4,7,4);}else if(n===7){g.fillStyle(0x625742);g.fillRect(x+10,y+22,5,3);}}}
      g.fillStyle(0x594b3b);g.fillRect(0,270,960,74);g.fillStyle(0x6c5a43);g.fillRect(0,282,960,4);g.fillRect(0,326,960,3);
      for(let i=0;i<30;i++){const x=(i*97+31)%960,y=(i*71+43)%640;if(y>235&&y<365)continue;g.fillStyle(0x121e19);g.fillRect(x,y,24,26);g.fillStyle(i%2?0x233b2b:0x2d4430);g.fillRect(x-5,y-7,33,24);g.fillStyle(0x42543a);g.fillRect(x+3,y-3,9,5);}
      g.fillStyle(0x777064);g.fillRect(744,208,42,48);g.fillStyle(0x3b3b3c);g.fillRect(751,216,28,32);g.fillStyle(0x15191a);g.fillRect(756,224,18,24);
      this.add.text(735,190,"ABRIGO",{fontFamily:"monospace",fontSize:"10px",color:"#d6c49f",stroke:"#141719",strokeThickness:3});
      this.add.text(70,365,"TRILHA VELHA",{fontFamily:"monospace",fontSize:"10px",color:"#d6c49f",stroke:"#141719",strokeThickness:3});
      guide=this.add.container(325,290);this.drawPerson(guide,0x9b8a62,0x493b32);
      this.add.text(306,265,"MATEUS",{fontFamily:"monospace",fontSize:"10px",color:"#f0d7a0",stroke:"#161718",strokeThickness:3});
      player=this.add.container(470,305);this.drawPerson(player,0x667b91,0x303744);
      enemy=this.add.container(635,305);this.drawEnemy(enemy);
      this.physics.world.setBounds(0,0,960,640);
      this.cameras.main.setBounds(0,0,960,640);this.cameras.main.startFollow(player,true,0.12,0.12);this.cameras.main.setZoom(Math.min(1.1,this.scale.width/390));
      cursors=this.input.keyboard.createCursorKeys();moveKeys=this.input.keyboard.addKeys("W,A,S,D,SPACE,E");
      this.input.on("pointerdown",pointer=>{if(pointer.event.target.closest("button"))return;const p=this.cameras.main.getWorldPoint(pointer.x,pointer.y);if(Math.hypot(p.x-player.x,p.y-player.y)>22)player.setData("tapTarget",{x:p.x,y:p.y});});
      updateHud();
      if(state.defeated||state.enemyHp<=0)enemy.setVisible(false);
    }
    drawPerson(container,coat,skin){
      const s=this.add.graphics();s.fillStyle(0x11140f,0.45);s.fillEllipse(0,12,25,9);s.fillStyle(coat);s.fillRect(-8,-9,16,20);s.fillStyle(skin);s.fillRect(-6,-18,12,11);s.fillStyle(0x171a20);s.fillRect(-7,-20,14,5);container.add(s);
    }
    drawEnemy(container){
      const s=this.add.graphics();s.fillStyle(0x10120f,0.55);s.fillEllipse(0,13,29,9);s.fillStyle(0x52634b);s.fillRect(-10,-8,20,20);s.fillStyle(0x6b8060);s.fillRect(-8,-19,16,13);s.fillStyle(0x222a21);s.fillRect(-9,-22,18,5);s.fillStyle(0xd8c36e);s.fillRect(-5,-12,3,3);s.fillRect(3,-12,3,3);s.fillStyle(0x7e3e39);s.fillRect(5,-1,7,3);container.add(s);
      this.enemyName=this.add.text(0,0,"ERRANTE",{fontFamily:"monospace",fontSize:"10px",color:"#e6c2ad",stroke:"#141719",strokeThickness:3}).setOrigin(0.5);
    }
    update(_,delta){
      if(!player)return;
      let dx=0,dy=0;
      if(cursors.left.isDown||moveKeys.A.isDown||touch.left)dx=-1;else if(cursors.right.isDown||moveKeys.D.isDown||touch.right)dx=1;
      if(cursors.up.isDown||moveKeys.W.isDown||touch.up)dy=-1;else if(cursors.down.isDown||moveKeys.S.isDown||touch.down)dy=1;
      const target=player.getData("tapTarget");
      if(!dx&&!dy&&target){dx=target.x-player.x;dy=target.y-player.y;if(Math.hypot(dx,dy)<8){player.setData("tapTarget",null);dx=dy=0;}else{const l=Math.hypot(dx,dy);dx/=l;dy/=l;}}
      if(dx||dy){const len=Math.hypot(dx,dy);player.x+=dx/len*145*delta/1000;player.y+=dy/len*145*delta/1000;player.x=Phaser.Math.Clamp(player.x,25,935);player.y=Phaser.Math.Clamp(player.y,35,610);}
      if(this.enemyName&&enemy&&enemy.visible){this.enemyName.setPosition(enemy.x,enemy.y-39);}
      if(enemy&&enemy.visible&&!state.defeated&&state.hp>0){
        const distance=Phaser.Math.Distance.Between(player.x,player.y,enemy.x,enemy.y);
        if(distance<185){const a=Math.atan2(player.y-enemy.y,player.x-enemy.x);if(distance>27){enemy.x+=Math.cos(a)*24*delta/1000;enemy.y+=Math.sin(a)*24*delta/1000;}else if(!this.enemyAttackAt||this.time.now>=this.enemyAttackAt){this.enemyAttackAt=this.time.now+1150;state.hp=Math.max(0,state.hp-5);updateHud();say("O errante atingiu você: -5 de vitalidade.");if(state.hp===0){state.hp=Math.floor(maxHp()/2);player.setPosition(470,305);enemy.setPosition(635,305);say("Você conseguiu se afastar e recuperar o fôlego.");updateHud();}}}
      }
    }
  }
  const config={type:Phaser.AUTO,parent:"game",width:390,height:520,backgroundColor:"#18201b",pixelArt:true,roundPixels:true,scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:"arcade",arcade:{debug:false}},scene:[WorldScene]};
  new Phaser.Game(config);
  function near(a,b,range=75){return a&&b&&Phaser.Math.Distance.Between(a.x,a.y,b.x,b.y)<=range;}
  function selectAction(action){state.action=action;updateHud();say(action==="close"?"Ação próxima selecionada: chegue perto do errante.":"Ação distante selecionada: consome uma carga de energia.");}
  function resolveAction(){
    if(!actionReady||state.hp<=0)return;
    if(!enemy||state.defeated||state.enemyHp<=0){say("Área segura! Você já superou o errante.");return;}
    const distance=Phaser.Math.Distance.Between(player.x,player.y,enemy.x,enemy.y);
    let damage,cooldown;
    if(state.action==="close"){
      if(distance>58){say("Você está longe demais. Aproxime-se do errante.");return;}
      damage=13;cooldown=500;
    }else{
      if(distance>285){say("O errante está longe demais até para a ação distante.");return;}
      if(state.charges<=0){say("Sua energia acabou. Use a ação próxima ou reinicie o teste.");return;}
      state.charges--;damage=24;cooldown=700;
    }
    actionReady=false;setTimeout(()=>actionReady=true,cooldown);
    state.enemyHp=Math.max(0,state.enemyHp-damage);
    enemy.setAlpha(.35);setTimeout(()=>{if(enemy)enemy.setAlpha(1);},130);
    say("Ação concluída: "+damage+" de impacto.");
    if(state.enemyHp<=0){
      state.defeated=true;enemy.setVisible(false);state.xp+=50;state.coins+=8;
      el("quest-text").textContent="Trilha segura! Explore o abrigo e teste a movimentação.";
      if(state.xp>=state.level*100){state.xp-=state.level*100;state.level++;state.hp=maxHp();say("Errante superado! +50 XP, +8 moedas. Nível "+state.level+"!");}
      else say("Errante superado! +50 XP e +8 moedas.");
    }
    updateHud();
  }
  function interact(){
    if(near(player,guide,85)){state.talked=true;el("quest-text").textContent="Supere o errante e explore a trilha.";say("Mateus: A trilha não está segura. Use as ações disponíveis e mantenha distância quando precisar.");}
    else if(near(player,enemy,100)&&!state.defeated)say("Um errante bloqueia a trilha. Escolha uma ação e pressione AGIR.");
    else say("Não há ninguém por perto para conversar.");
  }
  document.querySelectorAll("[data-dir]").forEach(button=>{
    const dir=button.dataset.dir;const down=e=>{e.preventDefault();touch[dir]=true;};const up=()=>{touch[dir]=false;};
    button.addEventListener("pointerdown",down);["pointerup","pointercancel","pointerleave"].forEach(ev=>button.addEventListener(ev,up));
  });
  el("action-close").addEventListener("click",()=>selectAction("close"));
  el("action-far").addEventListener("click",()=>selectAction("far"));
  el("interact").addEventListener("click",interact);el("attack").addEventListener("click",resolveAction);el("save").addEventListener("click",saveGame);
  document.addEventListener("keydown",e=>{if(e.code==="Space"){e.preventDefault();resolveAction();}if(e.key.toLowerCase()==="e")interact();if(e.key==="1")selectAction("close");if(e.key==="2")selectAction("far");});
  updateHud();
})();