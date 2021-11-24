import "./libs/webaudio-controls.js";

const getBaseURL = () => {
  return new URL(".", import.meta.url);
};

const template = document.createElement("template");
template.innerHTML = /*html*/ `
    <style>
      canvas {
        border: 1px solid;
        margin-bottom: 10px;
      }

      .main {
        margin: 32px;
        border:1px solid;
        border-radius:15px;
        background-color:lightGrey;
        padding:10px;
        width:500px;
        box-shadow: 10px 10px 5px grey;
        text-align:center;
        font-family: "Open Sans";
        font-size: 14px;
      }

      webaudio-knob {
        margin: 10px;
      }

      #vitesse {
        position: relative;
        top: -10px;
      }

      #vitesseLecture {
        position: relative;
        top: -6px;
      }

      #vitesseMax {
        position: relative;
        top: -10px;
      }

      .progress{
        display:flex;
        flex-direction:row;
        justify-content: center;
        align-items: center;
      }

      .row {
        display:flex;
        flex-direction:row;
        justify-content: center;
        align-items: center;
      }

    </style>
    
    <div class="main">
      <audio id="myPlayer" crossorigin="anonymous"></audio>

      <div class="row">
        <div>
          <canvas id="freq_canvas" width=400 height=100></canvas>
          <canvas id="audioGraph" width=400 height=100></canvas>
        </div>
        <div>
          <canvas id="volumeMeter" width="51" height="150px"></canvas>
        </div>
      </div>

      <div class="title">
        Titre : <span id="songTitle"></span>
      </div>

      <div class="progress">
        <label> Progression
          <input id="progress" type="range" value=0>
        </label>
        <span id="currentTime"></span> /
        <span id="duration"></span>
      </div>
      
      <div class="controls-knobs">

        <webaudio-knob id="volumeKnob" 
          src="./assets/imgs/LittlePhatty.png" 
          value=5 min=0 max=20 step=0.01 
          diameter="32" 
          tooltip="Volume: %d">
        </webaudio-knob>

        <webaudio-knob id="balanceKnob" 
          src="./assets/imgs/LittlePhatty.png" 
          value=0 min=-1 max=1 step=0.1 
          diameter="32" 
          tooltip="Balance">
        </webaudio-knob>

        <label id="vitesse"> Vitesse </label>
        <input id="vitesseLecture" type="range" min=0.2 max=4 step=0.1 value=1>
        <output id="vitesseMax">1</output>
        
      </div>

      <div class="controls">

        <button id="previous">Previous</button>
        <button id="play">Play</button>
        <button id="pause">Pause</button>
        <button id="recule10">-10s</button>
        <button id="avance10">+10s</button>
        <button id="stop">Stop</button>
        <button id="next">Next</button>

      </div>

      <div class="equalizer" style="margin-top: 20px;">

        <webaudio-slider style="margin-right: 20px;" id="freq_60" 
          src="./assets/imgs/vsliderbody.png" 
          knobsrc="myComponents/assets/imgs/vsliderknob.png" 
          value="1" min="-30" max="30" step="0.1" basewidth="24" 
          baseheight="128" knobwidth="24" knobheight="24" ditchlength="100" tooltip="freq 60hz"
          >
        </webaudio-slider>

        <webaudio-slider style="margin-right: 20px;" id="freq_170" 
          src="./assets/imgs/vsliderbody.png" 
          knobsrc="myComponents/assets/imgs/vsliderknob.png" 
          value="1" min="-30" max="30" step="0.1" basewidth="24" 
          baseheight="128" knobwidth="24" knobheight="24" ditchlength="100" tooltip="freq 170hz"
          >
        </webaudio-slider>

        <webaudio-slider style="margin-right: 20px;" id="freq_350" 
          src="./assets/imgs/vsliderbody.png" 
          knobsrc="myComponents/assets/imgs/vsliderknob.png" 
          value="1" min="-30" max="30" step="0.1" basewidth="24" 
          baseheight="128" knobwidth="24" knobheight="24" ditchlength="100" tooltip="freq 350hz"
          >
        </webaudio-slider>

        <webaudio-slider style="margin-right: 20px;" id="freq_1000" 
          src="./assets/imgs/vsliderbody.png" 
          knobsrc="myComponents/assets/imgs/vsliderknob.png" 
          value="1" min="-30" max="30" step="0.1" basewidth="24" 
          baseheight="128" knobwidth="24" knobheight="24" ditchlength="100" tooltip="freq 1000hz"
          >
        </webaudio-slider>

        <webaudio-slider style="margin-right: 20px;" id="freq_3500" 
          src="./assets/imgs/vsliderbody.png" 
          knobsrc="myComponents/assets/imgs/vsliderknob.png" 
          value="1" min="-30" max="30" step="0.1" basewidth="24" 
          baseheight="128" knobwidth="24" knobheight="24" ditchlength="100" tooltip="freq 3500hz"
          >
        </webaudio-slider>

        <webaudio-slider style="margin-right: 20px;" id="freq_10000" 
          src="./assets/imgs/vsliderbody.png" 
          knobsrc="myComponents/assets/imgs/vsliderknob.png" 
          value="1" min="-30" max="30" step="0.1" basewidth="24" 
          baseheight="128" knobwidth="24" knobheight="24" ditchlength="100" tooltip="freq 10000hz"
          >
        </webaudio-slider>

      </div>

    </div>
  `;

