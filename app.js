
/* ========== GUEST DATA (personalization) ==========
   링크 예: ?g=minsu  /  ?g=boss  /  ?to=이름
   side: 'groom' | 'bride' | 'both'
   tone: 'formal' | 'friendly' | 'family'
*/
const GUESTS = {
  demo:   { name: '소중한 손님', display: '소중한 손님', side: 'both', tone: 'formal' },
  minsu:  { name: '김민수', display: '민수', side: 'groom', tone: 'friendly' },
  boss:   { name: '김부장', display: '김○○ 부장님', side: 'groom', tone: 'formal' },
  gomo:   { name: '고모', display: '고모님', side: 'bride', tone: 'family' },
  friend: { name: '친구', display: '친구', side: 'bride', tone: 'friendly' },
};

/* bankCode: 토스/카카오 딥링크용 (031 IM뱅크/대구, 004 국민, 088 신한, 020 우리, 081 하나)
   kakaoPayLink: 개인 카카오페이 송금 링크가 있으면 넣기 (없으면 딥링크 시도 후 복사) */
const ACCOUNTS = {
  groom: [
    { label: '신랑 형원', bank: 'IM뱅크', number: '508-11-9393269', holder: '형원', bankCode: '031' },
    { label: '신랑 측 혼주', bank: 'IM뱅크', number: '508-11-9393269', holder: '형원', bankCode: '031' },
  ],
  bride: [
    { label: '신부 채희', bank: 'IM뱅크', number: '508-11-9393269', holder: '형원', bankCode: '031' },
    { label: '신부 측 혼주', bank: 'IM뱅크', number: '508-11-9393269', holder: '형원', bankCode: '031' },
  ],
};

const INVITE_COPY = {
  formal: `서로가 마주 보며 다져온 사랑을<br>
    이제 함께 한 곳을 바라보며<br>
    걸어가고자 합니다.<br><br>
    저희 두 사람이 사랑의 이름으로<br>
    지켜나갈 모든 날을 축복해 주시면<br>
    더없는 기쁨으로 간직하겠습니다.`,
  friendly: `우리가 약속한 그 날,<br>
    가장 가까운 자리에서<br>
    함께해 줄래?<br><br>
    형식 없는 마음 그대로<br>
    와 준다면 그걸로 충분해.`,
  family: `두 사람이 이제 한 가정을 이룹니다.<br>
    그 시작의 자리에<br>
    함께해 주시면 감사하겠습니다.<br><br>
    따뜻한 축복으로<br>
    자리를 빛내 주세요.`,
};

let currentGuest = null;
let opened = false;

function getGuest() {
  const params = new URLSearchParams(window.location.search);
  const code = (params.get('g') || params.get('to') || '').trim();
  if (code && GUESTS[code]) return { code, ...GUESTS[code] };
  if (code) {
    // free-text name via ?to=홍길동
    const decoded = decodeURIComponent(code);
    return {
      code: 'custom',
      name: decoded,
      display: decoded,
      side: 'both',
      tone: 'formal',
    };
  }
  return null;
}

function guestLabel(g) {
  if (!g) return '소중한 분';
  if (g.tone === 'friendly' || g.tone === 'family') return g.display;
  return g.display.includes('님') ? g.display : g.display + ' 님';
}

