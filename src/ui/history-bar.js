export class HistoryBar {
  constructor(containerElement, onPillClick) {
    this.container = containerElement;
    this.onPillClick = onPillClick;
    this.history = [];
  }

  setHistory(multipliers) {
    this.history = multipliers || [];
    this.render();
  }

  addMultiplier(multiplier, roundInfo = null) {
    if (!multiplier) return;
    this.history.unshift({ multiplier, roundInfo });
    if (this.history.length > 30) {
      this.history.pop();
    }
    this.render();
  }

  render() {
    this.container.innerHTML = '';

    if (this.history.length === 0) {
      // Default placeholder seeds
      const initial = [1.24, 2.56, 1.84, 8.42, 1.15, 3.20, 1.05, 14.28, 2.10, 1.55];
      this.history = initial.map(m => ({ multiplier: m }));
    }

    this.history.forEach((item) => {
      const val = typeof item === 'number' ? item : item.multiplier;
      const pill = document.createElement('div');
      pill.className = 'history-pill';

      // Spribe Aviator color grading
      if (val < 2.00) {
        pill.classList.add('pill-blue');
      } else if (val < 10.00) {
        pill.classList.add('pill-purple');
      } else {
        pill.classList.add('pill-gold');
      }

      pill.textContent = `${val.toFixed(2)}x`;
      pill.title = `Click to verify Provably Fair for ${val.toFixed(2)}x`;

      pill.addEventListener('click', () => {
        if (this.onPillClick) {
          this.onPillClick(item);
        }
      });

      this.container.appendChild(pill);
    });
  }
}
