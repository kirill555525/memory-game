import { button, element } from './dom.js';

export class Modal {
  constructor() {
    this.dialog = element('dialog', {
      className: 'modal', attrs: { 'aria-labelledby': 'modal-title' },
    });
    this.content = element('div', { className: 'modal-content' });
    this.closeButton = button('×', 'modal-x', () => this.close());
    this.closeButton.setAttribute('aria-label', 'Закрыть модальное окно');
    this.dialog.append(this.closeButton, this.content);
    document.body.append(this.dialog);
    this.previousFocus = null;
    this.previousOverflow = '';
    this.previousRootOverflow = '';
    this.startedOnBackdrop = false;

    this.dialog.addEventListener('pointerdown', (event) => {
      this.startedOnBackdrop = this.isBackdrop(event);
    });
    this.dialog.addEventListener('click', (event) => {
      if (this.startedOnBackdrop && this.isBackdrop(event)) this.close();
      this.startedOnBackdrop = false;
    });
    this.dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.close();
    });
  }

  get isOpen() {
    return this.dialog.open;
  }

  isBackdrop(event) {
    if (event.target !== this.dialog) return false;
    const box = this.dialog.getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right
      || event.clientY < box.top || event.clientY > box.bottom;
  }

  open({ title, eyebrow, content, actions = [] }) {
    if (this.isOpen) this.close();
    this.previousFocus = document.activeElement;
    this.previousOverflow = document.body.style.overflow;
    this.previousRootOverflow = document.documentElement.style.overflow;
    this.content.replaceChildren(
      element('p', { className: 'eyebrow', text: eyebrow }),
      element('h2', { text: title, attrs: { id: 'modal-title' } }),
      ...content,
      element('div', { className: 'modal-actions' }, actions),
    );
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    this.dialog.showModal();
    (actions[0] ?? this.closeButton).focus();
  }

  close() {
    if (!this.isOpen) return;
    this.dialog.close();
    document.body.style.overflow = this.previousOverflow;
    document.documentElement.style.overflow = this.previousRootOverflow;
    if (this.previousFocus?.isConnected) this.previousFocus.focus();
  }
}