function applyPersonalization() {
  currentGuest = getGuest();
  const envName = document.getElementById('env-guest-name');
  const cardGuest = document.getElementById('env-card-guest');
  const cardMsg = document.getElementById('env-card-msg');
  const heroLine = document.getElementById('hero-guest-line');
  const inviteHand = document.getElementById('invite-guest-hand');
  const invite = document.getElementById('invite-greeting');

  const label = guestLabel(currentGuest);
  const handName = currentGuest
    ? (currentGuest.tone === 'formal' && !currentGuest.display.includes('님')
        ? currentGuest.display + ' 님'
        : currentGuest.display)
    : '소중한 분';

  if (envName) {
    envName.textContent = handName;
    envName.classList.add('guest-hand');
  }

  if (currentGuest) {
    if (cardGuest) {
      cardGuest.innerHTML = '<span class="guest-hand-dark" style="font-size:1.35rem">To. ' +
        (currentGuest.tone === 'friendly' ? currentGuest.display : handName) + '</span>';
    }
    if (cardMsg) {
      if (currentGuest.tone === 'friendly') {
        cardMsg.innerHTML = '우리 결혼식에<br />와 줄래?';
      } else if (currentGuest.tone === 'family') {
        cardMsg.innerHTML = '자리를 빛내 주시면<br />감사하겠습니다';
      } else {
        cardMsg.innerHTML = handName + '을<br />초대합니다';
      }
    }

    if (heroLine) {
      heroLine.innerHTML = formatHeroLineHand(currentGuest, handName);
      heroLine.classList.remove('hidden');
    }
    if (inviteHand) {
      inviteHand.textContent = handName + '께';
      inviteHand.classList.remove('hidden');
    }

    invite.innerHTML = INVITE_COPY[currentGuest.tone] || INVITE_COPY.formal;
  } else {
    if (cardGuest) cardGuest.textContent = '';
    if (cardMsg) cardMsg.innerHTML = '저희 결혼식에<br />초대합니다';
    if (heroLine) heroLine.classList.add('hidden');
    if (inviteHand) inviteHand.classList.add('hidden');
    invite.innerHTML = INVITE_COPY.formal;
  }

  renderAccounts(currentGuest ? currentGuest.side : 'both');
}

function formatHeroLineHand(g, handName) {
  if (g.tone === 'friendly') return handName + ', 우리 결혼합니다';
  if (g.tone === 'family') return handName + ', 자리를 빛내 주세요';
  return handName + ', 초대합니다';
}

function bareAccount(num) {
  return String(num || '').replace(/\D/g, '');
}

function openTossPay(bankCode, accountNo) {
  const bare = bareAccount(accountNo);
  const code = bankCode || '';
  const deep = 'supertoss://send?amount=0&bankCode=' + encodeURIComponent(code) +
    '&accountNo=' + encodeURIComponent(bare);
  try { window.location.href = deep; } catch (e) {}
  setTimeout(function () {
    if (document.visibilityState === 'visible') {
      copyText(accountNo, '토스 앱을 열 수 없어 계좌번호를 복사했습니다');
    }
  }, 1800);
}

function openKakaoPay(bankCode, accountNo, kakaoPayLink) {
  if (kakaoPayLink) {
    window.open(kakaoPayLink, '_blank', 'noopener');
    return;
  }
  const bare = bareAccount(accountNo);
  const code = bankCode || '';
  const deep = 'kakaotalk://kakaopay/money/to/bank?bank_code=' + encodeURIComponent(code) +
    '&account_number=' + encodeURIComponent(bare);
  try { window.location.href = deep; } catch (e) {}
  setTimeout(function () {
    if (document.visibilityState === 'visible') {
      copyText(accountNo, '카카오페이를 열 수 없어 계좌번호를 복사했습니다');
    }
  }, 1800);
}

