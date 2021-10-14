const se = {};
const sePlay = (key, isStop=true) => {
  if(!se || !(key in se)) return;
  if(isStop) se[key].stop();
  se[key].play();
}
const image = {};
const GameData = {
  startDate: null, clearDate: null, 
  isBattle: false, isClear: false, floor: 0, speed: 0, kill: 0, death: 0, turn: 0,
  level: 1, maxHp:10, hp:10, atk:1, def:1, exp:0,
  needHpExp:1, needAtkExp:1, needDefExp:1,
};
let globalGameObject;

phina.define('MainScene', {
  superClass: 'DisplayScene',
  init: function (option) {
    this.superInit(option);

    GameData.startDate = new Date();

    this.backgroundColor = 'COLOR.black';
    this.mainGroup = DisplayElement().addChildTo(this)
      .setPosition(0, 0);

    ["busi", "piyo", "piro", "crit"].forEach(key=>{
      se[key] = AssetManager.get("sound", key);
      se[key].volume = 0.5;
    });

    ["anya", "sura", "buta", "iwao", "maou"].forEach(key=>{
      image[key] = AssetManager.get("image", key);
    });
    
    // iPhone音声対応
    document.querySelector('canvas').addEventListener('touchstart', function touch(e) {
      for(let key in se){
        se[key].volume = 0;
        se[key].play();
        se[key].stop();
        se[key].volume = 0.5;
      }
      e.currentTarget.removeEventListener(e.type, touch);
    });

    this.gameObject = new GameObject(this.mainGroup);
    this.gameObject.initialized();
    
    // TODO: うーん
    globalGameObject = this.gameObject;
  },
  update: function (app) {
  },
});