class MyAudioPlayer extends HTMLElement {
  mapSlider = new Map();
  songs = [
    "http://mainline.i3s.unice.fr/mooc/LaSueur.mp3",
    "http://mainline.i3s.unice.fr/mooc/horse.mp3",
    "http://mainline.i3s.unice.fr/mooc/guitarRiff1.mp3",
  ];
  index = 0;

  constructor() {
    super();
    // Récupération des attributs HTML
    //this.value = this.getAttribute("value");

    // On crée un shadow DOM
    this.attachShadow({ mode: "open" });
    console.log("URL de base du composant : " + getBaseURL());
  }

  connectedCallback() {
    // Appelée automatiquement par le browser
    // quand il insère le web component dans le DOM
    // de la page du parent..

    // On clone le template HTML/CSS (la gui du wc)
    // et on l'ajoute dans le shadow DOM
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // fix relative URLs && set player variables
    this.fixRelativeURLs();
    this.defineShadowElements();
    this.setInitialsValues();
    // on définit les écouteurs etc.
    this.defineListeners();
    this.defineListenerSlider();
  }

  fixRelativeURLs() {
    const elems = this.shadowRoot.querySelectorAll(
      "webaudio-knob, webaudio-slider, webaudio-switch, img"
    );
    elems.forEach((e) => {
      const path = e.src;
      if (path.startsWith(".")) {
        e.src = getBaseURL() + path;
      }
    });
  }

  defineListeners() {
    this.play_btn.onclick = () => {
      this.player.play();
    };

    this.pause_btn.onclick = () => {
      this.player.pause();
    };

    this.stop_btn.onclick = () => {
      this.player.load();
    };

    this.forward_10.onclick = () => {
      this.player.currentTime += 10;
    };

    this.backward_10.onclick = () => {
      this.player.currentTime -= 10;
    };

    this.readSpeed.oninput = (event) => {
      var value = parseFloat(event.target.value);
      this.player.playbackRate = value;
      this.readSpeedLabel.value = value;
    };

    this.volumeKnob.oninput = (event) => {
      var value = parseFloat(event.target.value);
      this.player.volume = this.normalizeVolume(value);
    };

    this.balanceKnob.oninput = (event) => {
      this.stereoPannerNode.pan.value = event.target.value;
    };

    this.next.onclick = (event) => {
      this.nextSong();
    };

    this.previous.onclick = (event) => {
      this.previousSong();
    };

    this.player.ontimeupdate = (event) => {
      this.progressBarUpdate();
    };

    this.player.onplay = (event) => {
      if (this.audioContext === undefined) {
        this.audioContext = new AudioContext();

        this.buildAudioGraph();

        requestAnimationFrame(() => {
          this.drawAudio();
          this.drawFrequenceAudio();
          this.drawVolume();
        });
      }
    };
  }

  defineShadowElements() {
    this.player = this.shadowRoot.querySelector("#myPlayer");
    this.player.src = this.getAttribute("src");

    this.play_btn = this.shadowRoot.querySelector("#play");
    this.pause_btn = this.shadowRoot.querySelector("#pause");
    this.stop_btn = this.shadowRoot.querySelector("#stop");
    this.forward_10 = this.shadowRoot.querySelector("#avance10");
    this.backward_10 = this.shadowRoot.querySelector("#recule10");
    this.next = this.shadowRoot.querySelector("#next");
    this.previous = this.shadowRoot.querySelector("#previous");
    this.readSpeed = this.shadowRoot.querySelector("#vitesseLecture");
    this.readSpeedLabel = this.shadowRoot.querySelector("#vitesseMax");

    this.titleLabel = this.shadowRoot.querySelector("#songTitle");

    this.progressSlider = this.shadowRoot.querySelector("#progress");
    this.currentTimeSpan = this.shadowRoot.querySelector("#currentTime");
    this.durationSpan = this.shadowRoot.querySelector("#duration");

    this.balanceKnob = this.shadowRoot.querySelector("#balanceKnob");
    this.volumeKnob = this.shadowRoot.querySelector("#volumeKnob");

    this.slider60 = this.shadowRoot.querySelector("#freq_60");
    this.slider170 = this.shadowRoot.querySelector("#freq_170");
    this.slider350 = this.shadowRoot.querySelector("#freq_350");
    this.slider1000 = this.shadowRoot.querySelector("#freq_1000");
    this.slider3500 = this.shadowRoot.querySelector("#freq_3500");
    this.slider10000 = this.shadowRoot.querySelector("#freq_10000");

    this.freqCanvas = this.shadowRoot.querySelector("#freq_canvas");
    this.freqCanvasCtx = this.freqCanvas.getContext("2d");
    this.audioCanvas = this.shadowRoot.querySelector("#audioGraph");
    this.audioCanvasContext = this.audioCanvas.getContext("2d");
    this.volumeCanvas = this.shadowRoot.querySelector("#volumeMeter");
    this.volumeCanvasContext = this.volumeCanvas.getContext("2d");

    this.gradient = this.volumeCanvasContext.createLinearGradient(
      0,
      0,
      0,
      this.volumeCanvas.height
    );
    this.gradient.addColorStop(1, "rgb(147,112,219)");
    this.gradient.addColorStop(0.75, "rgb(138,43,226)");
    this.gradient.addColorStop(0.25, "#48D1CC");
    this.gradient.addColorStop(0, "#00CED1");
  }

