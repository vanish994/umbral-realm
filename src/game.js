(() => {
  const STORAGE_KEY = "umbral-realm-combat-test-v2";
  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } })();
  const state = {
    hp: Number(saved.hp ?? 100), xp: Number(saved.xp ?? 0), level: Number(saved.level ?? 1), coins: Number(saved.coins ?? 0),
    talked: Boolean(saved.talked), defeated: Boolean(saved.defeated), ammo: Number(saved.ammo ?? 7),
    knifeSharpness: Number(saved.knifeSharpness ?? 100), revolverDirt: Number(saved.revolverDirt ?? 0),
    zombieHp: Number(saved.zombieHp ?? 70), weapon: saved.weapon === "revolver" ? "revolver" : "knife"
  };
  let sceneRef, player, edrin, zombie, cursors, moveKeys, facing = "down", toastTimer, attackReady = true;
  const touch = {up:false,down:false,left:false,right:false};
  const el = id => document.getElementById(id);
  function say(message) {
    el("status").textContent = message; el("toast").textContent = message; el("toast").classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el("toast").classList.remove("show"), 2400);
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
    el("ammo-label").textContent = state.ammo + " / 7";
    el("knife-condition").textContent = "Fio " + Math.round(state.knifeSharpness) + "%";
    el("revolver-condition").textContent = "Sujeira " + Math.round(state.revolverDirt) + "%";
    el("weapon-knife").classList.toggle("selected", state.weapon === "knife");
    el("weapon-revolver").classList.toggle("selected", state.weapon === "revolver");
    el("weapon-knife").setAttribute("aria-pressed", String(state.weapon === "knife"));
    el("weapon-revolver").setAttribute("aria-pressed", String(state.weapon === "revolver"));
    const zombieAlive = !state.defeated && state.zombieHp > 0;
    el("enemy-label").textContent = zombieAlive ? "ZUMBI ERRANTE" : "ÁREA LIMPA";
    el("enemy-hp-label").textContent = zombieAlive ? Math.ceil(state.zombieHp) + " / 70" : "Derrotado";
    el("enemy-hp-bar").style.width = (zombieAlive ? Math.max(0,state.zombieHp) / 70 * 100 : 0) + "%";
    el("combat-info").textContent = state.weapon === "knife" ? "Faca • curto alcance" : "Revólver .38 • " + state.ammo + " tiros";
  }
  function saveGame() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    say("Teste salvo neste dispositivo.");
  }
  if (!window.Phaser) {
    el("game").innerHTML = '<p style="padding:20px;color:#e7dfd0">Não foi possível carregar o motor do jogo. Confira a conexão e recarregue a página.</p>';
    return;
  }
  class WorldScene extends Phaser.Scene {
    constructor(){ super("world"); }
    create(){
      sceneRef = this;
      this.cameras.main.setBackgroundColor("#18201b");
      const g = this.add.graphics();
      g.fillStyle(0x26382b); g.fillRect(0,0,960,640);
      for(let y=20;y<640;y+=32){ for(let x=16;x<960;x+=32){ const n=(x*13+y*7)%17; if(n<5){g.fillStyle(n%2?0x1d2c23:0x223127);g.fillRect(x,y,16,16);g.fillStyle(0x3a4932);g.fillRect(x+3,y+4,7,4);} else if(n===7){g.fillStyle(0x625742);g.fillRect(x+10,y+22,5,3);} } }
      g.fillStyle(0x594b3b); g.fillRect(0,270,960,74); g.fillStyle(0x6c5a43); g.fillRect(0,282,960,4); g.fillRect(0,326,960,3);
      for(let i=0;i<30;i++){const x=(i*97+31)%960,y=(i*71+43)%640;if(y>235&&y<365)continue;g.fillStyle(0x121e19);g.fillRect(x,y,24,26);g.fillStyle(i%2?0x233b2b:0x2d4430);g.fillRect(x-5,y-7,33,24);g.fillStyle(0x42543a);g.fillRect(x+3,y-3,9,5);}
      g.fillStyle(0x777064);g.fillRect(744,208,42,48);g.fillStyle(0x3b3b3c);g.fillRect(751,216,28,32);g.fillStyle(0x15191a);g.fillRect(756,224,18,24);
      this.add.text(735,190,"ABRIGO",{fontFamily:"monospace",fontSize:"10px",color:"#d6c49f",stroke:"#141719",strokeThickness:3});
      this.add.text(70,365,"TRILHA VELHA",{fontFamily:"monospace",fontSize:"10px",color:"#d6c49f",stroke:"#141719",strokeThickness:3});
      edrin=this.add.container(325,290); this.drawPerson(edrin,0x9b8a62,0x493b32);
      this.add.text(306,265,"MATEUS",{fontFamily:"monospace",fontSize:"10px",color:"#f0d7a0",stroke:"#161718",strokeThickness:3});
      player=this.add.container(470,305); this.drawPerson(player,0x667b91,0x303744);
      zombie=this.add.container(635,305); this.drawZombie(zombie);
      this.physics.world.setBounds(0,0,960,640);
      this.cameras.main.setBounds(0,0,960,640); this.cameras.main.startFollow(player,true,0.12,0.12); this.cameras.main.setZoom(Math.min(1.1, this.scale.width/390));
      cursors=this.input.keyboard.createCursorKeys(); moveKeys=this.input.keyboard.addKeys("W,A,S,D,SPACE,E");
      this.input.on("pointerdown", pointer => {
        if(pointer.event.target.closest("button")) return;
        const p=this.cameras.main.getWorldPoint(pointer.x,pointer.y);
        if(Math.hypot(p.x-player.x,p.y-player.y)>22) player.setData("tapTarget",{x:p.x,y:p.y});
      });
      updateHud();
      if(state.defeated || state.zombieHp<=0){ zombie.setVisible(false); }
    }
    drawPerson(container,cloak,skin){
      const s=this.add.graphics();s.fillStyle(0x11140f,0.45);s.fillEllipse(0,12,25,9);s.fillStyle(cloak);s.fillRect(-8,-9,16,20);s.fillStyle(skin);s.fillRect(-6,-18,12,11);s.fillStyle(0x171a20);s.fillRect(-7,-20,14,5);s.fillStyle(0xc4a46d);s.fillRect(4,-6,3,13);container.add(s);
    }
    drawZombie(container){
      const s=this.add.graphics();s.fillStyle(0x10120f,0.55);s.fillEllipse(0,13,29,9);s.fillStyle(0x52634b);s.fillRect(-10,-8,20,20);s.fillStyle(0x6b8060);s.fillRect(-8,-19,16,13);s.fillStyle(0x222a21);s.fillRect(-9,-22,18,5);s.fillStyle(0xd8c36e);s.fillRect(-5,-12,3,3);s.fillRect(3,-12,3,3);s.fillStyle(0x7e3e39);s.fillRect(5,-1,7,3);container.add(s);
      this.add.text(-42,-39,"ZUMBI",{fontFamily:"monospace",fontSize:"10px",color:"#e6c2ad",stroke:"#141719",strokeThickness:3}).setOrigin(0.5).setPosition(container.x,container.y-39);
    }
    update(_,delta){
      if(!player)return;
      let dx=0,dy=0;
      if(cursors.left.isDown||moveKeys.A.isDown||touch.left)dx=-1;else if(cursors.right.isDown||moveKeys.D.isDown||touch.right)dx=1;
      if(cursors.up.isDown||moveKeys.W.isDown||touch.up)dy=-1;else if(cursors.down.isDown||moveKeys.S.isDown||touch.down)dy=1;
      const target=player.getData("tapTarget");
      if(!dx&&!dy&&target){dx=target.x-player.x;dy=target.y-player.y;if(Math.hypot(dx,dy)<8){player.setData("tapTarget",null);dx=dy=0;}else{const l=Math.hypot(dx,dy);dx/=l;dy/=l;}}
      if(dx||dy){const len=Math.hypot(dx,dy);player.x+=dx/len*145*delta/1000;player.y+=dy/len*145*delta/1000;player.x=Phaser.Math.Clamp(player.x,25,935);player.y=Phaser.Math.Clamp(player.y,35,610);facing=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");}
      if(zombie && zombie.visible && !state.defeated && state.hp>0){
        const distance=Phaser.Math.Distance.Between(player.x,player.y,zombie.x,zombie.y);
        if(distance<185){const a=Math.atan2(player.y-zombie.y,player.x-zombie.x);if(distance>27){zombie.x+=Math.cos(a)*24*delta/1000;zombie.y+=Math.sin(a)*24*delta/1000;}else if(!this.zombieAttackAt||this.time.now>=this.zombieAttackAt){this.zombieAttackAt=this.time.now+1150;state.hp=Math.max(0,state.hp-5);updateHud();say("O zumbi acerta você: -5 de vida.");if(state.hp===0){state.hp=Math.max(1,Math.floor(maxHp()/2));player.setPosition(470,305);zombie.setPosition(635,305);say("Você recua para a trilha e recupera o fôlego.");updateHud();}}}
      }
      if(state.bleedUntil && this.time.now>=state.bleedUntil){state.bleedUntil=0;if(zombie&&zombie.visible&&!state.defeated){say("O sangramento do zumbi parou.");}}
    }
  }
  const config={type:Phaser.AUTO,parent:"game",width:390,height:520,backgroundColor:"#18201b",pixelArt:true,roundPixels:true,scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:"arcade",arcade:{debug:false}},scene:[WorldScene]};
  new Phaser.Game(config);
  function near(a,b,range=75){return a&&b&&Phaser.Math.Distance.Between(a.x,a.y,b.x,b.y)<=range;}
  function selectWeapon(weapon){state.weapon=weapon;updateHud();say(weapon==="knife"?"Faca selecionada. Aproxime-se para atacar.":"Revólver .38 selecionado. Alcance maior, munição limitada.");}
  function damageZombie(amount,source){
    if(!zombie||state.defeated||state.zombieHp<=0)return;
    state.zombieHp=Math.max(0,state.zombieHp-amount);
    if(source==="knife"){
      state.knifeSharpness=Math.max(0,state.knifeSharpness-2);
      if(state.knifeSharpness>0){state.bleedUntil=(sceneRef.time.now+3000);state.zombieHp=Math.max(0,state.zombieHp-2);say("Corte! "+amount+" de dano + sangramento.");}
      else say("A faca perdeu o fio: sem sangramento e dano reduzido.");
    }else{
      state.revolverDirt=Math.min(100,state.revolverDirt+8);
      say("Tiro do .38! "+amount+" de dano. "+state.ammo+" balas restantes.");
    }
    if(state.zombieHp<=0){
      state.defeated=true;zombie.setVisible(false);state.xp+=50;state.coins+=8;
      el("quest-text").textContent="O zumbi caiu. Explore a trilha e teste as duas armas.";
      if(state.xp>=state.level*100){state.xp-=state.level*100;state.level++;state.hp=maxHp();say("Zumbi derrotado! +50 XP, +8 ouro. Nível "+state.level+"!");}
      else say("Zumbi derrotado! +50 XP e +8 ouro.");
    }
    updateHud();
  }
  function attack(){
    if(!attackReady||state.hp<=0)return;
    if(!zombie||state.defeated||state.zombieHp<=0){say("Você já eliminou o zumbi. Recarregue o teste para recomeçar.");return;}
    const distance=Phaser.Math.Distance.Between(player.x,player.y,zombie.x,zombie.y);
    if(state.weapon==="knife"){
      if(distance>58){say("Muito longe para a faca. Aproxime-se do zumbi.");return;}
      attackReady=false;setTimeout(()=>attackReady=true,520);
      const damage=Math.max(2,Math.round(10*(state.knifeSharpness<=0?0.7:state.knifeSharpness<35?0.85:state.knifeSharpness<70?0.95:1)));
      zombie.setAlpha(.35);setTimeout(()=>zombie&&zombie.setAlpha(1),120);
      damageZombie(damage,"knife");
    }else{
      if(distance>285){say("Fora do alcance do revólver. Aproxime-se um pouco.");return;}
      if(state.ammo<=0){say("Sem munição. As sete balas iniciais acabaram.");return;}
      attackReady=false;setTimeout(()=>attackReady=true,650);state.ammo--;
      const accuracy=state.revolverDirt>=75?0.65:state.revolverDirt>=45?0.74:state.revolverDirt>=20?0.8:0.86;
      if(Math.random()>accuracy){state.revolverDirt=Math.min(100,state.revolverDirt+8);updateHud();say("O tiro errou! Sujeira do revólver: "+Math.round(state.revolverDirt)+"%.");return;}
      zombie.setAlpha(.2);setTimeout(()=>zombie&&zombie.setAlpha(1),140);
      damageZombie(27,"revolver");
    }
  }
  function interact(){
    if(near(player,edrin,85)){state.talked=true;el("quest-text").textContent="Teste as duas armas contra o zumbi da trilha.";say("Mateus: Use a faca de perto ou o .38 à distância. Só há sete balas.");}
    else if(near(player,zombie,100)&&!state.defeated){say("Um zumbi errante bloqueia a trilha. Escolha FACA ou .38 e pressione ATACAR.");}
    else say("Não há ninguém por perto para conversar.");
  }
  document.querySelectorAll("[data-dir]").forEach(button=>{
    const dir=button.dataset.dir;
    const down=e=>{e.preventDefault();touch[dir]=true;};
    const up=()=>{touch[dir]=false;};
    button.addEventListener("pointerdown",down);
    ["pointerup","pointercancel","pointerleave"].forEach(ev=>button.addEventListener(ev,up));
  });
  el("weapon-knife").addEventListener("click",()=>selectWeapon("knife"));
  el("weapon-revolver").addEventListener("click",()=>selectWeapon("revolver"));
  el("interact").addEventListener("click",interact);el("attack").addEventListener("click",attack);el("save").addEventListener("click",saveGame);
  document.addEventListener("keydown",e=>{if(e.code==="Space"){e.preventDefault();attack();}if(e.key.toLowerCase()==="e")interact();if(e.key==="1")selectWeapon("knife");if(e.key==="2")selectWeapon("revolver");});
  updateHud();
})();