class GameObject {
  constructor(group) {
    this.group = group;

    this.status = { shape: {}, label:{} };
    this.encounter = { shape: {}, label: {} };
    this.battle = { sprite:{} };
    this.speed = { shape: {}, label:{} };
    this.tweet = { sprite: {}, label:{} };
    this.save = { sprite: {}, label:{} };

    this.message = { shape: {}, label:{} };
  }
  initialized() {
    ['hp', 'atk', 'def', 'exp', 'floor', 'level', 'kill', 'death'].forEach(key => {
      this.status.label[key] = this.getLabel(key);
    });
    
    ['needHpExp', 'needAtkExp', 'needDefExp'].forEach(key => {
      this.status.shape[key] = this.getShape(key)
        .on("pointstart", () => { this.levelUp(key) });
      this.status.label[key] = this.getLabel(key);
    });

    this.logArea = ColorfulLabelArea({
      text: LOG.join("\n"),
      width: 485, height: 265, x:270, y:240,
      fill: "white", strokeWidth: 0, fontSize: 15,
      backgroundColor: '#222',
    }).addChildTo(this.group)
      .setInteractive(true);
    const a = this.logArea.getLines().length * this.logArea.lineSize - this.logArea.height;
    if(this.logArea.scrollY > a) this.logArea.scrollY = a;

    this.logArea.on('pointmove', (e) => {
      this.logArea.scrollY -= e.pointer.deltaPosition.y;
      const a = this.logArea.getLines().length * this.logArea.lineSize - this.logArea.height;
      if(this.logArea.scrollY < 0) this.logArea.scrollY = 0;
      if(this.logArea.scrollY > a) this.logArea.scrollY = a;
    });

    this.tweet.shape = RectangleShape({
        width: 80, height: 60, cornerRadius: 5, fill: COLOR.white, strokeWidth: 0,
      }).addChildTo(this.group)
      .setPosition(380, 55)
      .setInteractive(true);
    // TODO: iPhone対応の為onclickに直接付ける
    this.tweet.shape.on('click', (e) => {
        const text = `なんちゃってはくすらを${GameData.isClear ? Math.floor((GameData.clearDate - GameData.startDate) / 1000) + '秒でクリアしたよ' : '遊んでるよ'}！`
          + ` [LEVEL:${GameData.level} K/D:${GameData.kill}/${GameData.death}`
          + ` HP-ATK-DEF-EXP:${GameData.hp}-${GameData.atk}-${GameData.def}-${GameData.exp}`
          + ` VERSION:${VERSION}]`;
        const url = Twitter.createURL({
          text: text,
          hashtags: 'なんちゃってはくすら',
          url: location.href,
        });
        window.open(url, 'share window', 'width=480, height=320');
    });
    this.tweet.sprite = Sprite("tweet").addChildTo(this.group)
      .setPosition(380, 55)
    
    this.speed.shape = RectangleShape({
        width: 80, height: 60, cornerRadius: 5, fill: COLOR.white, strokeWidth: 0,
      }).addChildTo(this.group)
      .setPosition(480, 55)
      .setInteractive(true)
      .on("pointstart", () => {
        const filterdData = SPEED_DATA.filter(v=>v.needLevel <= GameData.level);
        if(filterdData.length === 1) return;

        sePlay('piyo');
        GameData.speed++;
        if(GameData.speed >= filterdData.length) GameData.speed = 0;
        this.speed.label.text = filterdData[GameData.speed].text;
        this.pushLog(`<color:${COLOR.green}>[System]</color>戦闘速度を[${filterdData[GameData.speed].text}]に変更しました。`);
      });
    this.speed.label = Label({text: `x1`, fill: COLOR.black, fontSize: 30, fontWeight:600})
      .addChildTo(this.group)
      .setPosition(480, 55)

    this.encounter.shape = RectangleShape({
        width: 495, height: 120, cornerRadius: 5, fill: COLOR.white, strokeWidth: 0,
      }).addChildTo(this.group)
      .setPosition(270, 775)
      .on("pointstart", () => {
        GameData.isBattle = true;
        this.updateStatusLabel();
        this.encount();
      });
    this.encounter.label = Label({text: ``, fill: COLOR.black, fontSize: 60})
      .addChildTo(this.group)
      .setPosition(270, 775)

    this.battle.sprite.player = PixelSprite("anya").addChildTo(this.group)
      .setPosition(OBJECT_DATA.sprite.player.x, OBJECT_DATA.sprite.player.y)
      .setScale(4);
    this.battle.sprite.enemy = PixelSprite("sura").addChildTo(this.group)
      .setPosition(OBJECT_DATA.sprite.enemy.x, OBJECT_DATA.sprite.enemy.y)
      .setScale(4);

    this.save.shape = RectangleShape({
        width: 120, height: 48, cornerRadius: 5, fill: COLOR.white, strokeWidth: 0,
      }).addChildTo(this.group)
      .setPosition(450, OBJECT_Y.need);
    this.save.label =  Label({ text: 'セーブ/ロード', fill: COLOR.black, fontSize: 15 })
      .addChildTo(this.group)
      .setPosition(450, OBJECT_Y.need)
      .on("pointstart", () => { openSave() });

    this.updateStatusLabel();

    this.messageGroup = DisplayElement().addChildTo(this.group)
      .setOrigin(0.5, 0.5)
      .setPosition(SCREEN_SIZE_X/2, SCREEN_SIZE_Y/2)
      .setScale(1, 0);

    this.message.shape = RectangleShape({
        width: SCREEN_SIZE_X, height: SCREEN_SIZE_Y, fill: COLOR.black, strokeWidth: 0,
      }).addChildTo(this.messageGroup)
      .setInteractive(true)
      .on("pointstart", (e) => {
        this.messageGroup.tweener
          .to({ scaleY: 0 }, 200, 'easeOutQuad').play();
        this.updateStatusLabel();
        this.speed.shape.setInteractive(true);
        this.tweet.shape.setInteractive(true);
      });
    this.message.shape.alpha = 0.8;
            
    this.message.label = Label({ text: '', fill: COLOR.white, fontSize: 24})
      .addChildTo(this.messageGroup)
      .setPosition(0, 0);

    this.messageOpen('魔王クソゲム「世界を…滅ぼす！」\nあなた「やだ～～」\n\n30Fに潜む魔王クソゲムを討つべく\n己を鍛えながらダンジョンに挑みましょう。\n\n[クリック か タッチ で閉じる]');
  }
  messageOpen(text) {
    Object.keys(this.status.shape).forEach(key=>this.status.shape[key].setInteractive(false));
    this.speed.shape.setInteractive(false)
    this.encounter.shape.setInteractive(false);
    this.tweet.shape.setInteractive(false);

    this.message.label.text = text;
    this.messageGroup.tweener
      .to({ scaleY: 1 }, 200, 'easeOutQuad').play()
  }
  encount() {
    sePlay('piro');
    GameData.floor++;
    this.popUpLabel(1, OBJECT_DATA.label.floor.x, OBJECT_DATA.label.floor.y);
    this.updateStatusLabel();

    const rawEnemyData = GameData.floor >= ENEMY_DATA.length ? ENEMY_DATA[0] : ENEMY_DATA[GameData.floor];
    const enemyStatus = {...rawEnemyData};
    if(enemyStatus.image !== this.battle.sprite.enemy.imageName) {
      this.battle.sprite.enemy.setImage(image[enemyStatus.image]);
      this.battle.sprite.enemy.imageName = enemyStatus.image;
    }
    
    if(GameData.floor === 30) {
      this.pushLog(`<color:${COLOR.red}>[${enemyStatus.name}]</color>「よくぞココまで来たなニンゲンよ。私が直々に相手をしてやろう」`);
    } else {
      this.pushLog(`<color:${COLOR.red}>[${enemyStatus.name}]</color>「${getEncountText()}」`);
    }
    
    const battleEnd = (continueBattle)=> {
      this.battle.sprite.player.setPosition(OBJECT_DATA.sprite.player.x, OBJECT_DATA.sprite.player.y)
      this.battle.sprite.enemy.setPosition(OBJECT_DATA.sprite.enemy.x, OBJECT_DATA.sprite.enemy.y)

      if(!continueBattle) {
        this.pushLog(`<color:${COLOR.blue}>[あなた]</color>は`
          + `<color:${COLOR.green}>${GameData.floor}F</color>で`
          + `<color:${COLOR.red}>[${enemyStatus.name}]</color>に負けました…。`);
        this.pushLog(SEPARATION);
        GameData.hp = GameData.maxHp;
        GameData.isBattle = false;
        GameData.floor = 0;
        this.updateStatusLabel();
      } else {
        this.pushLog(`<color:${COLOR.blue}>[あなた]</color>は`
          + `<color:${COLOR.green}>${GameData.floor}F</color>で`
          + `<color:${COLOR.red}>[${enemyStatus.name}]</color>に勝ちました！`);
        this.pushLog(SEPARATION);
        if(GameData.floor < 30) {
          this.encount();
        } else {
          GameData.hp = GameData.maxHp;
          GameData.isBattle = false;
          GameData.floor = 0;
          this.updateStatusLabel();
          if(!GameData.isClear) {
            GameData.isClear = true;
            GameData.clearDate = new Date();
            this.messageOpen('魔王クソゲム「調子乗ってすいませんした…」\nあなた「いいよ～～」\n\nあなたは無事魔王クソゲムを討ち倒し\n世界に平和をもたらすことが出来ました！\n\nついでに魔物達も悪そうじゃなかったので、\nそのまま仲良く暮らすことにしましたとさ\n\nめでたしめでたし。\n\n[クリック か タッチ で閉じる]');
          }
        }
      }
    }
    const attack = () => {
      // クリティカル判定
      const criticalRand = 50 * GameData.level / 200;
      const isCritical = (criticalRand > CRITICAL_MAX_PER ? CRITICAL_MAX_PER : criticalRand) >= Random.randfloat(0,100);

      sePlay(isCritical ? 'crit' : 'busi');

      const calcPlayerDamage = GameData.def - enemyStatus.atk;
      const calcEnemyDamage = (isCritical ? 0 : enemyStatus.def) - Math.floor(isCritical ? GameData.atk * 1.5 : GameData.atk);

      // 無限ループ回避
      if(calcPlayerDamage >= 0 && calcEnemyDamage >= 0) GameData.turn++;
      if(GameData.turn > GOD_LIMIT_TURN) {
        this.pushLog(`<color:${COLOR.green}>[神]</color>「いいかげんにして」`);
      }

      const playerDamage = GameData.turn > GOD_LIMIT_TURN ? -9999 : calcPlayerDamage > 0 ? 0 : calcPlayerDamage;
      const enemyDamage = calcEnemyDamage > 0 ? 0 : calcEnemyDamage;

      if(isCritical){
        this.pushLog(` <color:${COLOR.green}>!!!! クリティカル !!!!</color>`);
      }
      this.pushLog(`<color:${COLOR.blue}>[あなた]</color>に${Math.abs(playerDamage)}のダメージ！`
        + ` <color:${COLOR.red}>[${enemyStatus.name}]</color>に${Math.abs(enemyDamage)}のダメージ！`);
      
      this.popUpLabel(playerDamage, OBJECT_DATA.label.hp.x, OBJECT_DATA.label.hp.y,);
      this.popUpLabel(enemyDamage, centerX, OBJECT_DATA.sprite.enemy.y - 64, 90);
      GameData.hp += playerDamage;
      enemyStatus.hp += enemyDamage;
      this.updateStatusLabel();

      if(GameData.hp <= 0) {
        GameData.turn = 0;

        GameData.death++;
        this.popUpLabel(1, OBJECT_DATA.label.death.x, OBJECT_DATA.label.death.y);
        this.updateStatusLabel();

        this.battle.sprite.player.tweener.to({x: -256, y: -256}, speedDiv).play();
        this.battle.sprite.enemy.tweener.to({x: -256}, speed).call(()=>{
          battleEnd(false);
        }).play();
        if(GameData.floor === 30) {
          this.pushLog(`<color:${COLOR.red}>[${enemyStatus.name}]</color>「フン、所詮はニンゲンか…」`);
        } else {
          this.pushLog(`<color:${COLOR.red}>[${enemyStatus.name}]</color>「${getWinText()}」`);
        }
        return;
      } else if(enemyStatus.hp <= 0) {
        GameData.kill++;
        this.popUpLabel(1, OBJECT_DATA.label.kill.x, OBJECT_DATA.label.kill.y);

        GameData.exp += enemyStatus.exp;
        this.popUpLabel(enemyStatus.exp, OBJECT_DATA.label.exp.x, OBJECT_DATA.label.exp.y);
        this.updateStatusLabel();

        this.battle.sprite.player.tweener.to({x: SCREEN_SIZE_X + 256}, speed).call(()=>{
          battleEnd(true);
        }).play();
        this.battle.sprite.enemy.tweener.to({x: SCREEN_SIZE_X + 256, y: -256}, speedDiv).play();
        if(GameData.floor === 30) {
          this.pushLog(`<color:${COLOR.red}>[${enemyStatus.name}]</color>「ば、バカな！私が負け…る…とは…」`);
        } else {
          this.pushLog(`<color:${COLOR.red}>[${enemyStatus.name}]</color>「${getLoseText()}」`);
        }
        return;
      }
      this.battle.sprite.player.tweener.to({x: centerX - 64}, speedDiv, 'easeOutQuint').to({x: centerX}, speedDiv).play();
      this.battle.sprite.enemy.tweener.to({x: centerX + 64}, speedDiv, 'easeOutQuint').to({x: centerX}, speedDiv).call(()=>{
        attack();
      }).play();
    }
    const centerX = SCREEN_SIZE_X / 2;
    const speed = SPEED_DATA[GameData.speed].speed;
    const speedDiv = SPEED_DATA[GameData.speed].speed / 5;

    this.battle.sprite.player.tweener.to({x: centerX}, speed).play();
    this.battle.sprite.enemy.tweener.to({x: centerX}, speed).call(()=>{
      attack();
    }).play();
  }
  getLabel (key) {
    const data = OBJECT_DATA.label[key];
    return Label({ text: '', fill: data.fill, fontSize: data.fontSize, fontWeight: data.fontWeight, })
      .addChildTo(this.group)
      .setPosition(data.x, data.y);
  }
  getShape(key) {
    const data = OBJECT_DATA.label[key];
    return RectangleShape({
        width: 115, height: 48, cornerRadius: 5, fill: COLOR.white, strokeWidth: 0,
      }).addChildTo(this.group)
      .setPosition(data.x, data.y);
  }
  levelUp (key) {
    const data = LEVEL_UP_DATA[key];
    if(GameData.exp < GameData[key]) {
      this.updateStatusLabel();
      return;
    }
    GameData.level++;
    sePlay('piyo');

    const filterdData = SPEED_DATA.filter(v=>v.needLevel===GameData.level);
    if(filterdData.length > 0) {
      this.pushLog(`<color:${COLOR.green}>[System]</color>戦闘速度[${filterdData[0].text}]が開放されました。`); 
    }
    this.popUpLabel(-GameData[key], OBJECT_DATA.label.exp.x, OBJECT_DATA.label.exp.y);
    this.popUpLabel(data.value, OBJECT_DATA.label[key].x, OBJECT_DATA.label[key].y);

    if(data.key === 'hp') {
      GameData.maxHp += data.value;
      GameData.hp = GameData.maxHp;
    } else {
      GameData[data.key] += data.value;
    }

    GameData.exp -= GameData[key];
    GameData[key] += Math.ceil(GameData[key] * 0.25);
    this.updateStatusLabel();
  }
  pushLog(text) {
    LOG.push(text);
    // 100行まで保持
    if(LOG.length >= 100) {
      LOG.splice(0, LOG.length - 100);
    }
    this.logArea.text = LOG.join("\n");
    this.logArea.scrollY = this.logArea.getLines().length * this.logArea.lineSize - this.logArea.height;
  }
  updateStatusLabel() {
    ['hp', 'atk', 'def', 'exp', 'floor', 'level', 'kill', 'death'].forEach(key => {
      this.status.label[key].text = `${key.toUpperCase()}:${GameData[key]}`;
    });
    
    ['needHpExp', 'needAtkExp', 'needDefExp'].forEach(key => {
      this.status.label[key].text = `${GameData[key]}EXPで強化`;
      
      const isActive = !GameData.isBattle && GameData.exp >= GameData[key];
      this.status.shape[key].setInteractive(isActive);
      this.status.shape[key].alpha = isActive ? 1 : 0.5;
    });

    this.save.label.setInteractive(!GameData.isBattle);
    this.save.shape.alpha = !GameData.isBattle ? 1 : 0.5;

    this.encounter.label.text = GameData.isBattle ? '出撃中' : '出撃';
    this.encounter.shape.setInteractive(!GameData.isBattle);
    this.encounter.shape.alpha = !GameData.isBattle ? 1 : 0.5;
  }
  popUpLabel(value, x, y, size=30) {
    // 負の整数の場合は赤、それ以外は白
    // 正の整数の場合は＋を接頭辞として付ける
    const color = Number.isInteger(value) && value < 0 ? COLOR.red: COLOR.white;
    const text = Number.isInteger(value) && value > 0 ? `+${value}`: value;

    const pop = Label({
      text: text, fontSize: size,　fill: color,
      stroke: COLOR.black, strokeWidth: 5, fontWeight: 900,
    });
    // TODO: オブジェクトが残り続けるのでタグ付けして消去
    pop.tag = "popup";
    this.group.children.eraseIfAll(v=>{
      return v.tag === 'popup' && !v.tweener.playing
    });
    pop.addChildTo(this.group)
      .setPosition(x, y)
      .tweener.setLoop(false).by({y: -20}, 150, "easeOutQuad").wait(300).fadeOut(100).play();
  }
}
