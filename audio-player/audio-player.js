/**
 * kptz-audio-player.js
 * Custom HTML5 audio player web component.
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
    static get observedAttributes() { return ['player-data']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).appendChild(TEMPLATE.content.cloneNode(true));
      this._audio = this.shadowRoot.querySelector('audio');
      this._cover = this.shadowRoot.querySelector('.cover');
      this._trackEl = this.shadowRoot.querySelector('.track-name');
      this._artistEl = this.shadowRoot.querySelector('.artist-name');
      this._bindEvents();
    }

    attributeChangedCallback(name, old, val) {
      if (name === 'player-data' && val) {
        try {
          const data = JSON.parse(val);
          // If browser hasn't finished "connecting" elements, save it.
          if (!this._cover) { this._pendingData = data; return; }
          this._applyData(data);
        } catch (e) { console.error("JSON error", e); }
      }
    }

    connectedCallback() {
      if (this._pendingData) { this._applyData(this._pendingData); this._pendingData = null; }
    }

    _applyData(data) {
      if (data.src && this._audio.src !== data.src) {
        this._audio.src = data.src;
        try { this._audio.load(); } catch(e) {}
      }
      this._trackEl.textContent = data.track || "";
      this._artistEl.textContent = data.artist || "";
      this._cover.src = data.cover || "https://static.wixstatic.com/media/c80cf5_edd526e0ebbe41e08c7697037ed05647~mv2.png";
    }

    _bindEvents() { /* ... existing audio event listeners ... */ }
  }

  if (!customElements.get('kptz-audio-player')) customElements.define('kptz-audio-player', KptzAudioPlayer);
})();
