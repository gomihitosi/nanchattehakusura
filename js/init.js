phina.globalize();

const SCREEN_SIZE_X = 540;
const SCREEN_SIZE_Y = 960;
const FPS = 60;

const getSupportExt = () => {
  const audio = new Audio();
  if (audio.canPlayType("audio/mp3") === "maybe") {
    return "mp3";
  } else if (audio.canPlayType("audio/ogg") === "maybe") {
    return "ogg";
  } else if (audio.canPlayType("audio/wav") === "maybe") {
    return "wav";
  }
  return "";
};
const SUPPORT_EXT = getSupportExt();

const ASSETS = {
  image: {
    tweet: "assets/image/tweet.png",
    anya: "assets/image/001.png",
    sura: "assets/image/002.png",
    buta: "assets/image/003.png",
    iwao: "assets/image/004.png",
    maou: "assets/image/005.png",
  },
  sound: {
    'busi': 'assets/sound/busi.' + SUPPORT_EXT,
    'piro': 'assets/sound/piro.' + SUPPORT_EXT,
    'piyo': 'assets/sound/piyo.' + SUPPORT_EXT,
    'crit': 'assets/sound/crit.' + SUPPORT_EXT,
  },
  font: {},
};

const SCENES = [
  {
    label: "main",
    className: "MainScene",
    nextLabel: "main",
  },
];

phina.define("LoadingScene", {
  superClass: "DisplayScene",

  init: function (options) {
    this.superInit(options);

    this.backgroundColor = "#000";

    const loader = phina.asset.AssetLoader();
    loader.onprogress = function (e) {
      label.text = `${(e.progress * 100).toFixed(0)}%`;
    };

    const label = Label({
      text: "0%",
      fill: "#FFF",
      fontSize: 12,
    })
      .addChildTo(this)
      .setPosition(this.gridX.center(), this.gridY.center(0.5));

    const progressBar = Gauge({
      value: 0,
      height: 4,
      gaugeColor: "#d63030",
      stroke: false,
      fill: "#222",
    })
      .setPosition(this.gridX.center(), this.gridY.center())
      .addChildTo(this);

    loader.onprogress = function (e) {
      progressBar.value = e.progress;
    };

    loader.onload = () => {
      this.flare("loaded");
    };

    loader.load(options.assets);
  },
});

phina.main(function () {
  const app = GameApp({
    query: "canvas",
    startLabel: "main",
    fit: true,
    assets: ASSETS,
    width: SCREEN_SIZE_X,
    height: SCREEN_SIZE_Y,
    scenes: SCENES,
    fps: FPS,
  });
  app.run();
});

// https://qiita.com/Negiwine_jp/items/2fb5258f42a8a401c126
phina.define('PixelSprite', {
  superClass: 'Sprite',
  init: function(image, width, height){
    this.superInit(image, width, height);
  },
  draw: function(canvas){
    canvas.save();
    canvas.imageSmoothingEnabled = false;
    this.superMethod('draw', canvas);
    canvas.restore();
  },
});

