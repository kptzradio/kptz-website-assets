/**
 * kptz-audio-player.js
 * Custom HTML5 audio player web component for KPTZ.
 *
 * Usage (after loading this script):
 *
 *   <kptz-audio-player
 *     src="https://..."
 *     track-name="Local News for 2/5/26"
 *     artist-name="2/5/2026"
 *     cover-image="https://..."
 *   ></kptz-audio-player>
 *
 * Or set via JS properties:
 *   const player = document.querySelector('kptz-audio-player');
 *   player.src         = itemData.audioFileUrl;
 *   player.trackName   = itemData.title;
 *   player.artistName  = airDateDisplay;
 *   player.coverImage  = showObj?.logo ?? KPTZ_LOGO;
 */

(function () {
  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      }

      .player {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #ffffff;
        border: 1px solid #d8d8d8;
        border-radius: 8px;
        padding: 10px 14px 10px 10px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.07);
        min-height: 64px;
        box-sizing: border-box;
      }

      .cover {
        flex-shrink: 0;
        width: 54px;
        height: 54px;
        border-radius: 4px;
        object-fit: cover;
        background: #c0392b;
      }

      .body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .meta {
        display: flex;
        align-items: baseline;
        gap: 6px;
        flex-wrap: wrap;
        line-height: 1.2;
      }

      .track-name {
        font-size: 0.88rem;
        font-weight: 600;
        color: #222;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .separator {
        color: #aaa;
        font-size: 0.8rem;
      }

      .artist-name {
        font-size: 0.8rem;
        color: #888;
        white-space: nowrap;
      }

      .controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .play-btn {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        border: none;
        background: none;
        padding: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #222;
        border-radius: 50%;
        transition: background 0.15s;
      }
      .play-btn:hover { background: #f0f0f0; }
      .play-btn svg { display: block; }

      .seek-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        min-width: 0;
      }

      .seek {
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        height: 3px;
        border-radius: 2px;
        background: #d0d0d0;
        outline: none;
        cursor: pointer;
        background-image: linear-gradient(#333, #333);
        background-size: 0% 100%;
        background-repeat: no-repeat;
      }
      .seek::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: #333;
        cursor: pointer;
      }
      .seek::-moz-range-thumb {
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: #333;
        border: none;
        cursor: pointer;
      }

      .time {
        font-size: 0.75rem;
        color: #888;
        white-space: nowrap;
        letter-spacing: 0.01em;
        min-width: 72px;
        text-align: right;
      }
    </style>

    <div class="player">
      <img class="cover" alt="Cover art" />

      <div class="body">
        <div class="meta">
          <span class="track-name"></span>
          <span class="separator">–</span>
          <span class="artist-name"></span>
        </div>

        <div class="controls">
          <button class="play-btn" aria-label="Play">
            <svg class="icon-play" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <polygon points="5,2 16,9 5,16" fill="currentColor"/>
            </svg>
            <svg class="icon-pause" width="18" height="18" viewBox="0 0 18 18" fill="none" style="display:none">
              <rect x="4" y="2" width="3.5" height="14" rx="1" fill="currentColor"/>
              <rect x="10.5" y="2" width="3.5" height="14" rx="1" fill="currentColor"/>
            </svg>
          </button>

          <div class="seek-wrapper">
            <input type="range" class="seek" min="0" max="100" value="0" step="0.1" aria-label="Seek">
          </div>

          <span class="time">0:00 / --:--</span>
        </div>
      </div>
    </div>

    <audio preload="metadata"></audio>
  `;

  class KptzAudioPlayer extends HTMLElement {
    static get observedAttributes() {
      return ['src', 'track-name', 'artist-name', 'cover-image'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));

      this._audio     = this.shadowRoot.querySelector('audio');
      this._playBtn   = this.shadowRoot.querySelector('.play-btn');
      this._iconPlay  = this.shadowRoot.querySelector('.icon-play');
      this._iconPause = this.shadowRoot.querySelector('.icon-pause');
      this._seek      = this.shadowRoot.querySelector('.seek');
      this._timeEl    = this.shadowRoot.querySelector('.time');
      this._cover     = this.shadowRoot.querySelector('.cover');
      this._trackEl   = this.shadowRoot.querySelector('.track-name');
      this._artistEl  = this.shadowRoot.querySelector('.artist-name');

      this._dragging = false;
      this._bindEvents();
    }

    connectedCallback() {
      this._upgradeProperty('src');
      this._upgradeProperty('track-name');
      this._upgradeProperty('artist-name');
      this._upgradeProperty('cover-image');
    }

    _upgradeProperty(prop) {
      if  (this.hasOwnProperty(prop)) {
        let value = this[prop];
        delete this[prop];
        this[prop] = value;
      }
    }

    // JS property setters — mirrors your existing repeater code style
    set src(val)        { this.setAttribute('src', val); }
    get src()           { return this.getAttribute('src') || ''; }

    set trackName(val)  { this.setAttribute('track-name', val); }
    get trackName()     { return this.getAttribute('track-name') || ''; }

    set artistName(val) { this.setAttribute('artist-name', val); }
    get artistName()    { return this.getAttribute('artist-name') || ''; }

    set coverImage(val) { this.setAttribute('cover-image', val); }
    get coverImage()    { return this.getAttribute('cover-image') || ''; }

    attributeChangedCallback(name, _old, val) {
      // If the value hasn't actually changed or is null, bail early
      if (_old === val || val === null) return;
    
      switch (name) {
        case 'src':
          this._audio.src = val;
          
          // The "Magic" line: Forces the browser to talk to Cloudflare R2 
          // immediately to get the duration metadata.
          this._audio.load(); 
          
          this._seek.value = 0;
          this._updateSeekFill(0);
          this._setPlaying(false);
          this._timeEl.textContent = '0:00 / --:--';
          break;
          
        case 'track-name':
          this._trackEl.textContent = val;
          break;
          
        case 'artist-name':
          this._artistEl.textContent = val;
          break;
          
        case 'cover-image':
          // Ensure we don't try to set an empty string as a source
          if (val) this._cover.src = val;
          break;
      }
    }
    
    _bindEvents() {
      const audio = this._audio;

      audio.addEventListener('loadedmetadata', () => {
        this._updateTime();
      });

      audio.addEventListener('timeupdate', () => {
        if (!this._dragging) {
          const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
          this._seek.value = pct;
          this._updateSeekFill(pct);
          this._updateTime();
        }
      });

      audio.addEventListener('ended', () => {
        this._setPlaying(false);
        this._seek.value = 0;
        this._updateSeekFill(0);
      });

      this._playBtn.addEventListener('click', () => {
        if (audio.paused) {
          audio.play();
          this._setPlaying(true);
        } else {
          audio.pause();
          this._setPlaying(false);
        }
      });

      this._seek.addEventListener('mousedown',  () => { this._dragging = true; });
      this._seek.addEventListener('touchstart', () => { this._dragging = true; }, { passive: true });

      this._seek.addEventListener('input', () => {
        this._updateSeekFill(this._seek.value);
        this._updateTimeDuringDrag();
      });

      this._seek.addEventListener('change', () => {
        if (audio.duration) {
          audio.currentTime = (this._seek.value / 100) * audio.duration;
        }
        this._dragging = false;
      });

      this._seek.addEventListener('mouseup',  () => { this._dragging = false; });
      this._seek.addEventListener('touchend', () => { this._dragging = false; });
    }

    _setPlaying(playing) {
      this._iconPlay.style.display  = playing ? 'none'  : 'block';
      this._iconPause.style.display = playing ? 'block' : 'none';
      this._playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    }

    _updateSeekFill(pct) {
      this._seek.style.backgroundSize = `${pct}% 100%`;
    }

    _fmt(secs) {
      if (!isFinite(secs) || isNaN(secs)) return '--:--';
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }

    _updateTime() {
      const cur = this._audio.currentTime;
      const dur = this._audio.duration;
      this._timeEl.textContent = `${this._fmt(cur)} / ${this._fmt(dur)}`;
    }

    _updateTimeDuringDrag() {
      const dur = this._audio.duration;
      const cur = dur ? (this._seek.value / 100) * dur : 0;
      this._timeEl.textContent = `${this._fmt(cur)} / ${this._fmt(dur)}`;
    }
  }

  if (!customElements.get('kptz-audio-player')) {
    customElements.define('kptz-audio-player', KptzAudioPlayer);
  }
})();