function renderAccounts(side) {
  const root = document.getElementById('account-sections');
  if (!root) return;

  const blocks = [];
  if ((side === 'groom' || side === 'both') && ACCOUNTS.groom.length) {
    blocks.push({ key: 'groom', title: '신랑 측', items: ACCOUNTS.groom });
  }
  if ((side === 'bride' || side === 'both') && ACCOUNTS.bride.length) {
    blocks.push({ key: 'bride', title: '신부 측', items: ACCOUNTS.bride });
  }

  root.innerHTML = blocks.map((b) => `
    <div class="bg-white/80 border border-gold/15 rounded-xl overflow-hidden">
      <button type="button" class="w-full flex items-center justify-between px-5 py-4" onclick="toggleAcc('${b.key}')">
        <span class="font-serif text-base text-navy tracking-wide">${b.title}</span>
        <i class="fa-solid fa-chevron-down text-gold text-xs acc-chevron" id="${b.key}-chevron"></i>
      </button>
      <div class="acc-body" id="${b.key}-body">
        <div class="px-5 pb-5 space-y-5">
          ${b.items.map((a) => {
            const num = a.number;
            const code = a.bankCode || '';
            const kLink = a.kakaoPayLink ? String(a.kakaoPayLink).replace(/'/g, "\\'") : '';
            return `
            <div class="border-t border-gold/10 pt-4">
              <p class="text-xs text-soft mb-1">${a.label}</p>
              <p class="text-sm text-navy">${a.bank} <span class="font-medium tracking-wide">${num}</span></p>
              <p class="text-xs text-soft mt-0.5">예금주 ${a.holder}</p>
              <div class="pay-btns">
                <button type="button" class="pay-btn copy" onclick="copyText('${num}', '계좌번호가 복사되었습니다')">계좌 복사</button>
                <button type="button" class="pay-btn toss" onclick="openTossPay('${code}', '${num}')">토스 송금</button>
                <button type="button" class="pay-btn kakao" onclick="openKakaoPay('${code}', '${num}', '${kLink}')">카카오페이</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

/* cherry blossoms — inside .phone only, soft flutter fall */
function startSakura() {
  const layer = document.getElementById('sakura-layer');
  if (!layer || layer.dataset.ready === '1') return;
  layer.dataset.ready = '1';
  layer.innerHTML = '';

  const count = 8;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    const variant = i % 3;
    p.className = 'petal' + (variant === 1 ? ' p2' : variant === 2 ? ' p3' : '');

    const left = 6 + Math.random() * 88; // keep inside phone width
    const delay = Math.random() * 16;
    const fallDur = 55 + Math.random() * 30; // ~1/3 speed of previous (~20s)
    const swayDur = 10 + Math.random() * 6;
    const size = 9 + Math.random() * 6;
    const amp = (10 + Math.random() * 22) * (Math.random() < 0.5 ? -1 : 1);
    const spin = (120 + Math.random() * 160) * (Math.random() < 0.5 ? -1 : 1);

    p.style.left = left + '%';
    p.style.width = size + 'px';
    p.style.height = (size * (0.75 + Math.random() * 0.35)) + 'px';
    p.style.setProperty('--amp', amp + 'px');
    p.style.setProperty('--spin', spin + 'deg');
    // two animations: fall (duration1) + sway (duration2)
    p.style.animationDuration = fallDur + 's, ' + swayDur + 's';
    p.style.animationDelay = delay + 's, ' + (delay * 0.35) + 's';

    layer.appendChild(p);
  }

  requestAnimationFrame(function () {
    layer.classList.add('on');
  });
}

/* ========== ENVELOPE OPEN ==========
   Sequence (~5s — silk ribbon unties, then flap + card):
   0.00s  ribbon loops/tails loosen
   0.55s  flap opens
   0.75s  card begins rising
   ~2.3s  card fully readable — hold
   3.7s   scene fades gently
   5.0s   main invitation shown
*/
function openInvitation(skipAnim) {
  if (opened) return;
  opened = true;

  const stage = document.getElementById('envelope-stage');
  const main = document.getElementById('main-app');
  const bgmBtn = document.getElementById('bgm-btn');
  const card = document.getElementById('env-card');

  try { localStorage.setItem('invite_opened', '1'); } catch (e) {}

  function showMain() {
    stage.classList.add('hidden-stage');
    main.classList.add('visible');
    document.body.classList.remove('locked');
    bgmBtn.classList.add('visible');
    initAos();
    startSakura();
  }

  if (skipAnim) {
    showMain();
    return;
  }

  if (card) card.setAttribute('aria-hidden', 'false');
  stage.classList.add('opened');

  setTimeout(() => {
    stage.classList.add('fading');
  }, 3700);

  setTimeout(showMain, 5000);
}

function initAos() {
  if (window.AOS) {
    AOS.init({ duration: 900, once: true, offset: 40, easing: 'ease-out-cubic' });
    AOS.refresh();
  }
}

/* ========== UI helpers ========== */
function toggleAcc(id) {
  const body = document.getElementById(id + '-body');
  const chev = document.getElementById(id + '-chevron');
  if (!body) return;
  body.classList.toggle('open');
  if (chev) chev.classList.toggle('open');
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
}

function copyText(text, msg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => toast(msg || '복사되었습니다')).catch(() => fallbackCopy(text, msg));
  } else {
    fallbackCopy(text, msg);
  }
}