// https://github.com/phinajs/phina.js/pull/183/commits/ca5b07fb07fdd5751501dc78d9aedeb20e960b0f
phina.define('ColorfulLabelArea', {
	superClass: 'LabelArea',

	init: function(params) {
		this.superInit(params);

		// 色を指定する開始および終了タグ
		this.colorStartTag = params.colorStartTag || "<color:(.*?)>";
		this.colorEndTag = params.colorEndTag || "</color>";
	},

	// 2.0のバージョンではspliceLinesが分離されていなかったため同じソースでオーバーライド
	getLines : function() {
		if (this._lineUpdate === false) {
			return this._lines;
		}
		this._lineUpdate = false;

		var lines = (this.text + '').split('\n');
		if (this.width < 1) {
			this._lines = lines;
		} else {
			this._lines = this.spliceLines(lines);
		}

		return this._lines;
	},

	// 色制御の開始終了タグを読み飛ばす
	spliceLines : function(lines) {
		var rowWidth = this.width;
		var context = this.canvas.context;
		context.font = this.font;

		var cache = this.getTextWidthCache();

		var regs = [new RegExp("^" + this.colorStartTag), new RegExp("^" + this.colorEndTag)];

		// update cache
		for (var chi = 0; chi < this._text.length; chi++) {
			var ch = this._text[chi];
			if (!cache[ch]) {
				cache[ch] = context.measureText(ch).width;
			}
		}

		var localLines = [];
		lines.forEach(function(line) {

			var str = '';
			var totalWidth = 0;

			// はみ出ていたら強制的に改行する
			for (var chi = 0; chi < line.length; chi++) {
				// 色制御文字列は飛ばす
				var subLine = line.substr(chi);
				var skip = false;
				regs.forEach(function(reg) {
					if(!skip && reg.test(subLine)) {
						skip = true;
						var match = reg.exec(subLine)[0];
						chi += match.length - 1;
						str += match;
					}
				});
				if (skip) {
					continue;
				}

				var ch = line[chi];
				var w = cache[ch];

				if ((totalWidth + w) > rowWidth) {
					localLines.push(str);
					str = '';
					totalWidth = 0;
				}

				str += ch;
				totalWidth += w;
			}

			// 残りを push する
			localLines.push(str);

		});

		return localLines;
	},

	// もう少しきれいに書けるかもしれないがとりあえず動くのでよしとする
	renderFill: function(canvas) {
		var colorStack = [];
		var colorStartReg = new RegExp(this.colorStartTag);
		var colorEndReg = new RegExp(this.colorEndTag);
		var that = this;

		this.lines.forEach(function(line, i) {
			var x = 0;
			while (true) {
				if (colorStartReg.test(line) && colorEndReg.test(line)) {
					var start = colorStartReg.exec(line);
					var end = colorEndReg.exec(line);
					if (start.index < end.index) {
						var before = line.substr(0, start.index);
						x += that._myFillText(canvas, before, x, i, colorStack);
						colorStack.unshift(start[1]);
						line = line.substr(start.index + start[0].length);
					} else {
						var before = line.substr(0, end.index);
						x += that._myFillText(canvas, before, x, i, colorStack);
						colorStack.shift();
						line = line.substr(end.index + end[0].length);
					}
				} else if (colorStartReg.test(line)) {
					var start = colorStartReg.exec(line);
					var before = line.substr(0, start.index);
					x += that._myFillText(canvas, before, x, i, colorStack);
					colorStack.unshift(start[1]);
					line = line.substr(start.index + start[0].length);
				} else if (colorEndReg.test(line)) {
					var end = colorEndReg.exec(line);
					var before = line.substr(0, end.index);
					x += that._myFillText(canvas, before, x, i, colorStack);
					colorStack.shift();
					line = line.substr(end.index + end[0].length);
				} else {
					x += that._myFillText(canvas, line, x, i, colorStack);
					break;
				}
			}
		}, this);
	},

	_myFillText: function(canvas, line, x, i, colorStack) {
		var context = canvas.context;
		var offsetX = this.offsetX;
		var offsetY = this.offsetY;
		var lineSize = this.lineSize;
		var start = this.start;
		if (colorStack.length > 0) {
			context.fillStyle = colorStack[0];
		}
		context.fillText(line, x + offsetX, (start + i) * lineSize + offsetY);
		context.fillStyle = this.fill;

		return context.measureText(line).width;
	},

	// もう少しきれいに書けるかもしれないがとりあえず動くのでよしとする
	renderStroke: function(canvas) {
		var colorStack = [];
		var colorStartReg = new RegExp(this.colorStartTag);
		var colorEndReg = new RegExp(this.colorEndTag);
		var that = this;

		this.lines.forEach(function(line, i) {
			var x = 0;
			while (true) {
				if (colorStartReg.test(line) && colorEndReg.test(line)) {
					var start = colorStartReg.exec(line);
					var end = colorEndReg.exec(line);
					if (start.index < end.index) {
						var before = line.substr(0, start.index);
						x += that._myStrokeText(canvas, before, x, i, colorStack);
						colorStack.unshift(start[1]);
						line = line.substr(start.index + start[0].length);
					} else {
						var before = line.substr(0, end.index);
						x += that._myStrokeText(canvas, before, x, i, colorStack);
						colorStack.shift();
						line = line.substr(end.index + end[0].length);
					}
				} else if (colorStartReg.test(line)) {
					var start = colorStartReg.exec(line);
					var before = line.substr(0, start.index);
					x += that._myStrokeText(canvas, before, x, i, colorStack);
					colorStack.unshift(start[1]);
					line = line.substr(start.index + start[0].length);
				} else if (colorEndReg.test(line)) {
					var end = colorEndReg.exec(line);
					var before = line.substr(0, end.index);
					x += that._myStrokeText(canvas, before, x, i, colorStack);
					colorStack.shift();
					line = line.substr(end.index + end[0].length);
				} else {
					x += that._myStrokeText(canvas, line, x, i, colorStack);
					break;
				}
			}
		}, this);
	},

	_myStrokeText: function(canvas, line, x, i, colorStack) {
		var context = canvas.context;
		var offsetX = this.offsetX;
		var offsetY = this.offsetY;
		var lineSize = this.lineSize;
		var start = this.start;
		if (colorStack.length > 0) {
			context.fillStyle = colorStack[0];
		}
		context.strokeText(line, x + offsetX, (start + i) * lineSize + offsetY);
		context.fillStyle = this.fill;

		return context.measureText(line).width;
	},
});
