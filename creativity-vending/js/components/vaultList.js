import { VENDING_TYPES } from '../utils/keywords.js';

export function renderVaultList(container, items, handlers) {
  container.innerHTML = '';

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="vault-empty">
        <span class="vault-empty-icon" aria-hidden="true">EMPTY</span>
        <p class="vault-empty-msg">아직 보관함이 비어 있어요.<br>자판기를 돌리고 아이디어를 저장해 보세요.</p>
      </div>`;
    return;
  }

  items.forEach(item => {
    container.appendChild(buildCard(item, handlers));
  });
}

function buildCard(item, handlers) {
  const card = document.createElement('article');
  card.className = 'vault-card';
  card.dataset.id = item.id ?? '';
  card.setAttribute('role', 'listitem');

  const typeName = VENDING_TYPES[item.vending_type]?.name ?? item.vending_type;
  const keywords = Array.isArray(item.keywords) ? item.keywords : [];
  const memo = item.user_memo ?? '';
  const draft = item.ai_draft ?? '';

  card.innerHTML = `
    <div class="vault-card-top">
      <span class="vault-type-badge">${escapeHtml(typeName)}</span>
      <span class="vault-date">${formatDate(item.created_at)}</span>
    </div>
    <div class="vault-combo">${escapeHtml(keywords.join(' x '))}</div>
    <div class="vault-keywords">
      ${keywords.map(keyword => `<span class="kw-tag">${escapeHtml(keyword)}</span>`).join('')}
    </div>
    <div class="vault-memo-box">
      <span class="mini-label">메모</span>
      <p class="vault-memo-text ${memo ? '' : 'empty'}">${memo ? escapeHtml(memo) : '메모 없음'}</p>
    </div>
    <div class="vault-draft-state ${draft ? 'visible' : ''}">
      ${draft ? '기획안 초안 저장됨' : '아직 초안 없음'}
    </div>
    <div class="vault-card-actions">
      <button class="copy-btn" type="button" data-card-action="draft">AI 초안</button>
      <button class="copy-btn" type="button" data-card-action="copy">텍스트 복사</button>
    </div>`;

  card.querySelector('[data-card-action="copy"]').addEventListener('click', () => handlers.onCopy(item));
  card.querySelector('[data-card-action="draft"]').addEventListener('click', () => handlers.onDraft(item));
  return card;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