function fallbackCopy(text, msg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  toast(msg || '복사되었습니다');
}

function copyLink() {
  copyText(window.location.href, '초대장 링크가 복사되었습니다');
}

function shareInvite() {
  const title = '형원 ♥ 채희 결혼식에 초대합니다';
  if (navigator.share) {
    navigator.share({ title, url: window.location.href }).catch(() => copyLink());
  } else {
    copyLink();
  }
}

/* ========== WEDDING DATE / CALENDAR / D-DAY ========== */
const WEDDING = {
  year: 2027,
  month: 4, // 1-based
  day: 25,
  // 12:00 KST → ICS UTC = 03:00
};

function renderCalendar() {
  const root = document.getElementById('cal-days');
  if (!root) return;

  const y = WEDDING.year;
  const m = WEDDING.month; // 1-based
  const weddingDay = WEDDING.day;
  // JS Date month is 0-based; first day of month
  const firstDow = new Date(y, m - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(y, m, 0).getDate();

  let html = '';
  for (let i = 0; i < firstDow; i++) {
    html += '<div class="cal-day empty"></div>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (firstDow + d - 1) % 7;
    const cls = ['cal-day'];
    if (dow === 0) cls.push('sun');
    if (d === weddingDay) cls.push('wedding');
    html += `<div class="${cls.join(' ')}">${d}</div>`;
  }
  root.innerHTML = html;
}

function renderDday() {
  const label = document.getElementById('dday-label');
  const sub = document.getElementById('dday-sub');
  if (!label) return;

  const target = new Date(WEDDING.year, WEDDING.month - 1, WEDDING.day);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / 86400000);

  if (diff > 0) {
    label.innerHTML = 'D-<span>' + diff + '</span>';
    if (sub) sub.textContent = '예식까지 ' + diff + '일 남았습니다';
  } else if (diff === 0) {
    label.innerHTML = '<span>D-DAY</span>';
    if (sub) sub.textContent = '오늘은 두 사람이 하나가 되는 날입니다';
  } else {
    label.innerHTML = 'D+<span>' + Math.abs(diff) + '</span>';
    if (sub) sub.textContent = '행복한 날로부터 ' + Math.abs(diff) + '일이 지났습니다';
  }
}

function addCalendar() {
  // 2027-04-25 12:00 KST → ICS (UTC+9 → 03:00Z)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding//KR',
    'BEGIN:VEVENT',
    'UID:wedding-20270425@invite',
    'DTSTAMP:20260101T000000Z',
    'DTSTART:20270425T030000Z',
    'DTEND:20270425T060000Z',
    'SUMMARY:형원 ♥ 채희 결혼식',
    'DESCRIPTION:형원 · 채희 결혼식 — 포항 포마레 웨딩 컨벤션',
    'LOCATION:포항 포마레 웨딩 컨벤션',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hyungwon-chaehee-wedding.ics';
  a.click();
  URL.revokeObjectURL(url);
  toast('캘린더 파일이 저장되었습니다');
}

/* ========== GALLERY LIGHTBOX + SWIPE ========== */
const GALLERY_SRCS = [
  'gallery-1.jpg', 'gallery-2.jpg', 'gallery-3.jpg', 'gallery-4.jpg',
  'gallery-5.jpg', 'gallery-6.jpg', 'gallery-7.jpg', 'gallery-8.jpg',
];
let galleryIdx = 0;
let lbTouchX = 0;
let lbTouchY = 0;
let lbDragging = false;
let lbStartX = 0;
let lbDeltaX = 0;

function openLightbox(idx) {
  galleryIdx = ((idx % GALLERY_SRCS.length) + GALLERY_SRCS.length) % GALLERY_SRCS.length;
  const box = document.getElementById('lightbox');
  showGalleryImage(false);
  box.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('show');
  document.body.style.overflow = '';
  const img = document.getElementById('lightbox-img');
  if (img) {
    img.style.transform = '';
    img.classList.remove('swiping');
  }
}

