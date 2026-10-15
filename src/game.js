(() => {
  const STORAGE_KEY = "umbral-realm-playtest-v6";
  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } })();
  const state = {
    hp: Number(saved.hp ?? 100), xp: Number(saved.xp ?? 0), level: Number(saved.level ?? 1),
    coins: Number(saved.coins ?? 0), talked: Boolean(saved.talked),
    defeated: Boolean(saved.defeated), charges: Number(saved.charges ?? 7),
    enemyHp: Number(saved.enemyHp ?? 70), action: saved.action === "far" ? "far" : "close"
  };
  let sceneRef, player, enemy, cursors, moveKeys, toastTimer, actionReady = true;
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
    el("enemy-label").textContent = alive ? "RATO ZUMBI" : "ÁREA SEGURA";
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
    preload(){
      // Spritesheets reais do personagem (8 quadros de 48x64, conforme o pack).
      this.load.spritesheet("player-idle", "./assets/characters/male/Idle/idle.png", { frameWidth: 48, frameHeight: 64 });
      this.load.spritesheet("player-walk", "./assets/characters/male/Walk/walk.png", { frameWidth: 48, frameHeight: 64 });
      this.load.spritesheet("guide-idle", "./assets/characters/female/Idle/Idle.png", { frameWidth: 48, frameHeight: 64 });
      this.load.spritesheet("guide-walk", "./assets/characters/female/Walk/walk.png", { frameWidth: 48, frameHeight: 64 });
      // A diagonal direita-baixo usa arquivos direcionais próprios, não a linha da folha combinada.
      this.load.spritesheet("player-idle-right-down", "./assets/characters/male/Idle/idle_right_down.png", { frameWidth: 48, frameHeight: 64 });
      this.load.spritesheet("player-walk-right-down", "./assets/characters/male/Walk/walk_right_down.png", { frameWidth: 48, frameHeight: 64 });
      this.load.spritesheet("guide-idle-right-down", "./assets/characters/female/Idle/Idle_Right_Down.png", { frameWidth: 48, frameHeight: 64 });
      this.load.spritesheet("guide-walk-right-down", "./assets/characters/female/Walk/walk_Right_Down.png", { frameWidth: 48, frameHeight: 64 });
      // Sprites novos: folhas de 256x32, com 8 quadros de 32x32.
      this.load.spritesheet("zombie-rat-idle", "./assets/enemies/zombie-rat/Um_rato_zombie-Idle.png", { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet("merchant-idle", "./assets/npcs/merchant/Um_npc_mercador_estilo_o-Idle.png", { frameWidth: 32, frameHeight: 32 });
    }
    create(){
      sceneRef = this;
      this.cameras.main.setBackgroundColor("#18201b");
      this.solids = [];
      const g = this.add.graphics();
      // REGIÃO 01 — Trilha Velha: pontos principais desenhados manualmente.
      g.fillStyle(0x26382b); g.fillRect(0,0,960,640);
      for(let y=0;y<640;y+=32){
        for(let x=0;x<960;x+=32){
          const n=(x*13+y*7)%17;
          g.fillStyle(n<6?0x223127:0x26382b);g.fillRect(x,y,32,32);
          if(n<4){g.fillStyle(n%2?0x1d2c23:0x2d3c2b);g.fillRect(x+5,y+7,5,4);g.fillRect(x+20,y+21,3,3);}
        }
      }
      // Estrada principal feita à mão, conectando o mapa de oeste a leste.
      g.fillStyle(0x594b3b);g.fillRect(0,270,960,82);
      g.fillStyle(0x6c5a43);g.fillRect(0,282,960,3);g.fillRect(0,337,960,3);
      g.fillStyle(0x4a4033);g.fillRect(0,308,960,4);
      // Pátio e abrigo principal.
      g.fillStyle(0x454541);g.fillRect(700,174,150,106);
      g.fillStyle(0x777064);g.fillRect(720,187,102,67);
      g.fillStyle(0x55544f);g.fillRect(713,181,116,12);
      g.fillStyle(0x303335);g.fillRect(754,211,34,43);
      g.fillStyle(0x171b1c);g.fillRect(760,217,22,37);
      g.fillStyle(0x9a8b6d);g.fillRect(700,174,150,5);
      this.solids.push({x:700,y:174,w:150,h:20},{x:700,y:194,w:48,h:66},{x:794,y:194,w:56,h:66});
      // Ruína murada ao norte: landmark fixo, com passagem aberta.
      g.fillStyle(0x56534a);g.fillRect(135,95,190,18);g.fillRect(135,113,18,74);g.fillRect(307,113,18,74);
      g.fillStyle(0x282d29);g.fillRect(153,113,154,62);
      g.fillStyle(0x716b5c);g.fillRect(135,95,190,5);g.fillRect(135,183,50,7);g.fillRect(275,183,50,7);
      this.solids.push({x:135,y:95,w:190,h:18},{x:135,y:113,w:18,h:74},{x:307,y:113,w:18,h:74});
      // Cercas quebradas e sucata fixa junto à trilha.
      for(let x=390;x<490;x+=18){g.fillStyle(0x4d514c);g.fillRect(x,220,3,32);g.fillRect(x+6,231,10,3);}
      g.fillStyle(0x454a45);g.fillRect(520,390,44,25);g.fillStyle(0x65645a);g.fillRect(525,385,31,8);
      g.fillStyle(0x494b45);g.fillRect(590,430,34,22);g.fillStyle(0x777064);g.fillRect(595,425,20,6);
      this.solids.push({x:520,y:385,w:44,h:30},{x:590,y:425,w:34,h:27});
      // Vegetação e destroços procedurais, sempre com a mesma seed nesta versão.
      // A distribuição só ocupa bolsões de cenário e não bloqueia a estrada principal.
      let seed = 20261014;
      const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      for(let i=0;i<58;i++){
        const x=24+rand()*910, y=24+rand()*590;
        if((y>255&&y<365) || (x>680&&x<865&&y>155&&y<290) || (x>120&&x<340&&y>85&&y<200)) continue;
        const type=Math.floor(rand()*3);
        if(type===0){
          g.fillStyle(0x17231c);g.fillRect(x-8,y-3,27,24);
          g.fillStyle(rand()>.5?0x29402c:0x334832);g.fillRect(x-13,y-12,34,25);
          g.fillStyle(0x45563a);g.fillRect(x-5,y-8,9,5);
          if(rand()>.35)this.solids.push({x:x-12,y:y-8,w:31,h:22});
        }else if(type===1){
          g.fillStyle(0x514d43);g.fillRect(x,y,18,12);g.fillStyle(0x777064);g.fillRect(x+3,y-3,11,4);
          if(rand()>.45)this.solids.push({x,y:y-3,w:18,h:15});
        }else{
          g.fillStyle(0x3e4944);g.fillRect(x,y,20,5);g.fillRect(x+4,y-5,12,5);g.fillStyle(0x716b5c);g.fillRect(x+8,y-4,5,3);
        }
      }
      // Rótulos de navegação da região.
      this.add.text(735,157,"ABRIGO",{fontFamily:"monospace",fontSize:"10px",color:"#d6c49f",stroke:"#141719",strokeThickness:3});
      this.add.text(70,365,"TRILHA VELHA",{fontFamily:"monospace",fontSize:"10px",color:"#d6c49f",stroke:"#141719",strokeThickness:3});
      this.add.text(170,72,"RUÍNAS DO NORTE",{fontFamily:"monospace",fontSize:"10px",color:"#b9b09b",stroke:"#141719",strokeThickness:3});
      // As folhas combinadas têm 8 quadros por linha e 6 direções (384x384).
      const directions=["down","left-down","left-up","right-down","right-up","up"];
      directions.forEach((dir,row)=>{
        if(dir!=="right-down"){
          this.anims.create({key:"player-idle-"+dir,frames:this.anims.generateFrameNumbers("player-idle",{start:row*8,end:row*8+7}),frameRate:7,repeat:-1});
          this.anims.create({key:"player-walk-"+dir,frames:this.anims.generateFrameNumbers("player-walk",{start:row*8,end:row*8+7}),frameRate:10,repeat:-1});
          this.anims.create({key:"guide-idle-"+dir,frames:this.anims.generateFrameNumbers("guide-idle",{start:row*8,end:row*8+7}),frameRate:7,repeat:-1});
          this.anims.create({key:"guide-walk-"+dir,frames:this.anims.generateFrameNumbers("guide-walk",{start:row*8,end:row*8+7}),frameRate:10,repeat:-1});
        }
      });
      this.anims.create({key:"player-idle-right-down",frames:this.anims.generateFrameNumbers("player-idle-right-down",{start:0,end:7}),frameRate:7,repeat:-1});
      this.anims.create({key:"player-walk-right-down",frames:this.anims.generateFrameNumbers("player-walk-right-down",{start:0,end:7}),frameRate:10,repeat:-1});
      this.anims.create({key:"guide-idle-right-down",frames:this.anims.generateFrameNumbers("guide-idle-right-down",{start:0,end:7}),frameRate:7,repeat:-1});
      this.anims.create({key:"guide-walk-right-down",frames:this.anims.generateFrameNumbers("guide-walk-right-down",{start:0,end:7}),frameRate:10,repeat:-1});
      // O spritesheet do rato tem 8 poses direcionais estáticas, uma por quadro.
      // Não reproduzir os 8 quadros como se fossem passos: isso mistura direções
      // e faz o rato mostrar o rabo ao jogador.
      const ratDirectionFrames = [6, 7, 0, 1, 2, 3, 4, 5];
      // Ângulo Phaser: direita=0, baixo=PI/2, esquerda=PI, cima=-PI/2.
      // Ordem angular: direita, direita-baixo, baixo, esquerda-baixo,
      // esquerda, esquerda-cima, cima, direita-cima.
      this.ratDirectionFrames = ratDirectionFrames;
      // Mostra apenas o primeiro quadro dos sprites; não executa animação no mercador.
      this.merchant=this.add.sprite(555,365,"merchant-idle",0).setFrame(0).setScale(1.9).setOrigin(0.5,0.82);
      this.merchantName=this.add.text(555,329,"MERCADOR",{fontFamily:"monospace",fontSize:"10px",color:"#f0d7a0",stroke:"#161718",strokeThickness:3}).setOrigin(0.5);
      player=this.add.sprite(470,305,"player-idle",0).setScale(1.25).setOrigin(0.5,0.82);player.play("player-idle-down");
      // A folha do rato contém 8 poses direcionais (não 8 quadros de caminhada).
      // O frame é escolhido pela direção do alvo; nunca animamos a folha inteira em loop.
      enemy=this.add.sprite(555,305,"zombie-rat-idle",4).setFrame(4).setScale(0.72).setOrigin(0.5,0.82);
      this.enemyBobOffset=0;
      this.enemyName=this.add.text(0,0,"RATO ZUMBI",{fontFamily:"monospace",fontSize:"10px",color:"#e6c2ad",stroke:"#141719",strokeThickness:3}).setOrigin(0.5);
      this.physics.world.setBounds(0,0,960,640);
      this.cameras.main.setBounds(0,0,960,640);this.cameras.main.startFollow(player,true,0.12,0.12);this.cameras.main.setZoom(Math.min(1.25,this.scale.width/390));
      cursors=this.input.keyboard.createCursorKeys();moveKeys=this.input.keyboard.addKeys("W,A,S,D,SPACE,E");
      this.input.on("pointerdown",pointer=>{if(pointer.event.target.closest("button"))return;const p=this.cameras.main.getWorldPoint(pointer.x,pointer.y);if(Math.hypot(p.x-player.x,p.y-player.y)>22)player.setData("tapTarget",{x:p.x,y:p.y});});
      updateHud();
      if(state.defeated||state.enemyHp<=0)enemy.setVisible(false);
    }
    drawPerson(container,coat,skin){
      const s=this.add.graphics();s.fillStyle(0x11140f,0.45);s.fillEllipse(0,12,25,9);s.fillStyle(coat);s.fillRect(-8,-9,16,20);s.fillStyle(skin);s.fillRect(-6,-18,12,11);s.fillStyle(0x171a20);s.fillRect(-7,-20,14,5);container.add(s);
    }
    update(_,delta){
      if(!player)return;
      let dx=0,dy=0;
      if(cursors.left.isDown||moveKeys.A.isDown||touch.left)dx=-1;else if(cursors.right.isDown||moveKeys.D.isDown||touch.right)dx=1;
      if(cursors.up.isDown||moveKeys.W.isDown||touch.up)dy=-1;else if(cursors.down.isDown||moveKeys.S.isDown||touch.down)dy=1;
      const target=player.getData("tapTarget");
      if(!dx&&!dy&&target){dx=target.x-player.x;dy=target.y-player.y;if(Math.hypot(dx,dy)<8){player.setData("tapTarget",null);dx=dy=0;}else{const l=Math.hypot(dx,dy);dx/=l;dy/=l;}}
      if(dx||dy){
        const diagonal = Math.abs(dx)>0 && Math.abs(dy)>0;
        const dirKey = diagonal
          ? (dx<0?(dy<0?"left-up":"left-down"):(dy<0?"right-up":"right-down"))
          : (Math.abs(dx)>0 ? (dx<0?"left-down":"right-down") : (dy<0?"up":"down"));
        // Usa a folha direcional original para direita-baixo, sem espelhamento.
        player.setFlipX(false);
        const walkKey="player-walk-"+dirKey;
        if(player.anims.currentAnim?.key!==walkKey)player.play(walkKey,true);
        const len=Math.hypot(dx,dy),step=145*delta/1000;
        const nx=Phaser.Math.Clamp(player.x+dx/len*step,25,935);
        const ny=Phaser.Math.Clamp(player.y+dy/len*step,35,610);
        const blocked=(x,y)=>this.solids.some(r=>x+10>r.x&&x-10<r.x+r.w&&y+8>r.y&&y-8<r.y+r.h);
        if(!blocked(nx,player.y))player.x=nx;
        if(!blocked(player.x,ny))player.y=ny;
      } else if(player.anims.currentAnim?.key?.startsWith("player-walk-")) {
        const previous=player.anims.currentAnim.key.replace("player-walk-","player-idle-");player.play(previous,true);
      }
      if(this.enemyName&&enemy&&enemy.visible){this.enemyName.setPosition(enemy.x,enemy.y-31);}
      if(this.merchantName&&this.merchant){this.merchantName.setPosition(this.merchant.x,this.merchant.y-34);}
      if(enemy&&enemy.visible&&!state.defeated&&state.hp>0){
        const distance=Phaser.Math.Distance.Between(player.x,player.y,enemy.x,enemy.y);
        if(distance<185){
          // Mesma lógica direcional do personagem: primeiro calcula o vetor
          // até o alvo e classifica horizontal/vertical/diagonal.
          const toPlayerX = player.x - enemy.x;
          const toPlayerY = player.y - enemy.y;
          const horizontal = Math.abs(toPlayerX) > Math.abs(toPlayerY) * 0.414;
          const vertical = Math.abs(toPlayerY) > Math.abs(toPlayerX) * 0.414;
          let dirKey;
          if (horizontal && vertical) {
            dirKey = toPlayerX < 0
              ? (toPlayerY < 0 ? "left-up" : "left-down")
              : (toPlayerY < 0 ? "right-up" : "right-down");
          } else if (horizontal) {
            dirKey = toPlayerX < 0 ? "left-down" : "right-down";
          } else {
            dirKey = toPlayerY < 0 ? "up" : "down";
          }
          // Os nomes seguem a mesma classificação do personagem; os índices
          // apontam para as 8 poses fixas do spritesheet do rato.
          const ratFrameByDirection = {
            "right-down": 7,
            "right-up": 5,
            "left-up": 3,
            "left-down": 1,
            "up": 4,
            "down": 0
          };
          // A folha tem uma pose lateral para cada lado, sem duplicar animações.
          // Usa a direção horizontal dominante para não selecionar a pose oposta.
          let ratFrame = ratFrameByDirection[dirKey];
          if (dirKey === "right-down" && toPlayerY < 0) ratFrame = 5;
          if (dirKey === "left-down" && toPlayerY < 0) ratFrame = 3;
          enemy.anims.stop();
          enemy.setFrame(ratFrame);
          if(distance>27){
            enemy.x+=Math.cos(a)*24*delta/1000;
            enemy.y+=Math.sin(a)*24*delta/1000;
            // A arte disponível não inclui ciclo de caminhada; um balanço sutil evita o deslize rígido.
            const bob=Math.sin(this.time.now/78)*1.15;
            enemy.y+=bob-this.enemyBobOffset;
            this.enemyBobOffset=bob;
          }else{
            enemy.y-=this.enemyBobOffset;
            this.enemyBobOffset=0;
            if(!this.enemyAttackAt||this.time.now>=this.enemyAttackAt){
              this.enemyAttackAt=this.time.now+1150;
              state.hp=Math.max(0,state.hp-5);updateHud();say("O rato zumbi atingiu você: -5 de vitalidade.");
              if(state.hp===0){
                state.hp=Math.floor(maxHp()/2);player.setPosition(470,305);enemy.setPosition(555,305);
                this.enemyBobOffset=0;say("Você conseguiu se afastar e recuperar o fôlego.");updateHud();
              }
            }
          }
        }else if(this.enemyBobOffset){
          enemy.y-=this.enemyBobOffset;
          this.enemyBobOffset=0;
        }
      }
    }
  }
  const config={type:Phaser.AUTO,parent:"game",width:390,height:520,backgroundColor:"#18201b",pixelArt:true,roundPixels:true,scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:"arcade",arcade:{debug:false}},scene:[WorldScene]};
  new Phaser.Game(config);
  function near(a,b,range=75){return a&&b&&Phaser.Math.Distance.Between(a.x,a.y,b.x,b.y)<=range;}
  function selectAction(action){state.action=action;updateHud();say(action==="close"?"Ação próxima selecionada: chegue perto do errante.":"Ação distante selecionada: consome uma carga de energia.");}
  function resolveAction(){
    if(!actionReady||state.hp<=0)return;
    if(!enemy||state.defeated||state.enemyHp<=0){say("Área segura! Você já superou o rato zumbi.");return;}
    const distance=Phaser.Math.Distance.Between(player.x,player.y,enemy.x,enemy.y);
    let damage,cooldown;
    if(state.action==="close"){
      if(distance>58){say("Você está longe demais. Aproxime-se do rato zumbi.");return;}
      damage=13;cooldown=500;
    }else{
      if(distance>285){say("O rato zumbi está longe demais até para a ação distante.");return;}
      if(state.charges<=0){say("Sua energia acabou. Use a ação próxima ou reinicie o teste.");return;}
      state.charges--;damage=24;cooldown=700;
    }
    actionReady=false;setTimeout(()=>actionReady=true,cooldown);
    state.enemyHp=Math.max(0,state.enemyHp-damage);
    enemy.setAlpha(.35);setTimeout(()=>{if(enemy)enemy.setAlpha(1);},130);
    say("Ação concluída: "+damage+" de impacto.");
    if(state.enemyHp<=0){
      state.defeated=true;enemy.setVisible(false);state.xp+=50;state.coins+=8;
      el("quest-text").textContent="Rato zumbi derrotado! Explore o abrigo e converse com o mercador.";
      if(state.xp>=state.level*100){state.xp-=state.level*100;state.level++;state.hp=maxHp();say("Rato zumbi derrotado! +50 XP, +8 moedas. Nível "+state.level+"!");}
      else say("Rato zumbi derrotado! +50 XP e +8 moedas.");
    }
    updateHud();
  }
  function interact(){
    if(sceneRef?.merchant&&near(player,sceneRef.merchant,85)){say("Mercador: Tenho suprimentos para quem conseguir moedas. A loja será aberta em uma próxima etapa.");}
    else if(near(player,enemy,100)&&!state.defeated)say("Um rato zumbi bloqueia a trilha. Escolha uma ação e pressione AGIR.");
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