  setInitialsValues() {
    this.player.volume = this.normalizeVolume(5);
    this.updateSongTitle();
  }
  // L'API du Web Component
  updateSongTitle() {
    var lastIndex = this.player.src.lastIndexOf("/");
    this.titleLabel.innerHTML = this.player.src.substr(lastIndex + 1);
  }

  nextSong() {
    if (this.index + 1 > this.songs.length - 1) {
      this.index = 0;
    } else {
      this.index += 1;
    }
    this.player.src = this.songs[this.index];
    this.updateSongTitle();
  }

  previousSong() {
    if (this.index - 1 < 0) {
      this.index = this.songs.length - 1;
    } else {
      this.index -= 1;
    }
    this.player.src = this.songs[this.index];
    this.updateSongTitle();
  }

  progressBarUpdate() {
    let currentTime = this.player.currentTime;
    let duration = this.player.duration;

    this.progressSlider.max = duration;
    this.progressSlider.min = 0;
    this.progressSlider.value = currentTime;

    this.currentTimeSpan.innerHTML = this.convertElapsedTime(currentTime);
    this.durationSpan.innerHTML = this.convertElapsedTime(duration);
  }

  convertElapsedTime(inputSeconds) {
    let seconds = Math.floor(inputSeconds % 60);
    let minutes = Math.floor(inputSeconds / 60);

    if (seconds < 10) {
      seconds = "0" + seconds;
    }
    return minutes + ":" + seconds;
  }

  normalizeVolume(value) {
    var old_value = value;
    var old_min = 0;
    var old_max = 20;
    var new_min = 0;
    var new_max = 1;

    var new_value =
      ((old_value - old_min) / (old_max - old_min)) * (new_max - new_min) +
      new_min;

    return new_value;
  }

  buildAudioGraph() {
    let sourceNode = this.audioContext.createMediaElementSource(this.player);
    this.analyserNode = this.audioContext.createAnalyser();
    this.stereoPannerNode = this.audioContext.createStereoPanner();
    sourceNode.connect(this.stereoPannerNode);

    this.buildSliders(this.audioContext);

    this.analyserNode.fftSize = 2048;
    this.sizeBuffer = this.analyserNode.frequencyBinCount;
    this.dataTable = new Uint8Array(this.sizeBuffer);

    let currentNode = sourceNode;
    for (let filter of this.mapSlider.values()) {
      currentNode.connect(filter);
      currentNode = filter;
    }

    currentNode.connect(this.stereoPannerNode);
    this.stereoPannerNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);

    this.analyserLeft = this.audioContext.createAnalyser();
    this.analyserLeft.fftSize = 256;
    this.sizeBufferLeft = this.analyserLeft.frequencyBinCount;
    this.dataTableLeft = new Uint8Array(this.sizeBufferLeft);

    this.analyserRight = this.audioContext.createAnalyser();
    this.analyserRight.fftSize = 256;
    this.sizeBufferRight = this.analyserRight.frequencyBinCount;
    this.dataTableRight = new Uint8Array(this.sizeBufferRight);

