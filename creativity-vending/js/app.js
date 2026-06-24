import { VENDING_TYPES, drawKeywords } from './utils/keywords.js';
import {
  fetchVault,
  getCurrentUser,
  onAuthChange,
  saveIdea,
  signIn,
  signOut,
  signUp,
  updateDraft,
} from './utils/supabase.js';
import { createDraft } from './utils/copilot.js';
import { runSlotAnimation, resetSlots } from './components/vendingCard.js';
import { renderVaultList } from './components/vaultList.js';

const state = {
  activeType: 'plot',
  activeView: 'vending',
  currentKeywords: [],
  lockedSlots: [false, false, false],
  isSpinning: false,
  isSaving: false,
  user: null,
  vaultItems: [],
  latestDraft: '',
};

const el = {
  authPanel: document.getElementById('auth-panel'),
  authForm: document.getElementById('auth-form'),
  authEmail: document.getElementById('auth-email'),
  authPassword: document.getElementById('auth-password'),
  authToggleBtn: document.getElementById('auth-toggle-btn'),
  signoutBtn: document.getElementById('signout-btn'),
  userEmail: document.getElementById('user-email'),
  vendingView: document.getElementById('vending-view'),
  vaultView: document.getElementById('vault-view'),
  typeTabs: document.querySelectorAll('[data-type-tab]'),
  machineEyebrow: document.getElementById('machine-eyebrow'),
  machineName: document.getElementById('machine-name'),
  machineFormula: document.getElementById('machine-formula'),
  slotLabels: document.querySelectorAll('[data-slot-label]'),
  slots: document.querySelectorAll('[data-slot]'),
  lockBtns: document.querySelectorAll('[data-lock-index]'),
  spinBtn: document.getElementById('spin-btn'),
  memo: document.getElementById('memo'),
  saveBtn: document.getElementById('save-btn'),
  draftCurrentBtn: document.getElementById('draft-current-btn'),
  vaultNavBtn: document.getElementById('vault-nav-btn'),
  vaultGrid: document.getElementById('vault-grid'),
  countBadge: document.getElementById('count-badge'),
  draftDialog: document.getElementById('draft-dialog'),
  draftOutput: document.getElementById('draft-output'),
  copyDraftBtn: document.getElementById('copy-draft-btn'),
  toastShelf: document.getElementById('toast-shelf'),
};

async function init() {
  renderTypeInfo(state.activeType);
  resetAllSlots();
  bindEvents();
  state.user = await getCurrentUser();
  await handleUserChange(state.user);
  onAuthChange(user => handleUserChange(user));
}

function bindEvents() {
  document.addEventListener('click', handleClick);
  el.authForm.addEventListener('submit', handleAuthSubmit);
  el.signoutBtn.addEventListener('click', handleSignOut);
  el.spinBtn.addEventListener('click', handleSpin);
  el.saveBtn.addEventListener('click', handleSave);
  el.draftCurrentBtn.addEventListener('click', handleCurrentDraft);
  el.copyDraftBtn.addEventListener('click', handleCopyDraft);
}

function handleClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  if (target.dataset.action === 'switch-view-vending') {
    event.preventDefault();
    switchView('vending');
    return;
  }

  if (target.dataset.action === 'switch-view-vault') {
    switchView('vault');
    return;
  }

  if (target.dataset.action === 'toggle-auth') {
    el.authPanel.classList.toggle('collapsed');
    return;
  }

  if (target.dataset.action === 'close-draft') {
    closeDraftDialog();
    return;
  }

  if (target.dataset.action === 'toggle-lock') {
    toggleSlotLock(Number(target.dataset.lockIndex));
    return;
  }

  if (target.dataset.action === 'set-type') {
    setType(target.dataset.type);
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const mode = event.submitter?.dataset.authMode ?? 'signin';
  const email = el.authEmail.value.trim();
  const password = el.authPassword.value;

  if (password.length < 6) {
    showToast('비밀번호는 6자 이상으로 입력해 주세요.', 'error');
    return;
  }

  const { data, error } = mode === 'signup' ? await signUp(email, password) : await signIn(email, password);
  if (error) {
    showToast(error.message || '인증에 실패했어요.', 'error');
    return;
  }

  if (mode === 'signup' && !data.session) {
    showToast('회원가입 완료. 이메일 인증 후 로그인해 주세요.', 'success');
    return;
  }

  showToast(mode === 'signup' ? '가입하고 로그인했어요.' : '로그인했어요.', 'success');
  state.user = data.user ?? data.session?.user ?? (await getCurrentUser());
  await handleUserChange(state.user);
}

