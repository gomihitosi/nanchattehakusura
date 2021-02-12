const se = {};
const sePlay = (key, isStop=true) => {
  if(!se || !(key in se)) return;
  if(isStop) se[key].stop();
  se[key].play();
}
const image = {};
const status = {
  startDate: null, clearDate: null, 
  isBattle: false, isClear: false, floor: 0, speed: 0, kill: 0, death: 0, turn: 0,
  level: 1, maxHp:10, hp:10, atk:1, def:1, exp:0,
  needHpExp:1, needAtkExp:1, needDefExp:1,
};

phina.define('MainScene', {
  superClass: 'DisplayScene',
  init: function (option) {
    this.superInit(option);

    status.startDate = new Date();

    this.backgroundColor = 'COLOR.black';
    this.mainGroup = DisplayElement().addChildTo(this)
      .setPosition(0, 0);

    ["busi", "piyo", "piro"].forEach(key=>{
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
        const text = `なんちゃってはくすらを${status.isClear ? Math.floor((status.clearDate - status.startDate) / 1000) + '秒でクリアしたよ' : '遊んでるよ'}！`
          + ` [LEVEL:${status.level} K/D:${status.kill}/${status.death}`
          + ` HP-ATK-DEF-EXP:${status.hp}-${status.atk}-${status.def}-${status.exp}`
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
        const filterdData = SPEED_DATA.filter(v=>v.needLevel <= status.level);
        if(filterdData.length === 1) return;

        sePlay('piyo');
        status.speed++;
        if(status.speed >= filterdData.length) status.speed = 0;
        this.speed.label.text = filterdData[status.speed].text;
        this.pushLog(`<color:${COLOR.green}>[System]</color>戦闘速度を[${filterdData[status.speed].text}]に変更しました。`);
      });
    this.speed.label = Label({text: `x1`, fill: COLOR.black, fontSize: 30, fontWeight:600})
      .addChildTo(this.group)
      .setPosition(480, 55)

    this.encounter.shape = RectangleShape({
        width: 495, height: 120, cornerRadius: 5, fill: COLOR.white, strokeWidth: 0,
      }).addChildTo(this.group)
      .setPosition(270, 775)
      .on("pointstart", () => {
        status.isBattle = true;
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
    status.floor++;
    this.popUpLabel(1, OBJECT_DATA.label.floor.x, OBJECT_DATA.label.floor.y);
    this.updateStatusLabel();

    const rawEnemyData = status.floor >= ENEMY_DATA.length ? ENEMY_DATA[0] : ENEMY_DATA[status.floor];
    const enemyStatus = {...rawEnemyData};
    if(enemyStatus.image !== this.battle.sprite.enemy.imageName) {
      this.battle.sprite.enemy.setImage(image[enemyStatus.image]);
      this.battle.sprite.enemy.imageName = enemyStatus.image;
    }
    
    if(status.floor === 30) {
      this.pushLog(`<color:${COLOR.red}>[${enemyStatus.name}]</color>「よくぞココまで来たなニンゲンよ。私が直々に相手をしてやろう」`);
    } else {
      this.pushLog(`<color:${COLOR.red}>[${enemyStatus.name}]</color>「${getEncountText()}」`);
    }
    
    const battleEnd = (continueBattle)=> {
      this.battle.sprite.player.setPosition(OBJECT_DATA.sprite.player.x, OBJECT_DATA.sprite.player.y)
      this.battle.sprite.enemy.setPosition(OBJECT_DATA.sprite.enemy.x, OBJECT_DATA.sprite.enemy.y)

      if(!continueBattle) {
        this.pushLog(`<color:${COLOR.blue}>[あなた]</color>は`
          + `<color:${COLOR.green}>${status.floor}F</color>で`
          + `<color:${COLOR.red}>[${enemyStatus.name}]</color>に負けました…。`);
        this.pushLog(SEPARATION);
        status.hp = status.maxHp;
        status.isBattle = false;
        status.floor = 0;
        this.updateStatusLabel();
      } else {
        this.pushLog(`<color:${COLOR.blue}>[あなた]</color>は`
          + `<color:${COLOR.green}>${status.floor}F</color>で`
          + `<color:${COLOR.red}>[${enemyStatus.name}]</color>に勝ちました！`);
        this.pushLog(SEPARATION);
        if(status.floor < 30) {
          this.encount();
        } else {
          status.hp = status.maxHp;
          status.isBattle = false;
          status.floor = 0;
          this.updateStatusLabel();
          if(!status.isClear) {
            status.isClear = true;
            status.clearDate = new Date();
            this.messageOpen('魔王クソゲム「調子乗ってすいませんした…」\nあなた「いいよ～～」\n\nあなたは無事魔王クソゲムを討ち倒し\n世界に平和をもたらすことが出来ました！\n\nついでに魔物達も悪そうじゃなかったので、\nそのまま仲良く暮らすことにしましたとさ\n\nめでたしめでたし。\n\n[クリック か タッチ で閉じる]');
          }
        }
      }
    }
    const attack = () => {
      sePlay('busi');

      const calcPlayerDamage = status.def - enemyStatus.atk;
      const calcEnemyDamage = enemyStatus.def - status.atk;

      // 無限ループ回避
      if(calcPlayerDamage >= 0 && calcEnemyDamage >= 0) status.turn++;

      if(status.turn > 10) {
        this.pushLog(`<color:${COLOR.green}>[神]</color>「いいかげんにして」`);
      }

      const playerDamage = status.turn > 10 ? -9999 : calcPlayerDamage > 0 ? 0 : calcPlayerDamage;
      const enemyDamage = calcEnemyDamage > 0 ? 0 : calcEnemyDamage;

      this.pushLog(`<color:${COLOR.blue}>[あなた]</color>に${Math.abs(playerDamage)}のダメージ！`
        + ` <color:${COLOR.red}>[${enemyStatus.name}]</color>に${Math.abs(enemyDamage)}のダメージ！`);
      
      this.popUpLabel(playerDamage, OBJECT_DATA.label.hp.x, OBJECT_DATA.label.hp.y,);
      this.popUpLabel(enemyDamage, centerX, OBJECT_DATA.sprite.enemy.y - 64, 90);
      status.hp += playerDamage;
      enemyStatus.hp += enemyDamage;
      this.updateStatusLabel();

      if(status.hp <= 0) {
        status.turn = 0;

        status.death++;
        this.popUpLabel(1, OBJECT_DATA.label.death.x, OBJECT_DATA.label.death.y);
        this.updateStatusLabel();

        this.battle.sprite.player.tweener.to({x: -256, y: -256}, speedDiv).play();
        this.battle.sprite.enemy.tweener.to({x: -256}, speed).call(()=>{
          battleEnd(false);
        }).play();
        if(status.floor === 30) {
          this.pushLog(`<color:${COLOR.red}>[${enemyStatus.name}]</color>「フン、所詮はニンゲンか…」`);
        } else {
          this.pushLog(`<color:${COLOR.red}>[${enemyStatus.name}]</color>「${getWinText()}」`);
        }
        return;
      } else if(enemyStatus.hp <= 0) {
        status.kill++;
        this.popUpLabel(1, OBJECT_DATA.label.kill.x, OBJECT_DATA.label.kill.y);

        status.exp += enemyStatus.exp;
        this.popUpLabel(enemyStatus.exp, OBJECT_DATA.label.exp.x, OBJECT_DATA.label.exp.y);
        this.updateStatusLabel();

        this.battle.sprite.player.tweener.to({x: SCREEN_SIZE_X + 256}, speed).call(()=>{
          battleEnd(true);
        }).play();
        this.battle.sprite.enemy.tweener.to({x: SCREEN_SIZE_X + 256, y: -256}, speedDiv).play();
        if(status.floor === 30) {
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
    const speed = SPEED_DATA[status.speed].speed;
    const speedDiv = SPEED_DATA[status.speed].speed / 5;

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
    if(status.exp < status[key]) {
      this.updateStatusLabel();
      return;
    }
    status.level++;
    sePlay('piyo');

    const filterdData = SPEED_DATA.filter(v=>v.needLevel===status.level);
    if(filterdData.length > 0) {
      this.pushLog(`<color:${COLOR.green}>[System]</color>戦闘速度[${filterdData[0].text}]が開放されました。`); 
    }
    this.popUpLabel(-status[key], OBJECT_DATA.label.exp.x, OBJECT_DATA.label.exp.y);
    this.popUpLabel(data.value, OBJECT_DATA.label[key].x, OBJECT_DATA.label[key].y);

    if(data.key === 'hp') {
      status.maxHp += data.value;
      status.hp = status.maxHp;
    } else {
      status[data.key] += data.value;
    }

    status.exp -= status[key];
    status[key] += Math.ceil(status[key] * 0.25);
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
      this.status.label[key].text = `${key.toUpperCase()}:${status[key]}`;
    });
    
    ['needHpExp', 'needAtkExp', 'needDefExp'].forEach(key => {
      this.status.label[key].text = `${status[key]}EXPで強化`;
      
      const isActive = !status.isBattle && status.exp >= status[key];
      this.status.shape[key].setInteractive(isActive);
      this.status.shape[key].alpha = isActive ? 1 : 0.5;
    });

    this.encounter.label.text = status.isBattle ? '出撃中' : '出撃';
    this.encounter.shape.setInteractive(!status.isBattle);
    this.encounter.shape.alpha = !status.isBattle ? 1 : 0.5;
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
