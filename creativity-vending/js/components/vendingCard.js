import { getAllKeywords } from '../utils/keywords.js';

export function runSlotAnimation(slotEls, finalKeywords, lockedSlots, onComplete) {
  const pool = getAllKeywords();
  let pending = slotEls.filter((_slotEl, index) => !lockedSlots[index]).length;

  if (pending === 0) {
    setTimeout(onComplete, 120);
    return;
  }

  slotEls.forEach((slotEl, index) => {
    if (lockedSlots[index]) {
      slotEl.classList.add('locked', 'has-value');
      slotEl.textContent = finalKeywords[index];
      return;
    }

    slotEl.classList.remove('has-value', 'landed', 'locked');
    slotEl.classList.add('spinning');
    slotEl.textContent = '...';

    const interval = setInterval(() => {
      slotEl.textContent = pool[Math.floor(Math.random() * pool.length)];
    }, 85);

    const stopDelay = 650 + index * 420;
    setTimeout(() => {
      clearInterval(interval);
      slotEl.classList.remove('spinning');
      slotEl.classList.add('has-value', 'landed');
      slotEl.textContent = finalKeywords[index];
      pending -= 1;

      if (pending === 0) {
        setTimeout(onComplete, 180);
      }
    }, stopDelay);
  });
}

export function resetSlots(slotEls) {
  slotEls.forEach(slotEl => {
    slotEl.classList.remove('has-value', 'landed', 'spinning', 'locked');
    slotEl.innerHTML = '<span class="slot-placeholder" aria-hidden="true">READY</span>';
  });
}