async function handleSignOut() {
  const { error } = await signOut();
  if (error) {
    showToast('로그아웃에 실패했어요.', 'error');
    return;
  }
  await handleUserChange(null);
  showToast('로그아웃했어요.', 'success');
}

async function handleUserChange(user) {
  state.user = user;
  state.vaultItems = [];
  updateAuthUi();
  updateActionButtons();

  if (user) {
    el.authPanel.classList.add('collapsed');
    await loadVault();
  } else {
    renderVault();
  }
}

function updateAuthUi() {
  const signedIn = Boolean(state.user);
  el.userEmail.textContent = signedIn ? state.user.email : '로그인이 필요해요';
  el.authToggleBtn.textContent = signedIn ? '계정' : '로그인';
  el.signoutBtn.classList.toggle('hidden', !signedIn);
}

function setType(typeKey) {
  if (!VENDING_TYPES[typeKey] || state.isSpinning) return;
  state.activeType = typeKey;
  state.currentKeywords = [];
  el.memo.value = '';
  renderTypeInfo(typeKey);
  resetAllSlots();
  setActiveTypeTab(typeKey);
  updateActionButtons();
}

function toggleSlotLock(index) {
  if (!state.currentKeywords[index] || state.isSpinning) {
    showToast('먼저 키워드를 뽑은 뒤 고정할 수 있어요.', 'error');
    return;
  }
  state.lockedSlots[index] = !state.lockedSlots[index];
  renderLockButtons();
}

function resetAllSlots() {
  state.lockedSlots = [false, false, false];
  resetSlots([...el.slots]);
  renderLockButtons();
}

function renderLockButtons() {
  el.lockBtns.forEach(button => {
    const index = Number(button.dataset.lockIndex);
    const locked = state.lockedSlots[index];
    button.classList.toggle('active', locked);
    button.setAttribute('aria-pressed', String(locked));
    button.textContent = locked ? '고정됨' : '고정 안 함';
    el.slots[index].classList.toggle('locked', locked);
  });
}

function switchView(view) {
  state.activeView = view;
  const isVault = view === 'vault';
  el.vendingView.classList.toggle('active', !isVault);
  el.vaultView.classList.toggle('active', isVault);
  el.vaultNavBtn.classList.toggle('active', isVault);
  el.vaultNavBtn.dataset.action = isVault ? 'switch-view-vending' : 'switch-view-vault';
  el.vaultNavBtn.querySelector('.btn-label').textContent = isVault ? '자판기로' : '보관함';
  if (isVault) renderVault();
}

function renderTypeInfo(typeKey) {
  const type = VENDING_TYPES[typeKey];
  el.machineEyebrow.textContent = type.eyebrow;
  el.machineName.textContent = type.name;
  el.machineFormula.textContent = type.formula;
  el.slotLabels.forEach((label, index) => {
    label.textContent = type.axes[index] ?? '';
  });
}

function setActiveTypeTab(typeKey) {
  el.typeTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.type === typeKey);
  });
}

function handleSpin() {
  if (state.isSpinning) return;

  const freshKeywords = drawKeywords(state.activeType);
  const keywords = freshKeywords.map((keyword, index) => (
    state.lockedSlots[index] && state.currentKeywords[index] ? state.currentKeywords[index] : keyword
  ));

  state.isSpinning = true;
  updateActionButtons();
  el.spinBtn.disabled = true;
  el.spinBtn.querySelector('.btn-label').textContent = '뽑는 중...';

  runSlotAnimation([...el.slots], keywords, state.lockedSlots, () => {
    state.currentKeywords = keywords;
    state.isSpinning = false;
    el.spinBtn.disabled = false;
    el.spinBtn.querySelector('.btn-label').textContent = '자판기 돌리기';
    renderLockButtons();
    updateActionButtons();
  });
}

