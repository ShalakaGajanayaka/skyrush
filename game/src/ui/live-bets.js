export class LiveBetsFeed {
  constructor(containerElement) {
    this.container = containerElement;
    this.activeTab = 'all'; // 'all' | 'my' | 'top'
    this.bets = [];
    this.myBets = [];

    this.initUI();
  }

  initUI() {
    this.container.innerHTML = `
      <div class="sidebar-header">
        <div class="sidebar-tabs">
          <button class="side-tab active" data-tab="all">All Bets</button>
          <button class="side-tab" data-tab="my">My Bets</button>
          <button class="side-tab" data-tab="top">Top</button>
        </div>
        <div class="total-bets-count">
          <span class="count-dot"></span>
          <span class="count-label">ALL BETS (<span id="betsCountVal">0</span>)</span>
        </div>
      </div>

      <!-- Bets Table Header -->
      <div class="bets-table-header">
        <span class="col-user">User</span>
        <span class="col-bet">Bet USD</span>
        <span class="col-mult">X</span>
        <span class="col-cash">Cash out USD</span>
      </div>

      <!-- Bets Scroll List -->
      <div class="bets-list" id="betsListContainer"></div>
    `;

    this.listContainer = this.container.querySelector('#betsListContainer');
    this.lblCount = this.container.querySelector('#betsCountVal');

    this.container.querySelectorAll('.side-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.container.querySelectorAll('.side-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeTab = tab.dataset.tab;
        this.render();
      });
    });
  }

  setBets(betsList) {
    this.bets = betsList || [];
    this.render();
  }

  addBet(bet) {
    if (!bet || !bet.id) return;
    const exists = this.bets.some(b => b.id === bet.id);
    if (!exists) {
      this.bets.unshift(bet);
      if (this.bets.length > 250) {
        this.bets.pop();
      }
      this.render();
    }
  }

  addBatch(batch) {
    if (!Array.isArray(batch) || batch.length === 0) return;
    batch.forEach(b => {
      if (!this.bets.some(existing => existing.id === b.id)) {
        this.bets.push(b);
      }
    });
    this.render();
  }

  markCashedOut(betId, multiplier, winAmount) {
    const bet = this.bets.find(b => b.id === betId);
    if (bet) {
      bet.cashedOut = true;
      bet.cashedOutMultiplier = multiplier;
      bet.winAmount = winAmount;
      this.render();
    }
  }

  removeBet(betId) {
    this.bets = this.bets.filter(b => b.id !== betId);
    this.render();
  }

  clear() {
    this.bets = [];
    this.render();
  }

  render() {
    this.lblCount.textContent = this.bets.length;

    let displayList = this.bets;
    if (this.activeTab === 'my') {
      displayList = this.myBets;
    } else if (this.activeTab === 'top') {
      displayList = [...this.bets]
        .filter(b => b.cashedOut)
        .sort((a, b) => (b.winAmount || 0) - (a.winAmount || 0));
    }

    // Limit visible DOM elements to top 40 for ultra-high FPS
    const slice = displayList.slice(0, 40);

    if (slice.length === 0) {
      this.listContainer.innerHTML = `
        <div class="empty-bets-hint">Waiting for bets...</div>
      `;
      return;
    }

    this.listContainer.innerHTML = slice.map(b => {
      const isCashed = b.cashedOut === true;
      const multStr = isCashed ? `${(b.cashedOutMultiplier || 1.0).toFixed(2)}x` : '-';
      const cashStr = isCashed ? `+$${(b.winAmount || (b.bet * (b.cashedOutMultiplier || 1.0))).toFixed(2)}` : '-';
      const rowClass = isCashed ? 'bet-row cashed' : 'bet-row';

      return `
        <div class="${rowClass}">
          <div class="col-user">
            <span class="user-avatar-dot"></span>
            <span class="user-name">${escapeHtml(b.name || 'Anonymous')}</span>
          </div>
          <div class="col-bet">$${Number(b.bet || 0).toFixed(2)}</div>
          <div class="col-mult">
            ${isCashed ? `<span class="mult-tag">${multStr}</span>` : `<span class="mult-dash">-</span>`}
          </div>
          <div class="col-cash ${isCashed ? 'text-green' : ''}">${cashStr}</div>
        </div>
      `;
    }).join('');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
