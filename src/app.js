import { CARD_IMAGES } from './cards.js';
import { MemoryGame } from './game.js';
import { ResultStore, formatDate } from './storage.js';
import { element, button } from './dom.js';
import { Modal } from './modal.js';

const store = new ResultStore();
const shell = element('div', { className: 'app-shell' });
document.body.append(shell);
const modal = new Modal();
let game;
let cardButtons = [];
let displayedRound = 0;

const newGameButton = button('Новая игра', 'button button-primary', startNewGame);
newGameButton.prepend(element('span', { className: 'button-symbol', text: '+', attrs: { 'aria-hidden': 'true' } }));
const leaderboardButton = button('Таблица лидеров', 'button button-secondary', openLeaderboard);

const header = element('header', { className: 'header' }, [
  element('div', { className: 'brand', attrs: { 'aria-label': 'Memory Game' } }, [
    element('span', { className: 'brand-mark', text: '✦', attrs: { 'aria-hidden': 'true' } }),
    element('span', { text: 'memory' }),
    element('span', { className: 'brand-dot', text: '.', attrs: { 'aria-hidden': 'true' } }),
  ]),
  element('nav', { className: 'header-actions', attrs: { 'aria-label': 'Управление игрой' } }, [
    leaderboardButton, newGameButton,
  ]),
]);

const moveCount = element('strong', { className: 'move-count', text: '0', attrs: { id: 'move-count' } });
const pairCount = element('strong', { className: 'pair-count', text: '0', attrs: { id: 'pair-count' } });
const progressMarks = Array.from({ length: 8 }, () => element('span', { className: 'progress-mark' }));
const progress = element('div', {
  className: 'pair-progress', attrs: { role: 'progressbar', 'aria-label': 'Найденные пары',
    'aria-valuemin': '0', 'aria-valuemax': '8', 'aria-valuenow': '0' },
}, progressMarks);
const status = element('p', { className: 'game-status', attrs: { role: 'status', 'aria-live': 'polite' } });
const board = element('div', {
  className: 'board', attrs: { id: 'board', role: 'group', 'aria-label': 'Игровое поле: 16 карточек' },
});

const instructions = element('section', { className: 'instructions', attrs: { 'aria-labelledby': 'how-to-title' } }, [
  element('h2', { text: 'Всё просто', attrs: { id: 'how-to-title' } }),
  element('ol', {}, [
    element('li', { text: 'Открой две карточки.' }),
    element('li', { text: 'Запомни, что под ними.' }),
    element('li', { text: 'Найди все 8 пар.' }),
  ]),
  element('p', { className: 'instruction-note', text: 'Чем меньше ходов, тем выше место в таблице лидеров.' }),
]);

const main = element('main', {}, [
  element('div', { className: 'page-heading' }, [
    element('div', {}, [
      element('p', { className: 'eyebrow', text: 'ИГРА НА ПАМЯТЬ' }),
      element('h1', { text: 'Космические пары' }),
      element('p', { className: 'intro', text: 'Восемь совпадений. Сколько ходов понадобится тебе?' }),
    ]),
    element('span', { className: 'collection-tag', text: '01 / КОСМОС' }),
  ]),
  element('div', { className: 'game-layout' }, [
    element('section', { className: 'play-area', attrs: { 'aria-label': 'Карточки' } }, [
      board,
      element('div', { className: 'board-caption' }, [
        element('span', { text: '16 карточек · 8 пар' }),
        element('span', { text: 'Не спеши, запоминай.' }),
      ]),
    ]),
    element('aside', { className: 'sidebar', attrs: { 'aria-label': 'Счёт и правила игры' } }, [
      element('section', { className: 'score-panel', attrs: { 'aria-label': 'Счёт игры' } }, [
        element('div', { className: 'score-heading' }, [
          element('h2', { text: 'Твоя игра' }),
          element('span', { className: 'score-spark', text: '✦', attrs: { 'aria-hidden': 'true' } }),
        ]),
        element('div', { className: 'move-stat' }, [
          element('span', { className: 'stat-label', text: 'Ходы' }), moveCount,
        ]),
        element('div', { className: 'pair-stat' }, [
          element('span', { className: 'stat-label', text: 'Найдено пар' }),
          element('span', { className: 'pair-value' }, [pairCount, element('span', { text: ' / 8' })]),
        ]),
        progress,
        element('div', { className: 'status-wrap' }, [status]),
      ]),
      instructions,
      element('p', { className: 'keyboard-hint', text: 'С клавиатуры: Tab — выбор, Enter или пробел — открыть.' }),
    ]),
  ]),
]);

const footer = element('footer', { className: 'footer' }, [
  element('span', { text: 'Маленькая тренировка большой памяти.' }),
  element('a', { text: 'RS School · Memory Game', attrs: {
    href: 'https://github.com/rolling-scopes-school/tasks/tree/master/tasks/memory-game',
    target: '_blank', rel: 'noopener noreferrer',
  } }),
]);
shell.append(header, main, footer);