/* B. soft crossfade */
function showGalleryImage(animate) {
  const img = document.getElementById('lightbox-img');
  const counter = document.getElementById('lb-counter');
  const dots = document.getElementById('lb-dots');
  if (!img) return;

  function updateMeta() {
    if (counter) counter.textContent = (galleryIdx + 1) + ' / ' + GALLERY_SRCS.length;
    if (dots) {
      dots.innerHTML = GALLERY_SRCS.map((_, i) =>
        '<span class="' + (i === galleryIdx ? 'on' : '') + '"></span>'
      ).join('');
    }
  }

  if (!animate) {
    img.classList.remove('swiping');
    img.style.transition = '';
    img.style.transform = '';
    img.style.opacity = '1';
    img.src = GALLERY_SRCS[galleryIdx];
    updateMeta();
    return;
  }

  img.classList.remove('swiping');
  img.style.transition = 'opacity 0.32s ease';
  img.style.transform = '';
  img.style.opacity = '0';

  setTimeout(function () {
    img.src = GALLERY_SRCS[galleryIdx];
    updateMeta();
    // slight delay so src swap paints before fade-in
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        img.style.transition = 'opacity 0.45s ease';
        img.style.opacity = '1';
      });
    });
  }, 280);
}

function galleryNav(dir) {
  galleryIdx = (galleryIdx + dir + GALLERY_SRCS.length) % GALLERY_SRCS.length;
  showGalleryImage(true);
}

function initLightboxSwipe() {
  const stage = document.getElementById('lb-stage');
  const box = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  if (!stage || !box) return;

  function onStart(clientX, clientY) {
    lbDragging = true;
    lbStartX = clientX;
    lbTouchX = clientX;
    lbTouchY = clientY;
    lbDeltaX = 0;
    if (img) img.classList.add('swiping');
  }

  function onMove(clientX, clientY) {
    if (!lbDragging || !img) return;
    lbDeltaX = clientX - lbStartX;
    const dy = Math.abs(clientY - lbTouchY);
    if (Math.abs(lbDeltaX) > dy) {
      // crossfade feel while dragging: dim only, no slide
      img.style.opacity = String(Math.max(0.4, 1 - Math.abs(lbDeltaX) / 280));
    }
  }

  function onEnd() {
    if (!lbDragging) return;
    lbDragging = false;
    if (img) img.classList.remove('swiping');

    const threshold = 48;
    if (lbDeltaX <= -threshold) {
      galleryNav(1);
    } else if (lbDeltaX >= threshold) {
      galleryNav(-1);
    } else if (img) {
      img.style.transition = 'opacity 0.28s ease';
      img.style.opacity = '1';
    }
    lbDeltaX = 0;
  }

  stage.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    onStart(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  stage.addEventListener('touchmove', (e) => {
    if (!lbDragging || e.touches.length !== 1) return;
    onMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  stage.addEventListener('touchend', onEnd);
  stage.addEventListener('touchcancel', onEnd);

  stage.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    onStart(e.clientX, e.clientY);
  });
  window.addEventListener('mousemove', (e) => {
    if (!lbDragging) return;
    onMove(e.clientX, e.clientY);
  });
  window.addEventListener('mouseup', onEnd);

  // backdrop click closes (not on stage/nav)
  box.addEventListener('click', (e) => {
    if (e.target === box || e.target.classList.contains('lb-meta') || e.target.classList.contains('lb-hint') || e.target.classList.contains('lb-counter') || e.target.id === 'lb-dots') {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('show')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') galleryNav(-1);
    if (e.key === 'ArrowRight') galleryNav(1);
  });
}

/* BGM */
function toggleBgm() {
  const audio = document.getElementById('bgm');
  const btn = document.getElementById('bgm-btn');
  if (audio.paused) {
    audio.play().then(() => btn.classList.add('playing')).catch(() => toast('재생을 허용해 주세요'));
  } else {
    audio.pause();
    btn.classList.remove('playing');
  }
}


/* INIT */
document.addEventListener('DOMContentLoaded', () => {
  applyPersonalization();
  renderCalendar();
  renderDday();
  initLightboxSwipe();

  // optional: auto-skip envelope on revisit (commented for demo polish — keep envelope)
  // try {
  //   if (localStorage.getItem('invite_opened') === '1') openInvitation(true);
  // } catch (e) {}
});
  
