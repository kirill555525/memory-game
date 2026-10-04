const MISMATCH_DELAY = 1000;

function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export class MemoryGame {
  constructor(images, { onChange = () => {}, onWin = () => {}, random = Math.random,
    schedule = globalThis.setTimeout.bind(globalThis),
    cancel = globalThis.clearTimeout.bind(globalThis) } = {}) {
    this.images = images;
    this.onChange = onChange;
    this.onWin = onWin;
    this.random = random;
    this.schedule = schedule;
    this.cancel = cancel;
    this.round = 0;
    this.timeoutId = null;
    this.newGame();
  }

  newGame() {
    if (this.timeoutId !== null) this.cancel(this.timeoutId);
    this.timeoutId = null;
    this.round += 1;
    this.cards = shuffle(this.images.flatMap((image) => [0, 1].map((copy) => ({
      ...image,
      uid: `${image.id}-${copy}`,
      revealed: false,
      matched: false,
    }))), this.random);
    this.moves = 0;
    this.pairs = 0;
    this.firstIndex = null;
    this.locked = false;
    this.completed = false;
    this.status = 'ready';
    this.onChange(this);
  }

  flip(index) {
    const card = this.cards[index];
    if (!Number.isInteger(index) || !card || this.locked || this.completed
      || card.revealed || card.matched) return false;

    card.revealed = true;
    if (this.firstIndex === null) {
      this.firstIndex = index;
      this.status = 'choosing';
      this.onChange(this);
      return true;
    }

    const first = this.cards[this.firstIndex];
    this.moves += 1;
    this.firstIndex = null;

    if (first.id === card.id) {
      first.matched = true;
      card.matched = true;
      this.pairs += 1;
      this.completed = this.pairs === this.images.length;
      this.status = this.completed ? 'complete' : 'match';
      this.onChange(this);
      if (this.completed) this.onWin({ moves: this.moves });
      return true;
    }

    this.locked = true;
    this.status = 'mismatch';
    const currentRound = this.round;
    this.timeoutId = this.schedule(() => {
      if (currentRound !== this.round) return;
      first.revealed = false;
      card.revealed = false;
      this.locked = false;
      this.timeoutId = null;
      this.status = 'ready';
      this.onChange(this);
    }, MISMATCH_DELAY);
    this.onChange(this);
    return true;
  }
}
