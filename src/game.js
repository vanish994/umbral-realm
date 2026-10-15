(() => {
  const STORAGE_KEY = "umbral-realm-playtest-v6";
  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } })();
  const State = window.UmbralState;
  const World = window.UmbralWorld;
  const Targeting = window.UmbralTargeting;
  const CombatFeedback = window.UmbralCombatFeedback;
  const CombatRules = window.UmbralCombatRules;
  const EnemyRules = window.UmbralEnemyRules;
  const ItemRules = window.UmbralItemRules;
  const AnimationRules = window.UmbralAnimationRules;
  const DropRules = window.UmbralDropRules;
  const ControlRules = window.UmbralControlRules;
  if (!State || !World || !Targeting || !CombatFeedback || !CombatRules || !EnemyRules || !ItemRules || !AnimationRules || !DropRules || !ControlRules) throw new Error("Os módulos do jogo não carregaram.");

  const state = State.normalize(saved);
  let sceneRef, player, cursors, moveKeys, actionReady = true, pendingMeleeEnemyIndex = null, selectedEnemyIndex = null, menuOpen = false, merchantMode = false, playerDying = false, reloadState = null, attackAnimation = null;
  const enemies = [];
  const groundDropSprites = [];
  const touch = { x: 0, y: 0 };
  const el = id => document.getElementById(id);

  // Perfil visual por espécie: textura, escala, altura dos indicadores, alcance de contato, balanço,
  // largura da barra de vida, raio do marcador de alvo e caixa de colisão. Cada espécie declarada em
  // src/enemy-rules.js precisa de uma entrada aqui; o teste estático cobre essa correspondência.
  const ENEMY_VISUALS = Object.freeze({
    rat: Object.freeze({ key: "zombie-rat-idle", scale: 1, offset: 27, contact: 27, bob: 1.15, barWidth: 38, radius: 19, solid: Object.freeze({ w: 8, h: 6 }) }),
    wolf: Object.freeze({ key: "zombie-wolf-idle", scale: 1.25, offset: 31, contact: 27, bob: 1.15, barWidth: 38, radius: 23, solid: Object.freeze({ w: 8, h: 6 }) }),
    "slow-zombie": Object.freeze({ key: "slow-zombie-idle", scale: 1.2, offset: 43, contact: 31, bob: 0.45, barWidth: 44, radius: 27, solid: Object.freeze({ w: 8, h: 6 }) }),
    // Humano hostil armado: celula 32x32 com corpo de 28 px, escalado para a altura do zumbi humano.
    // O deslocamento dos indicadores acompanha o topo do corpo desenhado (ancora em 0.76 da celula).
    scavenger: Object.freeze({ key: "scavenger-idle", scale: 1.9, offset: 46, contact: 33, bob: 0.6, barWidth: 46, radius: 28, solid: Object.freeze({ w: 10, h: 7 }) }),
    // Bruto de nivel 30: o maior sprite do mapa, com area de contato equivalente ao tamanho.
    mutant: Object.freeze({ key: "mutant-idle", scale: 2.15, offset: 56, contact: 40, bob: 0.35, barWidth: 52, radius: 32, solid: Object.freeze({ w: 13, h: 9 }) }),
    // Bruto do esgoto: mesma folha do zumbi lento, maior e com matiz esverdeado para
    // ler como outra espécie na penumbra dos corredores (sem asset novo).
    "sewer-zombie": Object.freeze({ key: "slow-zombie-idle", scale: 1.5, offset: 52, contact: 36, bob: 0.4, barWidth: 50, radius: 30, solid: Object.freeze({ w: 11, h: 8 }), tint: 0xa9c68b })
  });
  const FALLBACK_VISUAL = ENEMY_VISUALS.rat;
  function visualFor(definition) {
    const visual = ENEMY_VISUALS[definition?.species];
    if (visual) return visual;
    console.warn(`Sem perfil visual para a espécie ${definition?.species}; usando o do rato.`);
    return FALLBACK_VISUAL;
  }

  // Assets de ambiente gerados por tools/build-environment-assets.py a partir do pack
  // do mantenedor. A mata fecha as bordas (árvores, arbustos, capim, pedras e tocos) e
  // o cenário urbano cobre a estrada (carros, postes, bancos, entulho).
  const BORDER_ASSETS = [
    "tree-spruce", "tree-spruce-sparse", "tree-normal", "tree-big", "tree-big-pine",
    "tree-birch", "tree-birch-small", "tree-oak", "tree-oak-small", "tree-trunk",
    "bush", "bush-wide", "grass-tuft-small", "grass-tuft", "grass-tuft-low",
    "grass-tuft-tall", "rock-grass", "stump", "stump-mushrooms"
  ];
  const STREET_ASSETS = [
    "car-wreck", "car-overturned", "car-scrap", "van-wreck", "truck-wreck", "motorcycle-wreck",
    "street-light-side", "street-light-up", "street-light-overgrown", "bench", "hydrant",
    "trash-can", "trash-bag", "traffic-cone", "stop-sign", "manhole", "metal-plates",
    "iron-beam", "pallet", "cardboard", "shopping-cart", "refrigerator", "washing-machine",
    "vending-machine", "gray-brick", "gray-brick-debris", "container", "exhaust-pipe"
  ];

  // Mensagens operacionais continuam disponíveis para leitores de tela, sem cobrir o jogo.
  function announce(message) {
    const announcer = el("announcer");
    if (announcer) announcer.textContent = message;
  }

  function maxHp() { return State.maxHp(state.level); }
  function livingEnemyCount() { return state.enemies.filter(enemy => enemy.hp > 0).length; }
  function selectedEnemy(maxRange = Infinity) {
    if (!player || selectedEnemyIndex === null) return null;
    const enemy = enemies.find(candidate => candidate.enemyIndex === selectedEnemyIndex);
    if (!enemy?.visible || state.enemies[selectedEnemyIndex]?.hp <= 0) {
      selectedEnemyIndex = null;
      return null;
    }
    return Targeting.distanceBetween(player, enemy) <= maxRange ? enemy : null;
  }

  function nearestEnemy(maxRange = Infinity) {
    if (!player) return null;
    const candidates = enemies.map(enemy => ({
      x: enemy.x,
      y: enemy.y,
      enemy,
      available: enemy.visible && state.enemies[enemy.enemyIndex].hp > 0
    }));
    return Targeting.findNearest(player, candidates, maxRange)?.enemy || null;
  }

  function combatTarget(maxRange = Infinity) {
    if (selectedEnemyIndex !== null) return selectedEnemy(maxRange);
    return nearestEnemy(maxRange);
  }

  // Os botões touch têm ícone + rótulo: trocar só o texto preserva a estrutura visual.
  function setButtonLabel(button, text) {
    if (!button) return;
    const label = button.querySelector("[data-control-label]");
    if (label) label.textContent = text;
    else button.textContent = text;
  }

  // FALAR/FOGUEIRA só existe na tela quando há interação ao alcance, com o mesmo
  // alcance que `interact()` usa (fonte única em ControlRules). Fora dele o botão
  // some e fica desabilitado — nada de botão decorativo que só anuncia "nada aqui".
  function updateInteractControls() {
    const target = player ? ControlRules.interactionFor(player, World.merchant, World.campfire) : null;
    ["touch-interact", "interact"].forEach(id => {
      const button = el(id);
      if (!button) return;
      button.hidden = !target;
      button.disabled = !target;
      button.classList.toggle("is-available", Boolean(target));
      setButtonLabel(button, target?.label || "FALAR");
      const hint = button.querySelector("[data-interact-hint]");
      if (hint) hint.textContent = target?.hint || "";
      button.setAttribute("aria-label", target ? `${target.label}: ${target.hint.toLowerCase()}` : "Interagir (indisponível)");
    });
  }

  function updateHud() {
    state.hp = Math.max(0, Math.min(maxHp(), state.hp));
    el("hp-label").textContent = `${state.hp} / ${maxHp()}`;
    const healthRatio = state.hp / maxHp();
    el("hp-bar").style.width = `${healthRatio * 100}%`;
    el("character-condition").textContent = healthRatio > 0.66 ? "OPERACIONAL" : healthRatio > 0.33 ? "FERIDO" : "CRÍTICO";
    const next = state.level * 100;
    const equippedBlade = ItemRules.weaponForAction(state.equipment, "close");
    const equippedFirearm = ItemRules.weaponForAction(state.equipment, "far");
    const loadedAmmo = state.ammo[equippedFirearm.id];
    const isReloading = reloadState?.weaponId === equippedFirearm.id;
    el("xp-label").textContent = `${state.xp} / ${next} XP`;
    el("xp-bar").style.width = `${state.xp / next * 100}%`;
    el("level").textContent = `Nv. ${state.level}`;
    el("coins").textContent = String(state.coins);
    if (player) el("location-label").textContent = World.areaAt(player.x, player.y).name;
    el("charge-label").textContent = `${equippedFirearm.name}: ${loadedAmmo} / ${equippedFirearm.magazineSize}${CombatRules.DEVELOPMENT_INFINITE_RESERVE ? " • reserva ∞" : ""}${isReloading ? " • recarregando" : ""}`;
    el("world-ammo").textContent = `${equippedFirearm.name.toUpperCase()} • ${loadedAmmo}/${equippedFirearm.magazineSize}${CombatRules.DEVELOPMENT_INFINITE_RESERVE ? " • RESERVA ∞" : ""}${isReloading ? " • RECARREGANDO" : ""}`;
    ["action-close", "touch-action-close"].forEach(id => el(id)?.classList.toggle("selected", state.action === "close"));
    ["action-far", "touch-action-far"].forEach(id => el(id)?.classList.toggle("selected", state.action === "far"));
    ["action-close", "touch-action-close"].forEach(id => el(id)?.setAttribute("aria-pressed", String(state.action === "close")));
    ["action-far", "touch-action-far"].forEach(id => el(id)?.setAttribute("aria-pressed", String(state.action === "far")));

    el("status-level").textContent = String(state.level);
    el("status-hp").textContent = `${state.hp} / ${maxHp()} PV`;
    el("status-coins").textContent = String(state.coins);
    el("status-ammo").textContent = `${loadedAmmo} / ${equippedFirearm.magazineSize}${CombatRules.DEVELOPMENT_INFINITE_RESERVE ? " + ∞" : ""}`;
    el("status-xp").textContent = `${state.xp} / ${next}`;
    el("status-xp-bar").style.width = `${state.xp / next * 100}%`;
    const equippedDefense = ItemRules.defense(state.equipment);
    el("status-defense").textContent = `${Math.round(equippedDefense * 100)}%`;
    for (const [slot, itemId] of Object.entries(state.equipment)) {
      const image = el(`equipped-${slot}`);
      if (!image) continue;
      const item = ItemRules.ITEMS[itemId];
      const slotName = image.parentElement.querySelector("strong");
      if (item) {
        image.src = item.image;
        image.alt = item.name;
        image.parentElement.classList.add("equipped");
        if (slotName) slotName.textContent = item.name.toUpperCase();
      } else {
        image.removeAttribute("src");
        image.alt = "Espaço vazio";
        image.parentElement.classList.remove("equipped");
        if (slotName) slotName.textContent = "VAZIO";
      }
    }
    el("equipped-summary-title").textContent = `${equippedBlade.name.toUpperCase()} + ${equippedFirearm.name.toUpperCase()}`;
    el("equipped-summary-text").textContent = `Defesa equipada: ${Math.round(equippedDefense * 100)}%. Abra Itens para trocar o equipamento.`;
    const coreEntries = Object.entries(state.cores).filter(([, count]) => count > 0);
    const groundCount = Array.isArray(state.groundDrops) ? state.groundDrops.length : 0;
    const groundText = groundCount > 0 ? ` ${groundCount} núcleo${groundCount === 1 ? "" : "s"} no chão: passe por cima para coletar.` : "";
    el("core-summary").textContent = (coreEntries.length
      ? `Núcleos: ${coreEntries.map(([level, count]) => `Nv.${level} ×${count}`).join(" • ")}. ${merchantMode ? "Venda concluída ao falar com o mercador." : "Leve-os ao mercador."}`
      : `Núcleos: nenhum.${merchantMode ? " Compre equipamentos com ouro." : " O mercador compra os encontrados."}`) + groundText;
    document.querySelectorAll("[data-equip-item]").forEach(button => {
      const item = ItemRules.ITEMS[button.dataset.equipItem];
      const owned = state.ownedItems.includes(item.id);
      const equipped = owned && state.equipment[item.slot] === item.id;
      button.classList.toggle("equipped", equipped);
      button.classList.toggle("locked", !owned);
      button.setAttribute("aria-pressed", String(equipped));
      button.setAttribute("aria-label", owned ? `${item.name}: ${equipped ? "equipado" : "equipar"}` : `${item.name}: custa ${item.price} ouro no mercador`);
      button.querySelector("b").textContent = equipped ? "EQUIPADO" : owned ? "EQUIPAR" : merchantMode ? `COMPRAR ${item.price}` : `${item.price} OURO`;
    });
    el("action-close").textContent = equippedBlade.name.toUpperCase();
    el("action-far").textContent = equippedFirearm.name.toUpperCase();
    setButtonLabel(el("touch-action-close"), equippedBlade.name.toUpperCase());
    setButtonLabel(el("touch-action-far"), equippedFirearm.id === "revolver" ? ".38" : "PISTOLA");
    for (const [buttonId, item] of [["touch-action-close", equippedBlade], ["touch-action-far", equippedFirearm]]) {
      const button = el(buttonId);
      const icon = button?.querySelector(".touch-weapon-icon");
      if (icon && icon.getAttribute("src") !== item.image) icon.src = item.image;
      const detail = button?.querySelector("[data-weapon-detail]");
      if (detail) detail.textContent = item.action === "far" ? `${loadedAmmo}/${item.magazineSize}` : "CURTO ALCANCE";
    }
    ["reload", "touch-reload"].forEach(id => {
      const button = el(id);
      if (!button) return;
      button.disabled = Boolean(reloadState) || loadedAmmo >= equippedFirearm.magazineSize;
      setButtonLabel(button, isReloading ? "RECARREGANDO…" : "RECARREGAR");
      const detail = button.querySelector("[data-reload-detail]");
      if (detail) detail.textContent = isReloading ? "…" : loadedAmmo >= equippedFirearm.magazineSize ? "CARREGADO" : `${equippedFirearm.magazineSize - loadedAmmo} VAGAS`;
    });
    updateInteractControls();
    for (const [skillName, action] of [["blades", "close"], ["firearms", "far"]]) {
      const skill = state.skills[skillName];
      const required = CombatRules.skillXpNeeded(skill.level);
      const weapon = ItemRules.weaponForAction(state.equipment, action);
      const range = CombatRules.damageRange(action, skill.level, state.level, weapon);
      el(`${skillName}-level`).textContent = `Nv. ${skill.level}`;
      el(`${skillName}-xp`).textContent = `${skill.xp} / ${required} XP`;
      el(`${skillName}-bar`).style.width = `${skill.xp / required * 100}%`;
      el(`${skillName}-damage`).textContent = `Dano ${range.min}–${range.max}`;
    }
    el("critical-chance").textContent = `${Math.round(CombatRules.CRITICAL_CHANCE * 100)}%`;
    el("critical-multiplier").textContent = `${String(CombatRules.CRITICAL_MULTIPLIER).replace(".", ",")}×`;

    el("combat-info").textContent = state.action === "close" ? `${equippedBlade.name} • alcance curto` : `${equippedFirearm.name} • ${loadedAmmo}/${equippedFirearm.magazineSize}${isReloading ? " • recarregando" : ""}`;
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

  function isPlayerMoving() {
    if (!player || !cursors || !moveKeys) return false;
    return Boolean(player.getData("tapTarget") || pendingMeleeEnemyIndex !== null || cursors.left.isDown || cursors.right.isDown || cursors.up.isDown || cursors.down.isDown || moveKeys.A.isDown || moveKeys.D.isDown || moveKeys.W.isDown || moveKeys.S.isDown || Math.abs(touch.x) > 0.05 || Math.abs(touch.y) > 0.05);
  }

  // A animação de ataque assume o sprite durante a janela da arma (a mesma duração da recarga);
  // quando ela termina, o personagem volta a andar ou a ficar parado na direção em que olha.
  function attackAnimationActive() {
    if (!attackAnimation) return false;
    if (sceneRef && sceneRef.time.now < attackAnimation.endsAt) return true;
    attackAnimation = null;
    if (player) player.anims.timeScale = 1;
    return false;
  }

  function faceDirection(direction) {
    if (!player || !AnimationRules.isValidDirection(direction)) return;
    player.setData("direction", direction);
    if (!attackAnimationActive() && player.anims.currentAnim?.key?.startsWith("player-idle-")) {
      playPlayerAnimation(`player-idle-${direction}`, true);
    }
  }

  // O timeScale do ataque fica preso ao sprite: idle, walk e death sempre voltam à velocidade normal.
  function playPlayerAnimation(key, ignoreIfPlaying = false) {
    if (!player || !key) return;
    player.anims.timeScale = 1;
    player.play(key, ignoreIfPlaying);
  }

  function reloadFirearm() {
    const weapon = ItemRules.weaponForAction(state.equipment, "far");
    if (reloadState || state.ammo[weapon.id] >= weapon.magazineSize) return false;
    reloadState = { weaponId: weapon.id, endsAt: Date.now() + weapon.reloadMs };
    updateHud();
    announce(`Recarregando ${weapon.name.toLowerCase()}.`);
    window.setTimeout(() => {
      state.ammo[weapon.id] = weapon.magazineSize;
      reloadState = null;
      persistGame();
      updateHud();
      announce(`${weapon.name} recarregado.`);
    }, weapon.reloadMs);
    return true;
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
      this.load.spritesheet("player-death", "./assets/characters/male/Death/death_normal.png", { frameWidth: 48, frameHeight: 64 });
      this.load.spritesheet("player-attack-close", AnimationRules.sheetFor("close").file, { frameWidth: AnimationRules.sheetFor("close").frameWidth, frameHeight: AnimationRules.sheetFor("close").frameHeight });
      this.load.spritesheet("player-attack-far", AnimationRules.sheetFor("far").file, { frameWidth: AnimationRules.sheetFor("far").frameWidth, frameHeight: AnimationRules.sheetFor("far").frameHeight });
      this.load.spritesheet("zombie-rat-idle", "./assets/enemies/zombie-rat/Um_rato_zombie-Idle.png", { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet("zombie-wolf-idle", "./assets/enemies/zombie-wolf/idle.png", { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet("slow-zombie-idle", "./assets/enemies/slow-zombie/idle.png", { frameWidth: 48, frameHeight: 48 });
      this.load.spritesheet("scavenger-idle", "./assets/enemies/scavenger/idle.png", { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet("mutant-idle", "./assets/enemies/mutant/idle.png", { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet("merchant-idle", "./assets/npcs/merchant/Um_npc_mercador_estilo_o-Idle.png", { frameWidth: 32, frameHeight: 32 });
      // Pisos 512x512 a 2x, estrada, transicoes de area, parede e props da trilha.
      ["ground-dark", "ground-bleak", "ground-urban", "ground-refuge", "ground-detail", "road",
        "edge-bleak-dark", "edge-dark-urban", "edge-urban-refuge", "wall-brick",
        "bush", "tires-grass", "tire", "brick-debris", "garbage-bin", "barrel-rust-red",
        "destroyed-wall-corner", "destroyed-wall"].forEach(key => {
        this.load.image(key, `./assets/environment/trail/${key}.png`);
      });
      BORDER_ASSETS.forEach(key => this.load.image(key, `./assets/environment/border/${key}.png`));
      STREET_ASSETS.forEach(key => this.load.image(key, `./assets/environment/street/${key}.png`));
      this.load.audio("knife-stab", "./assets/audio/knife-stab.mp3");
      this.load.audio("revolver-shot", "./assets/audio/revolver-shot.mp3");
    }

    create() {
      sceneRef = this;
      this.wideViewport = this.scale.width > this.scale.height;
      this.characterScaleFactor = this.wideViewport ? 1.22 : 1;
      this.solids = World.solids.map(solid => ({ ...solid }));
      this.cameras.main.setBackgroundColor("#17231c");
      World.areas.forEach(area => {
        this.add.tileSprite(area.startX, 0, area.endX - area.startX, World.surfaceHeight, area.ground).setOrigin(0).setDepth(0);
      });
      // Subterrâneo: chão de concreto escurecido nas galerias e no poço (a rocha em
      // volta fica no fundo escuro da cena), com véu de penumbra abaixo dos personagens.
      const under = World.underground;
      this.add.tileSprite(under.x, under.y, under.width, under.height, under.ground).setOrigin(0).setDepth(0).setTint(0x7e858c);
      this.add.tileSprite(under.gapX, under.entrance.top, under.entrance.width, under.y - under.entrance.top + 32, under.ground).setOrigin(0).setDepth(0).setTint(0x7e858c);
      const gloom = this.add.graphics().setDepth(2);
      gloom.fillStyle(0x05070a, 0.34);
      gloom.fillRect(under.x, under.y, under.width, under.height);
      gloom.fillRect(under.gapX, under.entrance.top, under.entrance.width, under.y - under.entrance.top + 32);
      this.add.text(under.entrance.x, under.entrance.top - 16, "ESGOTO ↓", this.labelStyle("#cfe8c9")).setOrigin(0.5).setDepth(900);
      this.add.text(under.entrance.x, under.y + 52, under.name, this.labelStyle("#cfe8c9")).setOrigin(0.5).setDepth(900);
      World.groundDetails.forEach(([x, y]) => this.add.image(x, y, "ground-detail").setScale(2).setAlpha(0.7).setDepth(1));

      // Divisas de área: dither de 96 px centrado no limite, no lugar de linhas pretas.
      World.areaEdges.forEach(edge => {
        this.add.tileSprite(edge.x - edge.width / 2, 0, edge.width, World.world.height, edge.key).setOrigin(0).setDepth(1);
      });

      // Estrada linear conecta as três áreas hostis ao refúgio no extremo leste.
      this.add.tileSprite(World.road.x, World.road.y, World.road.width, World.road.height, World.road.key).setOrigin(0).setDepth(1);

      // Ruínas: paredes de tijolo do pack desenhadas sobre os retângulos de colisão.
      // A profundidade y + h faz a parede cobrir o que está atrás dela.
      World.solids.forEach(solid => {
        if (solid.border) return;
        this.add.tileSprite(solid.x, solid.y, solid.w, solid.h, "wall-brick").setOrigin(0).setDepth(solid.y + solid.h);
      });

      World.props.forEach(prop => {
        // Props "flat" são detalhes rentes ao chão (bueiro, placas): ficam abaixo dos personagens.
        const sprite = this.add.image(prop.x, prop.y, prop.key).setScale(prop.scale).setOrigin(0.5, 1).setDepth(prop.flat ? 2 : prop.y);
        if (prop.solid) {
          this.solids.push({ x: prop.x - prop.solid.w / 2, y: prop.y - prop.solid.h, w: prop.solid.w, h: prop.solid.h });
        }
        return sprite;
      });

      World.areas.forEach((area, index) => {
        const color = index === World.areas.length - 1 ? "#f0d7a0" : "#d6c49f";
        this.add.text((area.startX + area.endX) / 2, 170, area.name, this.labelStyle(color)).setOrigin(0.5).setDepth(900);
      });

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
      this.merchant = this.add.sprite(World.merchant.x, World.merchant.y, "merchant-idle", 0).setScale(1.6 * this.characterScaleFactor).setOrigin(0.5, 0.82).setDepth(World.merchant.y);
      this.merchantName = this.add.text(World.merchant.x, World.merchant.y - 35, "MERCADOR", this.labelStyle("#f0d7a0")).setOrigin(0.5).setDepth(1000);

      player = this.add.sprite(World.playerSpawn.x, World.playerSpawn.y, "player-idle", 0).setScale(1.6 * this.characterScaleFactor).setOrigin(0.5, 0.82).setDepth(World.playerSpawn.y);
      player.setData("direction", "down");
      playPlayerAnimation("player-idle-down");
      this.targetMarker = this.add.graphics().setDepth(998);
      this.createEnemies();
      this.syncGroundDropVisuals();

      this.physics.world.setBounds(0, 0, World.world.width, World.world.height);
      this.cameras.main.setBounds(0, 0, World.world.width, World.world.height);
      this.cameras.main.startFollow(player, true, 0.12, 0.12);
      const wideViewport = this.scale.width > this.scale.height;
      this.cameras.main.setZoom(wideViewport ? 1.02 : Math.min(1, this.scale.width / 390));
      this.minimapCanvas = el("minimap-canvas");
      this.minimapContext = this.minimapCanvas?.getContext("2d");
      this.drawMinimap();
      cursors = this.input.keyboard.createCursorKeys();
      moveKeys = this.input.keyboard.addKeys("W,A,S,D,SPACE,E");
      this.input.on("pointerdown", pointer => {
        if (menuOpen || playerDying || pointer.event.target.closest("button,.game-controls")) return;
        const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        if (Math.hypot(point.x - player.x, point.y - player.y) > 22) {
          selectedEnemyIndex = null;
          pendingMeleeEnemyIndex = null;
          this.updateTargetMarker();
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
      // As linhas das folhas direcionais seguem AnimationRules.DIRECTION_ROW
      // (down, left-down, left-up, up, right-up, right-down) para idle, walk, death e ataques.
      AnimationRules.DIRECTIONS.forEach(direction => {
        const row = AnimationRules.rowFor(direction);
        if (direction !== "right-down") {
          this.anims.create({ key: `player-idle-${direction}`, frames: this.anims.generateFrameNumbers("player-idle", { start: row * 8, end: row * 8 + 7 }), frameRate: 7, repeat: -1 });
          this.anims.create({ key: `player-walk-${direction}`, frames: this.anims.generateFrameNumbers("player-walk", { start: row * 8, end: row * 8 + 7 }), frameRate: 10, repeat: -1 });
        }
        this.anims.create({ key: `player-death-${direction}`, frames: this.anims.generateFrameNumbers("player-death", { start: row * 8, end: row * 8 + 7 }), frameRate: 9, repeat: 0 });
      });
      this.anims.create({ key: "player-idle-right-down", frames: this.anims.generateFrameNumbers("player-idle-right-down", { start: 0, end: 7 }), frameRate: 7, repeat: -1 });
      this.anims.create({ key: "player-walk-right-down", frames: this.anims.generateFrameNumbers("player-walk-right-down", { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
      ["close", "far"].forEach(action => {
        const sheet = AnimationRules.sheetFor(action);
        AnimationRules.DIRECTIONS.forEach(direction => {
          const row = AnimationRules.rowFor(direction);
          this.anims.create({
            key: AnimationRules.attackKey(action, direction),
            frames: this.anims.generateFrameNumbers(sheet.texture, { start: row * sheet.frameCount, end: row * sheet.frameCount + sheet.frameCount - 1 }),
            frameRate: AnimationRules.BASE_FRAME_RATE,
            repeat: 0
          });
        });
      });
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

    // Toca a animação direcional do ataque (faca para curta distância, pistola para armas de fogo).
    playAttackAnimation(action) {
      if (!player || playerDying) return;
      const weapon = ItemRules.weaponForAction(state.equipment, action);
      const direction = AnimationRules.directionOrDefault(player.getData("direction"));
      const key = AnimationRules.attackKey(action, direction);
      if (!this.anims.exists(key)) return;
      player.play({ key, timeScale: AnimationRules.timeScaleFor(action, weapon) });
      attackAnimation = { key, direction, action, endsAt: this.time.now + AnimationRules.attackWindowMs(action, weapon) };
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

    showMissNumber(target) {
      const number = this.add.text(target.x, target.y - 34, "ERROU", {
        fontFamily: "monospace", fontSize: "14px", fontStyle: "bold", color: "#d7dce2", stroke: "#101820", strokeThickness: 4
      }).setOrigin(0.5).setDepth(2200);
      this.tweens.add({ targets: number, y: number.y - 20, alpha: 0, duration: 600, ease: "Cubic.easeOut", onComplete: () => number.destroy() });
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

    updateEnemyIndicators(enemy) {
      enemy.healthBar.clear();
      if (!enemy.visible || state.enemies[enemy.enemyIndex].hp <= 0) return;
      const definition = EnemyRules.definition(enemy.definitionId);
      const ratio = CombatFeedback.healthRatio(state.enemies[enemy.enemyIndex].hp, definition.maxHp);
      const width = visualFor(definition).barWidth;
      const y = Math.round(enemy.y - enemy.indicatorOffset);
      const x = Math.round(enemy.x - width / 2);
      enemy.healthBar.fillStyle(0x090a0e, 0.92).fillRect(x, y, width, 6);
      enemy.healthBar.fillStyle(0x3a1115, 1).fillRect(x + 1, y + 1, width - 2, 4);
      enemy.healthBar.fillStyle(ratio > 0.45 ? 0xc74646 : 0xf06a3b, 1).fillRect(x + 1, y + 1, Math.round((width - 2) * ratio), 4);
      enemy.nameLabel.setPosition(enemy.x, y - 10);
    }

    updateTargetMarker() {
      this.targetMarker?.clear();
      const target = selectedEnemy();
      if (!target || !this.targetMarker) return;
      const radius = visualFor(EnemyRules.definition(target.definitionId)).radius;
      this.targetMarker.lineStyle(3, 0xf2c66d, 0.95);
      this.targetMarker.strokeEllipse(target.x, target.y - 2, radius * 2, Math.round(radius * 0.72));
      this.targetMarker.fillStyle(0xf2c66d, 0.22);
      this.targetMarker.fillTriangle(target.x - 6, target.y - target.indicatorOffset - 13, target.x + 6, target.y - target.indicatorOffset - 13, target.x, target.y - target.indicatorOffset - 5);
    }

    createEnemies() {
      World.enemySpawns.forEach((spawn, enemyIndex) => {
        const definition = EnemyRules.definition(spawn.id);
        const visual = visualFor(definition);
        const enemy = this.add.sprite(spawn.x, spawn.y, visual.key, 4).setScale(visual.scale * this.characterScaleFactor).setOrigin(0.5, 0.76).setDepth(spawn.y);
        if (visual.tint) enemy.setTint(visual.tint);
        enemy.enemyIndex = enemyIndex;
        enemy.definitionId = definition.id;
        enemy.spawnX = spawn.x;
        enemy.spawnY = spawn.y;
        enemy.indicatorOffset = Math.round(visual.offset * this.characterScaleFactor);
        enemy.bobOffset = 0;
        enemy.attackAt = 0;
        enemy.healthBar = this.add.graphics().setDepth(999);
        enemy.nameLabel = this.add.text(spawn.x, spawn.y - enemy.indicatorOffset - 10, `${definition.name} • NV. ${definition.level}`, this.labelStyle("#e6c2ad")).setOrigin(0.5).setDepth(1000);
        enemy.setInteractive({ useHandCursor: true });
        enemy.on("pointerdown", (_pointer, _localX, _localY, event) => {
          event?.stopPropagation();
          if (playerDying || !enemy.visible || state.enemies[enemy.enemyIndex].hp <= 0) return;
          selectedEnemyIndex = enemy.enemyIndex;
          pendingMeleeEnemyIndex = null;
          player.setData("tapTarget", null);
          this.updateTargetMarker();
          updateHud();
          announce(`${definition.name} nível ${definition.level} selecionado como alvo.`);
        });
        enemies.push(enemy);
        if (state.enemies[enemyIndex].hp <= 0) {
          enemy.setVisible(false);
          enemy.nameLabel.setVisible(false);
          this.scheduleEnemyRespawn(enemy);
        }
        this.updateEnemyIndicators(enemy);
      });
    }

    // Núcleos no chão: losango esverdeado pulsante desenhado sem asset novo, para o
    // loot ser legível em tela pequena sem depender de uma imagem ainda não licenciada.
    createGroundDropVisual(drop) {
      const glow = this.add.graphics();
      glow.fillStyle(0x7dff9a, 0.16);
      glow.fillCircle(0, 0, 17);
      glow.fillStyle(0x2fbf71, 1);
      glow.fillTriangle(0, -11, 9, 0, -9, 0);
      glow.fillTriangle(-9, 0, 9, 0, 0, 11);
      glow.lineStyle(2, 0xeaffea, 0.95);
      glow.strokeTriangle(0, -11, 9, 0, 0, 11);
      glow.strokeTriangle(0, -11, -9, 0, 0, 11);
      glow.fillStyle(0xeaffea, 1);
      glow.fillCircle(0, 0, 3);
      const label = this.add.text(0, 14, `Nv.${drop.level}`, this.labelStyle("#b8ffd0")).setOrigin(0.5);
      const container = this.add.container(drop.x, drop.y, [glow, label]).setDepth(drop.y);
      this.tweens.add({ targets: glow, scale: 1.18, alpha: 0.75, duration: 620, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      const entry = { drop, container, glow };
      groundDropSprites.push(entry);
      return entry;
    }

    // Reconcilia cena e estado: cria visuais que faltam e destrói os de drops já
    // coletados ou expulsos pelo teto FIFO. É a única porta de entrada/saída visual.
    syncGroundDropVisuals() {
      for (let index = groundDropSprites.length - 1; index >= 0; index -= 1) {
        const entry = groundDropSprites[index];
        if (!state.groundDrops.includes(entry.drop)) {
          entry.container.destroy();
          groundDropSprites.splice(index, 1);
        }
      }
      state.groundDrops.forEach(drop => {
        if (!groundDropSprites.some(entry => entry.drop === drop)) this.createGroundDropVisual(drop);
      });
    }

    showCorePickupNumber(drop) {
      const number = this.add.text(player.x, player.y - 48, `+ NÚCLEO Nv.${drop.level}`, {
        fontFamily: "monospace", fontSize: "13px", fontStyle: "bold", color: "#8dffb0", stroke: "#0c2416", strokeThickness: 4
      }).setOrigin(0.5).setDepth(2200);
      this.tweens.add({ targets: number, y: number.y - 22, alpha: 0, duration: 800, ease: "Cubic.easeOut", onComplete: () => number.destroy() });
    }

    // Coleta por proximidade (sem botão extra no celular): passar por cima basta.
    tryCollectGroundDrop() {
      if (!player || playerDying || !state.groundDrops.length) return;
      const candidate = DropRules.pickupCandidate(state.groundDrops, player.x, player.y);
      if (!candidate) return;
      state.groundDrops = DropRules.removeDrop(state.groundDrops, candidate);
      state.cores[candidate.level] = (state.cores[candidate.level] || 0) + 1;
      this.syncGroundDropVisuals();
      this.showCorePickupNumber(candidate);
      announce(`Núcleo nível ${candidate.level} coletado. Leve-o ao mercador.`);
      updateHud();
      persistGame();
    }

    scheduleEnemyRespawn(enemy) {
      if (enemy.respawnTimer) return;
      const definition = EnemyRules.definition(enemy.definitionId);
      enemy.respawnTimer = this.time.delayedCall(definition.respawnMs, () => {
        enemy.respawnTimer = null;
        state.enemies[enemy.enemyIndex].hp = definition.maxHp;
        enemy.setPosition(enemy.spawnX, enemy.spawnY).setAlpha(1).setVisible(true).setFrame(4);
        enemy.nameLabel.setVisible(true);
        enemy.bobOffset = 0;
        enemy.attackAt = 0;
        this.updateEnemyIndicators(enemy);
        updateHud();
        persistGame();
        announce(`${definition.name} nível ${definition.level} voltou à trilha.`);
      });
    }

    handlePlayerDeath() {
      if (playerDying) return;
      playerDying = true;
      actionReady = false;
      attackAnimation = null;
      player.anims.timeScale = 1;
      pendingMeleeEnemyIndex = null;
      selectedEnemyIndex = null;
      this.updateTargetMarker();
      player.setData("tapTarget", null);
      resetJoystick();
      const direction = AnimationRules.directionOrDefault(player.getData("direction"));
      playPlayerAnimation(`player-death-${direction}`, true);
      announce("Você morreu.");
      this.time.delayedCall(950, () => {
        const penalty = State.applyDeathPenalty(state);
        state.hp = Math.max(1, Math.floor(maxHp() / 2));
        player.setPosition(World.playerSpawn.x, World.playerSpawn.y).setData("direction", "down");
        enemies.forEach(other => { other.setPosition(other.spawnX, other.spawnY); other.bobOffset = 0; });
        playPlayerAnimation("player-idle-down", true);
        playerDying = false;
        actionReady = true;
        updateHud();
        persistGame();
        const levelMessage = penalty.generalLevelsLost > 0 ? ` Você voltou ${penalty.generalLevelsLost} nível geral.` : "";
        const skillLevelsLost = penalty.skills.blades.levelsLost + penalty.skills.firearms.levelsLost;
        const skillMessage = skillLevelsLost > 0 ? ` Você perdeu ${skillLevelsLost} nível de skill.` : "";
        announce(`Morte: menos 10 XP geral e 10% do progresso atual de cada skill.${levelMessage}${skillMessage}`);
      });
    }

    isBlocked(x, y, halfWidth = 10, halfHeight = 8) {
      return this.solids.some(rect => x + halfWidth > rect.x && x - halfWidth < rect.x + rect.w && y + halfHeight > rect.y && y - halfHeight < rect.y + rect.h);
    }

    movePlayer(delta) {
      if (playerDying) return;
      let dx = 0, dy = 0;
      // Analógico de verdade: a inclinação define a velocidade (inclinar pouco = andar
      // devagar para ajuste fino; inclinar tudo = velocidade máxima). Teclado, toque no
      // mapa e perseguição automática continuam em velocidade cheia (speedScale 1).
      let speedScale = 1;
      const keyboardX = cursors.left.isDown || moveKeys.A.isDown ? -1 : cursors.right.isDown || moveKeys.D.isDown ? 1 : 0;
      const keyboardY = cursors.up.isDown || moveKeys.W.isDown ? -1 : cursors.down.isDown || moveKeys.S.isDown ? 1 : 0;
      if (keyboardX || keyboardY) { dx = keyboardX; dy = keyboardY; }
      else { dx = touch.x; dy = touch.y; speedScale = Math.min(1, Math.hypot(dx, dy)); }
      const manualInput = Boolean(dx || dy);
      if (manualInput) {
        pendingMeleeEnemyIndex = null;
        player.setData("tapTarget", null);
      }

      if (!manualInput && pendingMeleeEnemyIndex !== null) {
        const meleeTarget = enemies.find(enemy => enemy.enemyIndex === pendingMeleeEnemyIndex);
        if (!meleeTarget?.visible || state.enemies[pendingMeleeEnemyIndex].hp <= 0 || state.action !== "close") {
          pendingMeleeEnemyIndex = null;
        } else {
          const approach = Targeting.approachVector(player, meleeTarget, 52);
          if (approach.reached) {
            if (actionReady) {
              pendingMeleeEnemyIndex = null;
              resolveAction(false, meleeTarget);
            }
          } else {
            dx = approach.x;
            dy = approach.y;
            speedScale = 1;
          }
        }
      }

      const target = player.getData("tapTarget");
      if (!dx && !dy && pendingMeleeEnemyIndex === null && target) {
        dx = target.x - player.x; dy = target.y - player.y;
        speedScale = 1;
        if (Math.hypot(dx, dy) < 8) { player.setData("tapTarget", null); dx = dy = 0; }
        else { const length = Math.hypot(dx, dy); dx /= length; dy /= length; }
      }
      const attacking = attackAnimationActive();
      if (dx || dy) {
        const direction = AnimationRules.directionFor(dx, dy);
        const animation = `player-walk-${direction}`;
        player.setData("direction", direction);
        if (!attacking && player.anims.currentAnim?.key !== animation) playPlayerAnimation(animation, true);
        if (!attacking && player.anims.currentAnim?.key === animation) player.anims.timeScale = 0.55 + 0.45 * speedScale;
        const length = Math.hypot(dx, dy), step = 145 * speedScale * delta / 1000;
        const nx = Phaser.Math.Clamp(player.x + dx / length * step, 25, World.world.width - 25);
        const ny = Phaser.Math.Clamp(player.y + dy / length * step, 35, World.world.height - 30);
        if (!this.isBlocked(nx, player.y)) player.x = nx;
        if (!this.isBlocked(player.x, ny)) player.y = ny;
      } else if (!attacking) {
        const current = player.anims.currentAnim?.key || "";
        if (current.startsWith("player-walk-") || current.startsWith("player-attack-")) {
          playPlayerAnimation(`player-idle-${AnimationRules.directionOrDefault(player.getData("direction"))}`, true);
        }
      }
      player.setDepth(player.y);
    }

    moveEnemy(enemy, delta) {
      if (playerDying || !enemy.visible || state.enemies[enemy.enemyIndex].hp <= 0) return;
      if (enemy.bobOffset) { enemy.y -= enemy.bobOffset; enemy.bobOffset = 0; }
      const definition = EnemyRules.definition(enemy.definitionId);
      const visual = visualFor(definition);
      const playerDistance = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
      const homeDistance = Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.spawnX, enemy.spawnY);
      let targetX = player.x, targetY = player.y, speed = definition.speed;
      if (homeDistance > definition.chaseRange + 65 || player.x > World.safeZoneX) { targetX = enemy.spawnX; targetY = enemy.spawnY; speed = Math.max(24, definition.speed); }
      else if (playerDistance >= definition.chaseRange) return;

      const dx = targetX - enemy.x, dy = targetY - enemy.y;
      const distance = Math.hypot(dx, dy);
      const angleSector = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
      enemy.setFrame([2, 1, 0, 7, 6, 5, 4, 3][angleSector]);
      const contactRange = visual.contact;
      if (targetX === player.x && distance <= contactRange) {
        if (!enemy.attackAt || this.time.now >= enemy.attackAt) {
          enemy.attackAt = this.time.now + definition.attackCooldown;
          const receivedDamage = ItemRules.incomingDamage(definition.damage, state.equipment);
          state.hp = Math.max(0, state.hp - receivedDamage);
          this.showDamageNumber(player, receivedDamage);
          announce(`${definition.name} nível ${definition.level} atingiu você.`);
          if (state.hp === 0) this.handlePlayerDeath();
          updateHud(); persistGame();
        }
        return;
      }
      if (distance > 2) {
        const step = speed * delta / 1000;
        const nx = Phaser.Math.Clamp(enemy.x + dx / distance * step, 12, World.world.width - 12);
        const ny = Phaser.Math.Clamp(enemy.y + dy / distance * step, 12, World.world.height - 12);
        if (!this.isBlocked(nx, enemy.y, visual.solid.w, visual.solid.h)) enemy.x = nx;
        if (!this.isBlocked(enemy.x, ny, visual.solid.w, visual.solid.h)) enemy.y = ny;
        const bob = Math.sin(this.time.now / 78 + enemy.enemyIndex) * visual.bob;
        enemy.y += bob; enemy.bobOffset = bob;
      }
      enemy.setDepth(enemy.y);
    }

    drawMinimap() {
      const context = this.minimapContext;
      const canvas = this.minimapCanvas;
      if (!context || !canvas || !player) return;
      const width = canvas.width, height = canvas.height;
      const margin = 13;
      const mapX = x => margin + x / World.world.width * (width - margin * 2);
      const mapY = y => margin + y / World.world.height * (height - margin * 2);
      context.clearRect(0, 0, width, height);
      context.save();
      context.beginPath();
      context.arc(width / 2, height / 2, width / 2 - 3, 0, Math.PI * 2);
      context.clip();
      context.fillStyle = "#091017";
      context.fillRect(0, 0, width, height);
      const areaColors = ["#6d6339", "#253d2d", "#514638", "#294335"];
      World.areas.forEach((area, index) => {
        context.fillStyle = areaColors[index];
        context.fillRect(mapX(area.startX), margin, mapX(area.endX) - mapX(area.startX), height - margin * 2);
      });
      context.strokeStyle = "#9a7950";
      context.lineWidth = 8;
      context.beginPath();
      context.moveTo(mapX(0), mapY(450));
      context.lineTo(mapX(World.world.width), mapY(450));
      context.stroke();
      // Mata das bordas: o anel escuro mostra onde o mapa termina.
      context.fillStyle = "#1d3323";
      World.borderBands.forEach(band => context.fillRect(mapX(band.x), mapY(band.y), Math.max(1, band.w / World.world.width * (width - margin * 2)), Math.max(1, band.h / World.world.height * (height - margin * 2))));
      context.fillStyle = "#9ba2a6";
      World.solids.filter(solid => !solid.border).forEach(solid => context.fillRect(mapX(solid.x), mapY(solid.y), Math.max(1, solid.w / World.world.width * (width - margin * 2)), Math.max(1, solid.h / World.world.height * (height - margin * 2))));
      // Galerias subterrâneas: bloco escuro sob a cidade, ligado pelo poço.
      context.fillStyle = "#394048";
      context.fillRect(mapX(World.underground.x), mapY(World.underground.y), World.underground.width / World.world.width * (width - margin * 2), World.underground.height / World.world.height * (height - margin * 2));
      context.fillRect(mapX(World.underground.gapX), mapY(World.underground.entrance.top), Math.max(1.5, World.underground.entrance.width / World.world.width * (width - margin * 2)), (World.underground.y - World.underground.entrance.top) / World.world.height * (height - margin * 2));
      enemies.forEach(enemy => {
        if (!enemy.visible || state.enemies[enemy.enemyIndex].hp <= 0) return;
        const selected = enemy.enemyIndex === selectedEnemyIndex;
        context.fillStyle = selected ? "#ffd166" : "#dc4d4d";
        context.beginPath();
        context.arc(mapX(enemy.x), mapY(enemy.y), selected ? 4 : 2.5, 0, Math.PI * 2);
        context.fill();
      });
      context.fillStyle = "#59e88c";
      state.groundDrops.forEach(drop => {
        context.beginPath();
        context.arc(mapX(drop.x), mapY(drop.y), 2.4, 0, Math.PI * 2);
        context.fill();
      });
      context.fillStyle = "#f1bd55";
      context.beginPath(); context.arc(mapX(World.merchant.x), mapY(World.merchant.y), 3.2, 0, Math.PI * 2); context.fill();
      context.fillStyle = "#fff";
      context.beginPath(); context.arc(mapX(player.x), mapY(player.y), 4.2, 0, Math.PI * 2); context.fill();
      context.strokeStyle = "#132330";
      context.lineWidth = 2;
      context.stroke();
      context.restore();
    }

    update(_, delta) {
      if (!player) return;
      this.movePlayer(delta);
      this.tryCollectGroundDrop();
      enemies.forEach(enemy => {
        this.moveEnemy(enemy, delta);
        this.updateEnemyIndicators(enemy);
      });
      this.updateTargetMarker();
      if (this.time.now % 250 < delta) { updateHud(); this.drawMinimap(); }
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

  function selectAction(action) {
    if (menuOpen || playerDying) return;
    pendingMeleeEnemyIndex = null;
    state.action = action; updateHud(); persistGame();
    const weapon = ItemRules.weaponForAction(state.equipment, action);
    announce(action === "close" ? `${weapon.name} selecionada: atacar aproxima você do inimigo mais próximo.` : `${weapon.name} selecionada: carregador com ${state.ammo[weapon.id]} de ${weapon.magazineSize} tiros${CombatRules.DEVELOPMENT_INFINITE_RESERVE ? " e reserva infinita" : ""}.`);
  }

  function resolveAction(allowApproach = true, forcedTarget = null) {
    if (!actionReady || playerDying || state.hp <= 0 || menuOpen) return;
    const range = state.action === "close" ? 58 : 285;
    let target = forcedTarget;
    if (target && (!target.visible || state.enemies[target.enemyIndex].hp <= 0 || Targeting.distanceBetween(player, target) > range)) target = null;
    if (!target) target = combatTarget(range);

    if (!target && state.action === "close" && allowApproach) {
      const approachTarget = selectedEnemy() || nearestEnemy();
      if (!approachTarget) { announce("Não há inimigos vivos para atacar."); return; }
      pendingMeleeEnemyIndex = approachTarget.enemyIndex;
      player.setData("tapTarget", null);
      const approachDefinition = EnemyRules.definition(approachTarget.definitionId);
      const blade = ItemRules.weaponForAction(state.equipment, "close");
      announce(`Aproximando com ${blade.name} até ${approachDefinition.name} nível ${approachDefinition.level}. Use o joystick para cancelar.`);
      return;
    }
    if (!target) {
      const selectedWeapon = ItemRules.weaponForAction(state.equipment, state.action);
      announce(state.action === "close" ? `Não foi possível alcançar o inimigo com ${selectedWeapon.name}.` : `Nenhum inimigo ao alcance de ${selectedWeapon.name}.`);
      return;
    }

    pendingMeleeEnemyIndex = null;
    const action = state.action;
    const weapon = ItemRules.weaponForAction(state.equipment, action);
    if (action === "far") {
      if (reloadState?.weaponId === weapon.id) { announce(`${weapon.name} ainda está recarregando.`); return; }
      if (state.ammo[weapon.id] <= 0) { reloadFirearm(); return; }
      state.ammo[weapon.id] -= 1;
    }
    const skillName = CombatRules.WEAPONS[action].skill;
    const cooldown = weapon.cooldown;
    actionReady = false;
    setTimeout(() => { actionReady = true; }, cooldown);
    // O personagem vira para o alvo antes do golpe, para a animação apontar na direção certa.
    faceDirection(AnimationRules.directionFor(target.x - player.x, target.y - player.y));
    sceneRef.playAttackSound(action);
    sceneRef.playAttackAnimation(action);
    if (!CombatRules.rollHit(action, isPlayerMoving())) {
      sceneRef.showMissNumber(target);
      announce("O disparo errou o alvo durante o movimento.");
      updateHud(); persistGame();
      if (state.ammo[weapon.id] === 0) reloadFirearm();
      return;
    }
    const roll = CombatRules.rollDamage(action, state.skills[skillName].level, state.level, weapon);
    const damage = roll.damage;
    CombatRules.grantSkillXp(state.skills[skillName]);
    const enemyState = state.enemies[target.enemyIndex];
    enemyState.hp = Math.max(0, enemyState.hp - damage);
    target.setAlpha(0.35);
    setTimeout(() => { if (target.visible) target.setAlpha(1); }, 130);
    sceneRef.showDamageNumber(target, damage, roll.critical);
    sceneRef.updateEnemyIndicators(target);
    announce(`${action === "close" ? "Golpe de faca" : "Disparo"} atingiu o inimigo${roll.critical ? " com dano crítico" : ""}.`);
    if (enemyState.hp === 0) {
      const defeatedDefinition = EnemyRules.definition(target.definitionId);
      target.setVisible(false); target.nameLabel.setVisible(false);
      if (selectedEnemyIndex === target.enemyIndex) selectedEnemyIndex = null;
      sceneRef.updateEnemyIndicators(target);
      sceneRef.updateTargetMarker();
      state.coins += defeatedDefinition.coins;
      // Ouro e XP continuam diretos; só o núcleo vira entidade física, para a coleta
      // ser uma decisão de movimento (voltar ao local do abate) e não um crédito invisível.
      const coreDrop = EnemyRules.rollCoreDrop(defeatedDefinition);
      let groundDrop = null;
      if (coreDrop) {
        groundDrop = DropRules.createDrop(coreDrop.level, target.x, target.y, World.world);
        if (groundDrop) {
          state.groundDrops = DropRules.addDrop(state.groundDrops, groundDrop);
          sceneRef.syncGroundDropVisuals();
        }
      }
      const levelsGained = State.grantXp(state, defeatedDefinition.xp);
      if (levelsGained > 0) state.hp = maxHp();
      sceneRef.showExperienceNumber(defeatedDefinition.xp);
      announce(`+${defeatedDefinition.xp} XP${groundDrop ? ` e um núcleo nível ${groundDrop.level} caiu no chão: passe por cima para coletar` : ""}.`);
      const remaining = livingEnemyCount();
      el("quest-text").textContent = remaining > 0 ? `Restam ${remaining} inimigos antes da clareira.` : "A trilha está livre. Encontre a fogueira e o mercador.";
      sceneRef.scheduleEnemyRespawn(target);
    }
    updateHud(); persistGame();
    if (action === "far" && state.ammo[weapon.id] === 0) reloadFirearm();
  }

  const menuTitles = { character: "PERSONAGEM", status: "STATUS", skills: "HABILIDADES", inventory: "EQUIPAMENTOS" };
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

  function useInventoryItem(itemId) {
    const item = ItemRules.ITEMS[itemId];
    if (!item) return;
    let purchased = false;
    if (!state.ownedItems.includes(item.id)) {
      if (!merchantMode) { announce(`${item.name} só pode ser comprado com o mercador.`); return; }
      if (state.coins < item.price) { announce(`Ouro insuficiente para comprar ${item.name}.`); return; }
      state.coins -= item.price;
      state.ownedItems.push(item.id);
      purchased = true;
    }
    const wasEquipped = state.equipment[item.slot] === item.id;
    state.equipment = ItemRules.equip(state.equipment, itemId);
    updateHud();
    persistGame();
    if (purchased) announce(`${item.name} comprado por ${item.price} de ouro e equipado.`);
    else if (wasEquipped && !item.action) announce(`${item.name} removido.`);
    else announce(`${item.name} equipado.`);
  }

  function sellAllCores() {
    let total = 0;
    let amount = 0;
    Object.entries(state.cores).forEach(([level, count]) => {
      total += count * EnemyRules.coreValue(level);
      amount += count;
      state.cores[level] = 0;
    });
    state.coins += total;
    return { amount, total };
  }

  function setMenuOpen(open) {
    menuOpen = open;
    const panel = el("smartphone-menu");
    panel.hidden = !open;
    el("open-menu").setAttribute("aria-expanded", String(open));
    if (open) {
      updateHud();
      pendingMeleeEnemyIndex = null;
      player?.setData("tapTarget", null);
      sceneRef?.scene.pause();
      el("close-menu").focus();
    } else {
      merchantMode = false;
      sceneRef?.scene.resume();
      el("open-menu").focus();
    }
  }

  function interact() {
    if (menuOpen || playerDying) return;
    // O alvo vem da mesma regra que libera o botão FALAR: se o botão não apareceu,
    // não há interação escondida esperando nesta posição.
    const target = player ? ControlRules.interactionFor(player, World.merchant, World.campfire) : null;
    if (target?.kind === "merchant" && sceneRef?.merchant) {
      state.talked = true;
      const sale = sellAllCores();
      merchantMode = true;
      selectMenuPage("inventory");
      setMenuOpen(true);
      el("menu-title").textContent = "MERCADOR";
      persistGame();
      announce(sale.amount > 0
        ? `Mercador comprou ${sale.amount} núcleo${sale.amount === 1 ? "" : "s"} por ${sale.total} de ouro. Equipamentos disponíveis para compra.`
        : "Mercador: Não há núcleos para vender. Veja os equipamentos disponíveis.");
    } else if (target?.kind === "campfire" && sceneRef?.campfire) {
      announce("A fogueira marca a clareira segura. O mercador está logo adiante.");
    } else if (nearestEnemy(100)) announce("Um inimigo zumbi bloqueia a trilha. Selecione uma arma e ataque.");
    else announce("Não há nada para interagir por perto.");
  }

  const joystick = el("joystick"), joystickKnob = el("joystick-knob");
  let joystickPointer = null;
  function resetJoystick() { touch.x = 0; touch.y = 0; joystickPointer = null; joystickKnob.style.transform = "translate(0px, 0px)"; joystick.classList.remove("is-active"); }
  function moveJoystick(event) {
    if (joystickPointer !== event.pointerId) return;
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const max = Math.min(rect.width, rect.height) * 0.30;
    let x = event.clientX - cx, y = event.clientY - cy;
    const length = Math.hypot(x, y);
    if (length > max) { x = x / length * max; y = y / length * max; }
    // O knob mostra a deflexão bruta; o vetor de movimento passa pela zona morta e
    // pela curva de precisão (ControlRules), então tremor central não anda e a
    // inclinação leve anda devagar.
    const analog = ControlRules.analogVector(x / max, y / max);
    touch.x = analog.x; touch.y = analog.y;
    joystickKnob.style.transform = `translate(${x}px, ${y}px)`;
    joystick.classList.toggle("is-active", analog.magnitude > 0);
  }
  joystick.addEventListener("pointerdown", event => { event.preventDefault(); joystickPointer = event.pointerId; joystick.setPointerCapture(event.pointerId); moveJoystick(event); });
  joystick.addEventListener("pointermove", moveJoystick);
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(name => joystick.addEventListener(name, event => { if (joystickPointer === event.pointerId) resetJoystick(); }));
  ["action-close", "touch-action-close"].forEach(id => el(id)?.addEventListener("click", () => selectAction("close")));
  ["action-far", "touch-action-far"].forEach(id => el(id)?.addEventListener("click", () => selectAction("far")));
  ["interact", "touch-interact"].forEach(id => el(id)?.addEventListener("click", interact));
  ["reload", "touch-reload"].forEach(id => el(id)?.addEventListener("click", reloadFirearm));
  el("attack").addEventListener("pointerdown", event => { event.preventDefault(); resolveAction(); });
  el("save").addEventListener("click", () => persistGame(true));
  el("open-menu").addEventListener("click", () => { merchantMode = false; setMenuOpen(!menuOpen); });
  el("close-menu").addEventListener("click", () => setMenuOpen(false));
  document.querySelectorAll("[data-menu-tab]").forEach(button => button.addEventListener("click", () => selectMenuPage(button.dataset.menuTab)));
  document.querySelectorAll("[data-equip-item]").forEach(button => button.addEventListener("click", () => useInventoryItem(button.dataset.equipItem)));
  document.querySelectorAll("[data-open-item-slot]").forEach(button => button.addEventListener("click", () => selectMenuPage("inventory")));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menuOpen) { setMenuOpen(false); return; }
    if (event.code === "Space") { event.preventDefault(); resolveAction(); }
    if (event.key.toLowerCase() === "e") interact();
    if (event.key.toLowerCase() === "r") reloadFirearm();
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
