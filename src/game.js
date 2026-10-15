(() => {
  const STORAGE_KEY = "umbral-realm-playtest-v6";
  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } })();
  const State = window.UmbralState;
  const World = window.UmbralWorld;
  const Targeting = window.UmbralTargeting;
  const CombatFeedback = window.UmbralCombatFeedback;
  const CombatRules = window.UmbralCombatRules;
  if (!State || !World || !Targeting || !CombatFeedback || !CombatRules) throw new Error("Os módulos do jogo não carregaram.");

  const state = State.normalize(saved);
  let sceneRef, player, cursors, moveKeys, actionReady = true, pendingMeleeRatId = null, menuOpen = false;
  const rats = [];
  const touch = { x: 0, y: 0 };
  const el = id => document.getElementById(id);

  // Mensagens operacionais continuam disponíveis para leitores de tela, sem cobrir o jogo.
  function announce(message) {
    const announcer = el("announcer");
    if (announcer) announcer.textContent = message;
  }

  function maxHp() { return State.maxHp(state.level); }
  function livingRatCount() { return state.rats.filter(rat => rat.hp > 0).length; }
  function nearestRat(maxRange = Infinity) {
    if (!player) return null;
    const candidates = rats.map(rat => ({
      x: rat.x,
      y: rat.y,
      rat,
      available: rat.visible && state.rats[rat.ratId].hp > 0
    }));
    return Targeting.findNearest(player, candidates, maxRange)?.rat || null;
  }

  function updateHud() {
    state.hp = Math.max(0, Math.min(maxHp(), state.hp));
    el("hp-label").textContent = `${state.hp} / ${maxHp()}`;
    el("hp-bar").style.width = `${state.hp / maxHp() * 100}%`;
    const next = state.level * 100;
    el("xp-label").textContent = `${state.xp} / ${next} XP`;
    el("xp-bar").style.width = `${state.xp / next * 100}%`;
    el("level").textContent = `Nv. ${state.level}`;
    el("coins").textContent = String(state.coins);
    el("charge-label").textContent = CombatRules.DEVELOPMENT_INFINITE_AMMO ? "Munição .38: ∞ (DESENVOLVIMENTO)" : `Munição .38: ${state.charges} / ${State.MAX_AMMO}`;
    ["action-close", "touch-action-close"].forEach(id => el(id)?.classList.toggle("selected", state.action === "close"));
    ["action-far", "touch-action-far"].forEach(id => el(id)?.classList.toggle("selected", state.action === "far"));
    ["action-close", "touch-action-close"].forEach(id => el(id)?.setAttribute("aria-pressed", String(state.action === "close")));
    ["action-far", "touch-action-far"].forEach(id => el(id)?.setAttribute("aria-pressed", String(state.action === "far")));

    el("status-level").textContent = String(state.level);
    el("status-hp").textContent = `${state.hp} / ${maxHp()} PV`;
    el("status-coins").textContent = String(state.coins);
    el("status-ammo").textContent = CombatRules.DEVELOPMENT_INFINITE_AMMO ? "∞" : `${state.charges} / ${State.MAX_AMMO}`;
    el("status-xp").textContent = `${state.xp} / ${next}`;
    for (const [skillName, action] of [["blades", "close"], ["firearms", "far"]]) {
      const skill = state.skills[skillName];
      const required = CombatRules.skillXpNeeded(skill.level);
      const range = CombatRules.damageRange(action, skill.level);
      el(`${skillName}-level`).textContent = `Nv. ${skill.level}`;
      el(`${skillName}-xp`).textContent = `${skill.xp} / ${required} XP`;
      el(`${skillName}-bar`).style.width = `${skill.xp / required * 100}%`;
      el(`${skillName}-damage`).textContent = `Dano ${range.min}–${range.max}`;
    }
    el("critical-chance").textContent = `${Math.round(CombatRules.CRITICAL_CHANCE * 100)}%`;
    el("critical-multiplier").textContent = `${String(CombatRules.CRITICAL_MULTIPLIER).replace(".", ",")}×`;

    const target = nearestRat();
    const remaining = livingRatCount();
    el("enemy-label").textContent = target ? `RATO ZUMBI • ${remaining} RESTANTE${remaining === 1 ? "" : "S"}` : "CLAREIRA SEGURA";
    el("enemy-hp-label").textContent = target ? `${state.rats[target.ratId].hp} / ${State.ENEMY_MAX_HP}` : "Sem ameaça";
    el("enemy-hp-bar").style.width = `${target ? state.rats[target.ratId].hp / State.ENEMY_MAX_HP * 100 : 0}%`;
    el("combat-info").textContent = state.action === "close" ? "Faca de cozinha • alcance curto" : "Revólver .38 • consome munição";
  }

  function persistGame(showFeedback = false) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (showFeedback) announce("Progresso salvo neste dispositivo.");
      return true;
    } catch {
      if (showFeedback) announce("Não foi possível salvar neste navegador.");
      return false;
    }
  }

  if (!window.Phaser) {
    el("game").innerHTML = '<p style="padding:20px;color:#e7dfd0">O motor do jogo não carregou. Confira a instalação e recarregue.</p>';
    return;
  }

  class WorldScene extends Phaser.Scene {
    constructor() { super("world"); }

    preload() {
      this.load.spritesheet("player-idle", "./assets/characters/male/Idle/idle.png", { frameWidth: 48, frameHeight: 64 });
      this.load.spritesheet("player-walk", "./assets/characters/male/Walk/walk.png", { frameWidth: 48, frameHeight: 64 });
      this.load.spritesheet("player-idle-right-down", "./assets/characters/male/Idle/idle_right_down.png", { frameWidth: 48, frameHeight: 64 });
      this.load.spritesheet("player-walk-right-down", "./assets/characters/male/Walk/walk_right_down.png", { frameWidth: 48, frameHeight: 64 });
      this.load.spritesheet("zombie-rat-idle", "./assets/enemies/zombie-rat/Um_rato_zombie-Idle.png", { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet("merchant-idle", "./assets/npcs/merchant/Um_npc_mercador_estilo_o-Idle.png", { frameWidth: 32, frameHeight: 32 });
      ["ground-dark", "ground-detail", "small-oak", "bush", "tires-grass", "tire", "brick-debris", "garbage-bin", "barrel-rust-red", "destroyed-wall-corner", "destroyed-wall"].forEach(key => {
        this.load.image(key, `./assets/environment/trail/${key}.png`);
      });
      this.load.audio("knife-stab", "./assets/audio/knife-stab.mp3");
      this.load.audio("revolver-shot", "./assets/audio/revolver-shot.mp3");
    }

    create() {
      sceneRef = this;
      this.solids = World.solids.map(solid => ({ ...solid }));
      this.cameras.main.setBackgroundColor("#17231c");
      this.add.tileSprite(0, 0, World.world.width, World.world.height, "ground-dark").setOrigin(0).setDepth(0);
      World.groundDetails.forEach(([x, y]) => this.add.image(x, y, "ground-detail").setScale(2).setAlpha(0.7).setDepth(1));

      const g = this.add.graphics().setDepth(1);
      // Trilha autoral em três trechos; a clareira fecha a jornada no lado leste.
      g.fillStyle(0x55483a, 1);
      g.fillRoundedRect(-35, 300, 455, 120, 52);
      g.fillRoundedRect(350, 250, 390, 120, 52);
      g.fillRoundedRect(660, 310, 355, 120, 52);
      g.fillEllipse(1080, 360, 370, 310);
      g.lineStyle(3, 0x75624b, 0.7);
      g.strokeRoundedRect(-35, 300, 455, 120, 52);
      g.strokeRoundedRect(350, 250, 390, 120, 52);
      g.strokeRoundedRect(660, 310, 355, 120, 52);
      g.strokeEllipse(1080, 360, 370, 310);

      // Ruínas fixas ajudam a orientar o jogador e correspondem aos retângulos de colisão.
      g.fillStyle(0x4a4c4d, 1);
      World.solids.forEach(solid => g.fillRect(solid.x, solid.y, solid.w, solid.h));
      g.lineStyle(2, 0x777064, 1);
      World.solids.forEach(solid => g.strokeRect(solid.x, solid.y, solid.w, solid.h));

      World.props.forEach(prop => {
        const sprite = this.add.image(prop.x, prop.y, prop.key).setScale(prop.scale).setOrigin(0.5, 1).setDepth(prop.y);
        if (prop.solid) {
          this.solids.push({ x: prop.x - prop.solid.w / 2, y: prop.y - prop.solid.h, w: prop.solid.w, h: prop.solid.h });
        }
        return sprite;
      });

      this.add.text(62, 440, "TRILHA DOS INFECTADOS", this.labelStyle("#d6c49f")).setDepth(900);
      this.add.text(445, 85, "RUÍNAS DO POSTO", this.labelStyle("#b9b09b")).setDepth(900);
      this.add.text(1010, 190, "CLAREIRA DO REFÚGIO", this.labelStyle("#f0d7a0")).setDepth(900);

      this.createCampfire();
      this.createAnimations();
      this.attackSounds = {
        close: this.sound.add("knife-stab", { volume: 0.58 }),
        far: this.sound.add("revolver-shot", { volume: 0.48 })
      };
      this.backgroundMusic = new Audio("./docs/wasteland-we-are-all-astronauts-main-version-37037-02-20.mp3");
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = 0.16;
      this.backgroundMusic.preload = "none";
      this.merchant = this.add.sprite(World.merchant.x, World.merchant.y, "merchant-idle", 0).setScale(1.6).setOrigin(0.5, 0.82).setDepth(World.merchant.y);
      this.merchantName = this.add.text(World.merchant.x, World.merchant.y - 35, "MERCADOR", this.labelStyle("#f0d7a0")).setOrigin(0.5).setDepth(1000);

      player = this.add.sprite(World.playerSpawn.x, World.playerSpawn.y, "player-idle", 0).setScale(1.6).setOrigin(0.5, 0.82).setDepth(World.playerSpawn.y);
      player.play("player-idle-down");
      this.createRats();

      this.physics.world.setBounds(0, 0, World.world.width, World.world.height);
      this.cameras.main.setBounds(0, 0, World.world.width, World.world.height);
      this.cameras.main.startFollow(player, true, 0.12, 0.12);
      this.cameras.main.setZoom(Math.min(1.25, this.scale.width / 390));
      cursors = this.input.keyboard.createCursorKeys();
      moveKeys = this.input.keyboard.addKeys("W,A,S,D,SPACE,E");
      this.input.on("pointerdown", pointer => {
        if (menuOpen || pointer.event.target.closest("button,.game-controls")) return;
        const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        if (Math.hypot(point.x - player.x, point.y - player.y) > 22) {
          pendingMeleeRatId = null;
          player.setData("tapTarget", { x: point.x, y: point.y });
        }
      });
      updateHud();
    }

    labelStyle(color) {
      return { fontFamily: "monospace", fontSize: "10px", color, stroke: "#141719", strokeThickness: 3 };
    }

    createCampfire() {
      const logs = this.add.graphics();
      logs.fillStyle(0x3a241b); logs.fillRect(-15, 5, 30, 6); logs.fillRect(-3, -7, 6, 30);
      logs.fillStyle(0x8f552f); logs.fillCircle(-12, 8, 3); logs.fillCircle(12, 8, 3);
      const flame = this.add.graphics();
      flame.fillStyle(0xd84b2a); flame.fillTriangle(-11, 7, 0, -24, 11, 7);
      flame.fillStyle(0xffa22f); flame.fillTriangle(-7, 6, 1, -15, 7, 6);
      flame.fillStyle(0xffdf78); flame.fillTriangle(-3, 5, 1, -7, 4, 5);
      this.campfire = this.add.container(World.campfire.x, World.campfire.y, [logs, flame]).setDepth(World.campfire.y);
      this.tweens.add({ targets: flame, scaleY: 0.86, scaleX: 1.08, alpha: 0.82, duration: 170, yoyo: true, repeat: -1 });
      this.add.text(World.campfire.x, World.campfire.y + 22, "FOGUEIRA", this.labelStyle("#e8a45c")).setOrigin(0.5).setDepth(1000);
    }

    createAnimations() {
      const directions = ["down", "left-down", "left-up", "right-down", "right-up", "up"];
      directions.forEach((direction, row) => {
        if (direction === "right-down") return;
        this.anims.create({ key: `player-idle-${direction}`, frames: this.anims.generateFrameNumbers("player-idle", { start: row * 8, end: row * 8 + 7 }), frameRate: 7, repeat: -1 });
        this.anims.create({ key: `player-walk-${direction}`, frames: this.anims.generateFrameNumbers("player-walk", { start: row * 8, end: row * 8 + 7 }), frameRate: 10, repeat: -1 });
      });
      this.anims.create({ key: "player-idle-right-down", frames: this.anims.generateFrameNumbers("player-idle-right-down", { start: 0, end: 7 }), frameRate: 7, repeat: -1 });
      this.anims.create({ key: "player-walk-right-down", frames: this.anims.generateFrameNumbers("player-walk-right-down", { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    }

    startBackgroundMusic() {
      if (!this.backgroundMusic || !this.backgroundMusic.paused) return Promise.resolve();
      return this.backgroundMusic.play();
    }

    playAttackSound(action) {
      const sound = this.attackSounds?.[action];
      if (!sound) return;
      if (sound.isPlaying) sound.stop();
      sound.play();
    }

    showDamageNumber(target, amount, critical = false) {
      const label = critical ? `CRÍTICO! ${CombatFeedback.damageLabel(amount)}` : CombatFeedback.damageLabel(amount);
      const number = this.add.text(target.x, target.y - 34, label, {
        fontFamily: "monospace",
        fontSize: critical ? "19px" : "16px",
        fontStyle: "bold",
        color: critical ? "#ffd166" : "#ff3b30",
        stroke: critical ? "#4b2600" : "#260606",
        strokeThickness: critical ? 5 : 4
      }).setOrigin(0.5).setDepth(2200).setScale(critical ? 1.15 : 1);
      if (critical) {
        this.cameras.main.shake(100, 0.003);
        if (typeof target.setTintFill === "function") target.setTintFill(0xffd166);
        setTimeout(() => { if (target.active && typeof target.clearTint === "function") target.clearTint(); }, 140);
      }
      this.tweens.add({
        targets: number,
        y: number.y - (critical ? 30 : 22),
        scale: critical ? 0.95 : 1,
        alpha: 0,
        duration: critical ? 900 : 650,
        ease: "Cubic.easeOut",
        onComplete: () => number.destroy()
      });
    }

    showExperienceNumber(amount) {
      const number = this.add.text(player.x, player.y - 48, CombatFeedback.experienceLabel(amount), {
        fontFamily: "monospace",
        fontSize: "14px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#101820",
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(2200);
      this.tweens.add({
        targets: number,
        y: number.y - 24,
        alpha: 0,
        duration: 850,
        ease: "Cubic.easeOut",
        onComplete: () => number.destroy()
      });
    }

    updateRatIndicators(rat) {
      rat.healthBar.clear();
      if (!rat.visible || state.rats[rat.ratId].hp <= 0) return;
      const ratio = CombatFeedback.healthRatio(state.rats[rat.ratId].hp, State.ENEMY_MAX_HP);
      const x = Math.round(rat.x - 17), y = Math.round(rat.y - 27);
      rat.healthBar.fillStyle(0x090a0e, 0.92).fillRect(x, y, 34, 6);
      rat.healthBar.fillStyle(0x3a1115, 1).fillRect(x + 1, y + 1, 32, 4);
      rat.healthBar.fillStyle(ratio > 0.45 ? 0xc74646 : 0xf06a3b, 1).fillRect(x + 1, y + 1, Math.round(32 * ratio), 4);
      rat.nameLabel.setPosition(rat.x, rat.y - 37);
    }

    createRats() {
      World.ratSpawns.forEach((spawn, ratId) => {
        const rat = this.add.sprite(spawn.x, spawn.y, "zombie-rat-idle", 4).setOrigin(0.5).setDepth(spawn.y);
        rat.ratId = ratId;
        rat.spawnX = spawn.x;
        rat.spawnY = spawn.y;
        rat.bobOffset = 0;
        rat.attackAt = 0;
        rat.healthBar = this.add.graphics().setDepth(999);
        rat.nameLabel = this.add.text(spawn.x, spawn.y - 37, `RATO ${ratId + 1}`, this.labelStyle("#e6c2ad")).setOrigin(0.5).setDepth(1000);
        rats.push(rat);
        if (state.rats[ratId].hp <= 0) {
          rat.setVisible(false);
          rat.nameLabel.setVisible(false);
          this.scheduleRatRespawn(rat);
        }
        this.updateRatIndicators(rat);
      });
    }

    scheduleRatRespawn(rat) {
      if (rat.respawnTimer) return;
      rat.respawnTimer = this.time.delayedCall(12000, () => {
        rat.respawnTimer = null;
        state.rats[rat.ratId].hp = State.ENEMY_MAX_HP;
        rat.setPosition(rat.spawnX, rat.spawnY).setAlpha(1).setVisible(true).setFrame(4);
        rat.nameLabel.setVisible(true);
        rat.bobOffset = 0;
        rat.attackAt = 0;
        this.updateRatIndicators(rat);
        updateHud();
        persistGame();
        announce("Um rato zumbi voltou à trilha.");
      });
    }

    isBlocked(x, y, halfWidth = 10, halfHeight = 8) {
      return this.solids.some(rect => x + halfWidth > rect.x && x - halfWidth < rect.x + rect.w && y + halfHeight > rect.y && y - halfHeight < rect.y + rect.h);
    }

    movePlayer(delta) {
      let dx = 0, dy = 0;
      if (cursors.left.isDown || moveKeys.A.isDown) dx = -1; else if (cursors.right.isDown || moveKeys.D.isDown) dx = 1; else dx = touch.x;
      if (cursors.up.isDown || moveKeys.W.isDown) dy = -1; else if (cursors.down.isDown || moveKeys.S.isDown) dy = 1; else dy = touch.y;
      const manualInput = Boolean(dx || dy);
      if (manualInput) {
        pendingMeleeRatId = null;
        player.setData("tapTarget", null);
      }

      if (!manualInput && pendingMeleeRatId !== null) {
        const meleeTarget = rats.find(rat => rat.ratId === pendingMeleeRatId);
        if (!meleeTarget?.visible || state.rats[pendingMeleeRatId].hp <= 0 || state.action !== "close") {
          pendingMeleeRatId = null;
        } else {
          const approach = Targeting.approachVector(player, meleeTarget, 52);
          if (approach.reached) {
            if (actionReady) {
              pendingMeleeRatId = null;
              resolveAction(false, meleeTarget);
            }
          } else {
            dx = approach.x;
            dy = approach.y;
          }
        }
      }

      const target = player.getData("tapTarget");
      if (!dx && !dy && pendingMeleeRatId === null && target) {
        dx = target.x - player.x; dy = target.y - player.y;
        if (Math.hypot(dx, dy) < 8) { player.setData("tapTarget", null); dx = dy = 0; }
        else { const length = Math.hypot(dx, dy); dx /= length; dy /= length; }
      }
      if (dx || dy) {
        const diagonal = Math.abs(dx) > 0 && Math.abs(dy) > 0;
        const direction = diagonal ? (dx < 0 ? (dy < 0 ? "left-up" : "left-down") : (dy < 0 ? "right-up" : "right-down")) : (Math.abs(dx) > 0 ? (dx < 0 ? "left-down" : "right-down") : (dy < 0 ? "up" : "down"));
        const animation = `player-walk-${direction}`;
        if (player.anims.currentAnim?.key !== animation) player.play(animation, true);
        const length = Math.hypot(dx, dy), step = 145 * delta / 1000;
        const nx = Phaser.Math.Clamp(player.x + dx / length * step, 25, World.world.width - 25);
        const ny = Phaser.Math.Clamp(player.y + dy / length * step, 35, World.world.height - 30);
        if (!this.isBlocked(nx, player.y)) player.x = nx;
        if (!this.isBlocked(player.x, ny)) player.y = ny;
      } else if (player.anims.currentAnim?.key?.startsWith("player-walk-")) {
        player.play(player.anims.currentAnim.key.replace("player-walk-", "player-idle-"), true);
      }
      player.setDepth(player.y);
    }

    moveRat(rat, delta) {
      if (!rat.visible || state.rats[rat.ratId].hp <= 0) return;
      if (rat.bobOffset) { rat.y -= rat.bobOffset; rat.bobOffset = 0; }
      const playerDistance = Phaser.Math.Distance.Between(player.x, player.y, rat.x, rat.y);
      const homeDistance = Phaser.Math.Distance.Between(rat.x, rat.y, rat.spawnX, rat.spawnY);
      let targetX = player.x, targetY = player.y, speed = 24;
      if (homeDistance > 175 || player.x > 965) { targetX = rat.spawnX; targetY = rat.spawnY; speed = 30; }
      else if (playerDistance >= 185) return;

      const dx = targetX - rat.x, dy = targetY - rat.y;
      const distance = Math.hypot(dx, dy);
      const angleSector = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
      rat.setFrame([2, 1, 0, 7, 6, 5, 4, 3][angleSector]);
      if (targetX === player.x && distance <= 27) {
        if (!rat.attackAt || this.time.now >= rat.attackAt) {
          rat.attackAt = this.time.now + 1150;
          state.hp = Math.max(0, state.hp - 5);
          this.showDamageNumber(player, 5);
          announce("Um rato zumbi atingiu você.");
          if (state.hp === 0) {
            state.hp = Math.floor(maxHp() / 2);
            pendingMeleeRatId = null;
            player.setPosition(World.playerSpawn.x, World.playerSpawn.y).setData("tapTarget", null);
            rats.forEach(other => { other.setPosition(other.spawnX, other.spawnY); other.bobOffset = 0; });
            announce("Você recuou para o início da trilha e recuperou o fôlego.");
          }
          updateHud(); persistGame();
        }
        return;
      }
      if (distance > 2) {
        const step = speed * delta / 1000;
        const nx = Phaser.Math.Clamp(rat.x + dx / distance * step, 12, World.world.width - 12);
        const ny = Phaser.Math.Clamp(rat.y + dy / distance * step, 12, World.world.height - 12);
        if (!this.isBlocked(nx, rat.y, 8, 6)) rat.x = nx;
        if (!this.isBlocked(rat.x, ny, 8, 6)) rat.y = ny;
        const bob = Math.sin(this.time.now / 78 + rat.ratId) * 1.15;
        rat.y += bob; rat.bobOffset = bob;
      }
      rat.setDepth(rat.y);
    }

    update(_, delta) {
      if (!player) return;
      this.movePlayer(delta);
      rats.forEach(rat => {
        this.moveRat(rat, delta);
        this.updateRatIndicators(rat);
      });
      if (this.time.now % 250 < delta) updateHud();
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: "game",
    width: 390,
    height: 520,
    backgroundColor: "#18201b",
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: "arcade", arcade: { debug: false } },
    scene: [WorldScene]
  };
  new Phaser.Game(config);
  const startMusic = () => {
    if (!sceneRef?.backgroundMusic) return;
    sceneRef.startBackgroundMusic().then(() => {
      document.removeEventListener("pointerdown", startMusic);
      document.removeEventListener("keydown", startMusic);
    }).catch(() => {});
  };
  document.addEventListener("pointerdown", startMusic);
  document.addEventListener("keydown", startMusic);

  function near(a, b, range = 75) { return a && b && Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y) <= range; }
  function selectAction(action) {
    if (menuOpen) return;
    pendingMeleeRatId = null;
    state.action = action; updateHud(); persistGame();
    announce(action === "close" ? "Faca selecionada: atacar aproxima você do rato mais próximo." : CombatRules.DEVELOPMENT_INFINITE_AMMO ? "Revólver .38 selecionado com munição infinita durante o desenvolvimento." : "Revólver .38 selecionado: cada disparo consome uma munição.");
  }

  function resolveAction(allowApproach = true, forcedTarget = null) {
    if (!actionReady || state.hp <= 0 || menuOpen) return;
    const range = state.action === "close" ? 58 : 285;
    let target = forcedTarget;
    if (target && (!target.visible || state.rats[target.ratId].hp <= 0 || Targeting.distanceBetween(player, target) > range)) target = null;
    if (!target) target = nearestRat(range);

    if (!target && state.action === "close" && allowApproach) {
      const approachTarget = nearestRat();
      if (!approachTarget) { announce("Não há ratos vivos para atacar."); return; }
      pendingMeleeRatId = approachTarget.ratId;
      player.setData("tapTarget", null);
      announce(`Aproximando da faca até o Rato ${approachTarget.ratId + 1}. Use o joystick para cancelar.`);
      return;
    }
    if (!target) { announce(state.action === "close" ? "Não foi possível alcançar o rato com a faca." : "Nenhum rato ao alcance do revólver."); return; }

    pendingMeleeRatId = null;
    const action = state.action;
    let cooldown;
    if (action === "close") cooldown = 500;
    else {
      if (!CombatRules.DEVELOPMENT_INFINITE_AMMO && state.charges <= 0) { announce("O revólver está sem munição. Selecione a faca."); return; }
      if (!CombatRules.DEVELOPMENT_INFINITE_AMMO) state.charges -= 1;
      cooldown = 700;
    }
    const skillName = CombatRules.WEAPONS[action].skill;
    const roll = CombatRules.rollDamage(action, state.skills[skillName].level);
    const damage = roll.damage;
    CombatRules.grantSkillXp(state.skills[skillName]);
    actionReady = false;
    setTimeout(() => { actionReady = true; }, cooldown);
    const ratState = state.rats[target.ratId];
    ratState.hp = Math.max(0, ratState.hp - damage);
    target.setAlpha(0.35);
    setTimeout(() => { if (target.visible) target.setAlpha(1); }, 130);
    sceneRef.playAttackSound(action);
    sceneRef.showDamageNumber(target, damage, roll.critical);
    sceneRef.updateRatIndicators(target);
    announce(`${action === "close" ? "Golpe de faca" : "Disparo"} atingiu o rato${roll.critical ? " com dano crítico" : ""}.`);
    if (ratState.hp === 0) {
      target.setVisible(false); target.nameLabel.setVisible(false);
      sceneRef.updateRatIndicators(target);
      state.coins += 8;
      const levelsGained = State.grantXp(state, 50);
      if (levelsGained > 0) state.hp = maxHp();
      sceneRef.showExperienceNumber(50);
      announce("+50 XP");
      const remaining = livingRatCount();
      el("quest-text").textContent = remaining > 0 ? `Restam ${remaining} ratos antes da clareira.` : "A trilha está livre. Encontre a fogueira e o mercador.";
      sceneRef.scheduleRatRespawn(target);
    }
    updateHud(); persistGame();
  }

  const menuTitles = { status: "STATUS", skills: "SKILLS", inventory: "INVENTÁRIO", map: "MAPA", quests: "MISSÕES" };
  function selectMenuPage(page) {
    if (!menuTitles[page]) return;
    document.querySelectorAll("[data-menu-page]").forEach(section => {
      const selected = section.dataset.menuPage === page;
      section.hidden = !selected;
      section.classList.toggle("active", selected);
    });
    document.querySelectorAll("[data-menu-tab]").forEach(button => {
      const selected = button.dataset.menuTab === page;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    el("menu-title").textContent = menuTitles[page];
  }

  function setMenuOpen(open) {
    menuOpen = open;
    const panel = el("smartphone-menu");
    panel.hidden = !open;
    el("open-menu").setAttribute("aria-expanded", String(open));
    if (open) {
      updateHud();
      pendingMeleeRatId = null;
      player?.setData("tapTarget", null);
      sceneRef?.scene.pause();
      el("close-menu").focus();
    } else {
      sceneRef?.scene.resume();
      el("open-menu").focus();
    }
  }

  function interact() {
    if (menuOpen) return;
    if (sceneRef?.merchant && near(player, sceneRef.merchant, 85)) {
      state.talked = true; persistGame();
      announce("Mercador: Você atravessou a trilha. Tenho suprimentos para quem conseguir moedas.");
    } else if (sceneRef?.campfire && Phaser.Math.Distance.Between(player.x, player.y, World.campfire.x, World.campfire.y) <= 75) {
      announce("A fogueira marca a clareira segura. O mercador está logo adiante.");
    } else if (nearestRat(100)) announce("Um rato zumbi bloqueia a trilha. Selecione uma arma e ataque.");
    else announce("Não há nada para interagir por perto.");
  }

  const joystick = el("joystick"), joystickKnob = el("joystick-knob");
  let joystickPointer = null;
  function resetJoystick() { touch.x = 0; touch.y = 0; joystickPointer = null; joystickKnob.style.transform = "translate(0px, 0px)"; }
  function moveJoystick(event) {
    if (joystickPointer !== event.pointerId) return;
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const max = Math.min(rect.width, rect.height) * 0.30;
    let x = event.clientX - cx, y = event.clientY - cy;
    const length = Math.hypot(x, y);
    if (length > max) { x = x / length * max; y = y / length * max; }
    touch.x = x / max; touch.y = y / max;
    joystickKnob.style.transform = `translate(${x}px, ${y}px)`;
  }
  joystick.addEventListener("pointerdown", event => { event.preventDefault(); joystickPointer = event.pointerId; joystick.setPointerCapture(event.pointerId); moveJoystick(event); });
  joystick.addEventListener("pointermove", moveJoystick);
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(name => joystick.addEventListener(name, event => { if (joystickPointer === event.pointerId) resetJoystick(); }));
  ["action-close", "touch-action-close"].forEach(id => el(id)?.addEventListener("click", () => selectAction("close")));
  ["action-far", "touch-action-far"].forEach(id => el(id)?.addEventListener("click", () => selectAction("far")));
  ["interact", "touch-interact"].forEach(id => el(id)?.addEventListener("click", interact));
  el("attack").addEventListener("click", resolveAction);
  el("save").addEventListener("click", () => persistGame(true));
  el("open-menu").addEventListener("click", () => setMenuOpen(!menuOpen));
  el("close-menu").addEventListener("click", () => setMenuOpen(false));
  document.querySelectorAll("[data-menu-tab]").forEach(button => button.addEventListener("click", () => selectMenuPage(button.dataset.menuTab)));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menuOpen) { setMenuOpen(false); return; }
    if (event.code === "Space") { event.preventDefault(); resolveAction(); }
    if (event.key.toLowerCase() === "e") interact();
    if (event.key === "1") selectAction("close");
    if (event.key === "2") selectAction("far");
  });
  updateHud(); persistGame();
  window.addEventListener("pagehide", () => persistGame());
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") persistGame(); });

  async function enterFullscreenAndLandscape() {
    try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen({ navigationUI: "hide" }); } catch (_) {}
    try { if (screen.orientation && typeof screen.orientation.lock === "function") await screen.orientation.lock("landscape"); }
    catch (_) { announce("Gire o celular para a horizontal. Se possível, ative a rotação automática do Android."); }
    if (!document.fullscreenElement && !document.documentElement.requestFullscreen) announce("Seu navegador não oferece tela cheia por aqui. Abra o jogo instalado na tela inicial e gire o celular.");
  }
  const fullscreenButton = el("fullscreen");
  el("rotate-fullscreen")?.addEventListener("click", enterFullscreenAndLandscape);
  fullscreenButton?.addEventListener("click", enterFullscreenAndLandscape);
  document.addEventListener("fullscreenchange", () => {
    const active = Boolean(document.fullscreenElement);
    if (fullscreenButton) {
      fullscreenButton.textContent = active ? "⛶ SAIR DA TELA CHEIA" : "⛶ TELA CHEIA";
      fullscreenButton.setAttribute("aria-label", active ? "Sair da tela cheia" : "Ativar tela cheia");
    }
  });
})();