async function handleSave() {
  if (state.isSaving) return;
  if (!state.user) {
    showToast('저장하려면 먼저 로그인해 주세요.', 'error');
    return;
  }
  if (!state.currentKeywords.length) {
    showToast('먼저 자판기를 돌려 주세요.', 'error');
    return;
  }

  state.isSaving = true;
  updateActionButtons();
  el.saveBtn.textContent = '저장 중...';

  const { data, error } = await saveIdea(
    {
      vending_type: state.activeType,
      keywords: state.currentKeywords,
      user_memo: el.memo.value.trim(),
    },
    state.user.id,
  );

  state.isSaving = false;
  el.saveBtn.textContent = '보관함에 저장';
  updateActionButtons();

  if (error) {
    showToast('저장에 실패했어요. DB 스키마와 로그인 상태를 확인해 주세요.', 'error');
    return;
  }

  state.vaultItems.unshift(data);
  updateBadge();
  renderVault();
  showToast('단어 조합과 메모를 보관함에 저장했어요.', 'success');
}

async function loadVault() {
  if (!state.user) {
    state.vaultItems = [];
    renderVault();
    return;
  }
  el.vaultGrid.innerHTML = '<p class="vault-loading">보관함을 불러오는 중...</p>';
  const { data, error } = await fetchVault(state.user.id);
  if (error) {
    el.vaultGrid.innerHTML = '<p class="vault-error">보관함을 불러오지 못했어요. DB 정책을 확인해 주세요.</p>';
    return;
  }
  state.vaultItems = data ?? [];
  updateBadge();
  renderVault();
}

function renderVault() {
  if (!state.user) {
    el.vaultGrid.innerHTML = `
      <div class="vault-empty">
        <span class="vault-empty-icon" aria-hidden="true">LOGIN</span>
        <p class="vault-empty-msg">로그인하면 계정별 보관함을 사용할 수 있어요.</p>
      </div>`;
    updateBadge();
    updateSubtitle();
    return;
  }
  renderVaultList(el.vaultGrid, state.vaultItems, {
    onCopy: handleCopy,
    onDraft: handleSavedDraft,
  });
  updateSubtitle();
}

function updateSubtitle() {
  const subtitle = el.vaultView.querySelector('.vault-subtitle');
  if (!subtitle) return;
  subtitle.textContent = state.user
    ? `총 ${state.vaultItems.length}개의 아이디어`
    : '로그인하면 내 보관함을 불러옵니다.';
}

function handleCurrentDraft() {
  if (!state.currentKeywords.length) {
    showToast('먼저 자판기를 돌려 주세요.', 'error');
    return;
  }
  const draft = createDraft({
    vending_type: state.activeType,
    keywords: state.currentKeywords,
    user_memo: el.memo.value.trim(),
  });
  openDraftDialog(draft);
}

async function handleSavedDraft(item) {
  const draft = createDraft(item);
  openDraftDialog(draft);
  if (!state.user || !item.id) return;
  const { data } = await updateDraft(item.id, draft, state.user.id);
  if (!data) return;
  const index = state.vaultItems.findIndex(vaultItem => vaultItem.id === item.id);
  if (index >= 0) {
    state.vaultItems[index] = data;
    renderVault();
  }
}

function openDraftDialog(draft) {
  state.latestDraft = draft;
  el.draftOutput.textContent = draft;
  if (typeof el.draftDialog.showModal === 'function') el.draftDialog.showModal();
  else el.draftDialog.setAttribute('open', '');
}

function closeDraftDialog() {
  if (typeof el.draftDialog.close === 'function') el.draftDialog.close();
  else el.draftDialog.removeAttribute('open');
}

function handleCopy(item) {
  const typeName = VENDING_TYPES[item.vending_type]?.name ?? item.vending_type;
  const keywords = (item.keywords ?? []).join(' x ');
  const memo = item.user_memo ? `\n\n메모: ${item.user_memo}` : '';
  const draft = item.ai_draft ? `\n\n기획안 초안:\n${item.ai_draft}` : '';
  copyText(`[${typeName}]\n${keywords}${memo}${draft}`, '클립보드에 복사했어요.');
}

function handleCopyDraft() {
  copyText(state.latestDraft, '초안을 복사했어요.');
}

function copyText(text, successMessage) {
  navigator.clipboard
    .writeText(text)
    .then(() => showToast(successMessage, 'success'))
    .catch(() => showToast('복사에 실패했어요.', 'error'));
}

function updateActionButtons() {
  const hasKeywords = state.currentKeywords.length > 0;
  el.saveBtn.disabled = !state.user || !hasKeywords || state.isSaving;
  el.draftCurrentBtn.disabled = !hasKeywords || state.isSpinning;
}

function updateBadge() {
  const count = state.user ? state.vaultItems.length : 0;
  el.countBadge.textContent = count;
  el.countBadge.classList.toggle('visible', count > 0);
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  el.toastShelf.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 2800);
}

init();