    this.splitter = this.audioContext.createChannelSplitter();
    this.stereoPannerNode.connect(this.splitter);
    this.splitter.connect(this.analyserLeft, 0, 0);
    this.splitter.connect(this.analyserRight, 1, 0);
  }

  buildSliders(context) {
    var filters = [60, 170, 350, 1000, 3500, 10000];
    var type = "peaking";

    filters.forEach((val) => {
      const slider = context.createBiquadFilter();
      slider.frequency.value = val;
      slider.type = type;
      slider.gain.value = 0;
      this.mapSlider.set(val, slider);
    });
  }

  setGainOfSlider(key, value) {
    var val = parseFloat(value);
    const filter = this.mapSlider.get(key);
    if (filter !== undefined) filter.gain.value = val;
  }

  defineListenerSlider() {
    this.slider60.oninput = (event) => {
      this.setGainOfSlider(60, event.target.value);
    };
    this.slider170.oninput = (event) => {
      this.setGainOfSlider(170, event.target.value);
    };
    this.slider350.oninput = (event) => {
      this.setGainOfSlider(350, event.target.value);
    };
    this.slider1000.oninput = (event) => {
      this.setGainOfSlider(1000, event.target.value);
    };
    this.slider3500.oninput = (event) => {
      this.setGainOfSlider(3500, event.target.value);
    };
    this.slider10000.oninput = (event) => {
      this.setGainOfSlider(10000, event.target.value);
    };
  }

  drawFrequenceAudio() {
    this.freqCanvasCtx.clearRect(
      0,
      0,
      this.freqCanvas.width,
      this.freqCanvas.height
    );

    this.analyserNode.getByteFrequencyData(this.dataTable);

    this.freqCanvasCtx.fillStyle = "rgb(223, 242, 255)";
    this.freqCanvasCtx.fillRect(
      0,
      0,
      this.freqCanvas.width,
      this.freqCanvas.height
    );

    let barWidth = this.freqCanvas.width / this.sizeBuffer;
    let barHeigth;
    var x = 0;

    let heightScale = this.freqCanvas.height / 128;

    for (let i = 0; i < this.sizeBuffer; i++) {
      barHeigth = this.dataTable[i];

      this.freqCanvasCtx.fillStyle = "rgb(75,0," + (barHeigth + 100) + ")";
      barHeigth *= heightScale;
      this.freqCanvasCtx.fillRect(
        x,
        this.freqCanvas.height - barHeigth / 2,
        barWidth,
        barHeigth / 2
      );

      x += barWidth + 1;
    }

    requestAnimationFrame(() => {
      this.drawFrequenceAudio();
    });
  }

  drawAudio() {
    this.audioCanvasContext.clearRect(
      0,
      0,
      this.audioCanvas.width,
      this.audioCanvas.height
    );

    this.audioCanvasContext.beginPath();

    this.analyserNode.getByteTimeDomainData(this.dataTable);

    this.audioCanvasContext.fillStyle = "rgb(223, 242, 255)";
    this.audioCanvasContext.fillRect(
      0,
      0,
      this.audioCanvas.width,
      this.audioCanvas.height
    );

    var segmentWidth = this.audioCanvas.width / this.sizeBuffer;

    var x = 0;
    for (var i = 0; i < this.sizeBuffer; i++) {
      var v = this.dataTable[i] / 255;
      var y = v * this.audioCanvas.height;

      if (i === 0) {
        this.audioCanvasContext.moveTo(x, y);
      } else {
        this.audioCanvasContext.lineTo(x, y);
      }

      x += segmentWidth;
    }

    this.audioCanvasContext.strokeStyle = "rgb(75,0,130)";
    this.audioCanvasContext.stroke();

    requestAnimationFrame(() => {
      this.drawAudio();
    });
  }

  drawVolume() {
    this.volumeCanvasContext.clearRect(
      0,
      0,
      this.volumeCanvas.width,
      this.volumeCanvas.height
    );
    this.volumeCanvasContext.save();

    this.volumeCanvasContext.fillStyle = "rgb(223, 242, 255)";
    this.volumeCanvasContext.fillRect(
      0,
      0,
      this.volumeCanvas.width,
      this.volumeCanvas.height
    );

    this.volumeCanvasContext.fillStyle = this.gradient;

    this.analyserLeft.getByteFrequencyData(this.dataTableLeft);
    var averageLeft = this.getAverageVolume(this.dataTableLeft);
    const sizeHR =
      this.volumeCanvas.height < averageLeft
        ? 0
        : this.volumeCanvas.height - averageLeft;

    this.volumeCanvasContext.fillRect(0, sizeHR, 25, this.volumeCanvas.height);

    this.analyserRight.getByteFrequencyData(this.dataTableRight);
    var averageRight = this.getAverageVolume(this.dataTableRight);
    const sizeHL =
      this.volumeCanvas.height < averageRight
        ? 0
        : this.volumeCanvas.height - averageRight;
    this.volumeCanvasContext.fillRect(26, sizeHL, 25, this.volumeCanvas.height);

    this.volumeCanvasContext.restore();

    requestAnimationFrame(() => {
      this.drawVolume();
    });
  }

  getAverageVolume(array) {
    var values = 0;
    var average;
    var length = array.length;

    for (var i = 0; i < length; i++) {
      values += array[i];
    }
    average = values / length;
    return average;
  }
}

customElements.define("my-player", MyAudioPlayer);