function createCard(card, index) {
  const image = element('img', { attrs: {
    src: card.image, alt: '', width: '80', height: '80', draggable: 'false',
  } });
  const back = element('span', { className: 'card-face card-back', attrs: { 'aria-hidden': 'true' } }, [
    element('span', { className: 'card-orbit' }, [element('span', { className: 'card-spark', text: '✦' })]),
    element('span', { className: 'card-corner', text: '✧' }),
  ]);
  const front = element('span', { className: 'card-face card-front', attrs: { 'aria-hidden': 'true' } }, [
    image, element('span', { className: 'matched-tick', text: '✓' }),
  ]);
  const cardButton = button('', 'card', () => {
    if (!modal.isOpen) game.flip(index);
  });
  cardButton.dataset.index = String(index);
  cardButton.append(element('span', { className: 'card-inner' }, [back, front]));
  return cardButton;
}

const statusMessages = {
  ready: 'Открой две карточки',
  choosing: 'Теперь найди ей пару',
  mismatch: 'Запомни их расположение',
  match: 'Есть совпадение! Продолжай',
  complete: 'Все пары найдены!',
};

function renderGame(state) {
  if (displayedRound !== state.round) {
    displayedRound = state.round;
    cardButtons = state.cards.map(createCard);
    board.replaceChildren(...cardButtons);
  }
  state.cards.forEach((card, index) => {
    const node = cardButtons[index];
    node.classList.toggle('is-open', card.revealed);
    node.classList.toggle('is-matched', card.matched);
    node.setAttribute('aria-disabled', String(card.revealed || state.locked || state.completed));
    node.setAttribute('aria-label', `Карточка ${index + 1}. ${card.revealed ? card.name : 'Закрыта'}${card.matched ? '. Пара найдена' : ''}`);
  });
  moveCount.textContent = String(state.moves);
  pairCount.textContent = String(state.pairs);
  progress.setAttribute('aria-valuenow', String(state.pairs));
  progressMarks.forEach((mark, index) => mark.classList.toggle('is-filled', index < state.pairs));
  status.textContent = statusMessages[state.status];
  status.classList.toggle('is-success', state.status === 'match' || state.completed);
}

function startNewGame() {
  modal.close();
  game.newGame();
}

function storageNotice() {
  return element('p', { className: 'storage-notice', text: 'Браузер не разрешил сохранение. Результаты доступны только до закрытия этой страницы.' });
}

function openLeaderboard() {
  const results = store.read();
  const content = [element('p', { className: 'modal-description', text: 'Твои 10 лучших игр. Меньше ходов — выше место.' })];
  if (results.length === 0) {
    content.push(element('div', { className: 'empty-state' }, [
      element('span', { className: 'empty-spark', text: '✦', attrs: { 'aria-hidden': 'true' } }),
      element('h3', { text: 'Пока нет результатов' }),
      element('p', { text: 'Найди все пары — твой первый результат появится здесь.' }),
    ]));
  } else {
    const table = element('table', { className: 'leaderboard' });
    table.append(element('caption', { className: 'sr-only', text: 'Лучшие результаты: место, ходы и дата' }));
    table.append(element('thead', {}, [element('tr', {}, ['Место', 'Ходы', 'Дата'].map((text) => (
      element('th', { text, attrs: { scope: 'col' } })
    )))]));
    table.append(element('tbody', {}, results.map((result, index) => element('tr', {}, [
      element('td', {}, [element('span', { className: index < 3 ? 'rank rank-top' : 'rank', text: String(index + 1) })]),
      element('td', { className: 'leaderboard-moves', text: String(result.moves) }),
      element('td', { text: formatDate(result.timestamp) }),
    ]))));
    content.push(element('div', { className: 'table-wrap' }, [table]));
    content.push(element('p', { className: 'modal-footnote', text: 'При равном числе ходов выше более ранняя игра.' }));
  }
  if (!store.available) content.push(storageNotice());
  modal.open({ title: 'Таблица лидеров', eyebrow: 'ЛИЧНЫЕ РЕКОРДЫ', content,
    actions: [button('Закрыть', 'button button-secondary', () => modal.close())] });
}

function celebrate({ moves }) {
  const timestamp = Date.now();
  const id = globalThis.crypto?.randomUUID?.() ?? `${timestamp}-${Math.random().toString(36).slice(2)}`;
  const results = store.add({ id, moves, timestamp });
  const rank = results.findIndex((result) => result.id === id) + 1;
  const content = [
    element('div', { className: 'victory-image', attrs: { 'aria-hidden': 'true' } }, [
      element('img', { attrs: { src: './assets/cards/star.svg', alt: '', width: '84', height: '84' } }),
    ]),
    element('p', { className: 'modal-description', text: 'Все 8 пар найдены. Отличная работа!' }),
    element('div', { className: 'victory-score' }, [
      element('strong', { text: String(moves) }), element('span', { text: 'Ходов за игру' }),
    ]),
    element('p', { className: 'victory-rank', text: rank ? `Место в твоём рейтинге: ${rank}` : 'В этот раз результат не вошёл в топ-10. Попробуем ещё?' }),
  ];
  if (!store.available) content.push(storageNotice());
  modal.open({ title: 'Это победа!', eyebrow: 'КОСМОС СОШЁЛСЯ', content, actions: [
    button('Новая игра', 'button button-primary', startNewGame),
    button('Закрыть', 'button button-secondary', () => modal.close()),
  ] });
}

game = new MemoryGame(CARD_IMAGES, { onChange: renderGame, onWin: celebrate });
