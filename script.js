/* CleanPro interactions 2.0 — shared header, modal, calculator, tabs and filters */
(function () {
  'use strict';
  var doc = document;
  var body = doc.body;
  var header = doc.querySelector('.header');
  var hero = doc.querySelector('.hero, .page-hero');
  var burger = doc.getElementById('burger');
  var menu = doc.getElementById('mobile-menu');
  var menuClose = doc.getElementById('mmenu-close');
  var popup = doc.getElementById('popup');
  var popupForm = doc.getElementById('popup-form');
  var popupService = doc.getElementById('popup-service');
  var popupDetails = doc.getElementById('popup-details');
  var popupDone = doc.getElementById('popup-done');
  var lastFocus = null;
  var activeTrigger = null;
  // Set this to your form API URL when a backend is ready. Empty means no external submission.
  var LEAD_ENDPOINT = window.CLEANPRO_LEAD_ENDPOINT || (popupForm && popupForm.getAttribute('data-endpoint')) || '';
  var copyRequestButton = doc.querySelector('[data-copy-request]');

  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    body.style.overflow = popup && !popup.hidden ? 'hidden' : '';
    window.setTimeout(function () {
      if (!menu.classList.contains('is-open')) menu.hidden = true;
    }, 300);
  }
  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    void menu.offsetHeight;
    menu.classList.add('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    body.style.overflow = 'hidden';
    if (menuClose) menuClose.focus();
  }
  if (burger && menu) burger.addEventListener('click', function () {
    if (menu.classList.contains('is-open')) closeMenu(); else openMenu();
  });
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  if (menu) menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });

  function updateHeader() {
    if (!header) return;
    var threshold = hero ? Math.max(180, hero.offsetHeight - 90) : 260;
    header.classList.toggle('is-fixed', window.scrollY > threshold);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader);
  updateHeader();

  // Active navigation remains consistent across every static HTML route.
  var currentFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  doc.querySelectorAll('[data-nav]').forEach(function (link) {
    var nav = link.getAttribute('data-nav');
    var active = false;
    if (nav === 'prices') active = currentFile === 'tseny.html';
    else if (nav === 'business') active = currentFile === 'uborka-ofisov.html' || currentFile === 'uborka-kommercheskikh-pomeshcheniy.html';
    else if (nav === 'services') active = ['index.html', 'uborka-kvartir.html', 'generalnaya-uborka.html', 'uborka-posle-remonta.html', 'srochnaya-uborka.html', 'uborka-domov-i-kottedzhey.html', 'moika-okon.html', 'himchistka-mebeli-i-kovrov.html'].indexOf(currentFile) >= 0 || currentFile === '';
    else if (nav === 'about') active = currentFile === 'index.html' && window.location.hash === '#about';
    if (active) { link.classList.add('is-active'); link.setAttribute('aria-current', 'page'); }
    else { link.classList.remove('is-active'); link.removeAttribute('aria-current'); }
  });
  doc.querySelectorAll('[data-current-year]').forEach(function (n) { n.textContent = String(new Date().getFullYear()); });

  // Content stays visible by default; observers may add an enhancement class only.
  // This avoids blank sections when reduced-motion tools or full-page captures skip scrolling.
  var reveal = doc.querySelectorAll('[data-reveal]');
  reveal.forEach(function (el) { el.classList.add('is-visible'); });

  // Remote photos are progressive enhancement: if a source is unavailable, keep a designed fallback.
  function markImageUnavailable(img) {
    if (!img || img.dataset.fallbackMarked === 'true') return;
    img.dataset.fallbackMarked = 'true';
    img.classList.add('image-is-missing');
    var host = img.closest('.hero__visual, .about__media, .svc__img, .case, .place, .page-hero__visual, .page-example__visual, .fcard--service');
    if (host) host.classList.add('image-fallback-host');
  }
  doc.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('error', function () { markImageUnavailable(img); });
    img.addEventListener('load', function () {
      img.classList.remove('image-is-missing');
      img.dataset.fallbackMarked = 'false';
      var host = img.closest('.hero__visual, .about__media, .svc__img, .case, .place, .page-hero__visual, .page-example__visual, .fcard--service');
      if (host && !host.querySelector('img:not(.image-is-missing)')) host.classList.remove('image-fallback-host');
    });
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) markImageUnavailable(img);
  });

  function normaliseService(input) {
    var v = (input || '').toLowerCase();
    if (v.indexOf('после ремонта') >= 0 || v.indexOf('post-renovation') >= 0) return 'post-renovation';
    if (v.indexOf('генераль') >= 0 || v === 'general') return 'general';
    if (v.indexOf('сроч') >= 0 || v === 'urgent') return 'urgent';
    if (v.indexOf('коттедж') >= 0 || v.indexOf('домов') >= 0 || v === 'house') return 'house';
    if (v.indexOf('офис') >= 0 || v === 'office') return 'office';
    if (v.indexOf('коммерчес') >= 0 || v === 'commercial') return 'commercial';
    if (v.indexOf('окон') >= 0 || v === 'windows') return 'windows';
    if (v.indexOf('химчист') >= 0 || v.indexOf('мебели') >= 0 || v === 'drycleaning') return 'drycleaning';
    if (v.indexOf('квартир') >= 0 || v.indexOf('поддерж') >= 0 || v === 'flat') return 'flat';
    if (v === 'home' || v === 'prices' || v === 'privacy') return '';
    return v === 'other' ? 'other' : '';
  }
  function serviceFromTrigger(trigger) {
    if (trigger && trigger.dataset && trigger.dataset.service) return normaliseService(trigger.dataset.service);
    var row = trigger && trigger.closest('tr');
    if (row) return normaliseService(row.querySelector('td') ? row.querySelector('td').textContent : '');
    var card = trigger && trigger.closest('.svc, .pcard, .place, .page-card, article');
    if (card) {
      var title = card.querySelector('.svc__name, .pcard__name, .place__name, h3, h2');
      if (title) return normaliseService(title.textContent);
    }
    return normaliseService(body.getAttribute('data-service') || '');
  }
  function openPopup(trigger, details) {
    if (!popup) return;
    closeMenu();
    activeTrigger = trigger || doc.activeElement;
    lastFocus = doc.activeElement;
    if (popupDone) { popupDone.hidden = true; popupDone.classList.remove('is-error', 'is-success'); popupDone.textContent = ''; }
    if (copyRequestButton) { copyRequestButton.hidden = true; copyRequestButton.textContent = 'Скопировать данные заявки'; }
    if (popupForm) {
      popupForm.reset();
      var guessed = serviceFromTrigger(trigger);
      if (popupService) popupService.value = guessed || '';
      if (popupDetails && details) popupDetails.value = details;
    }
    popup.hidden = false;
    void popup.offsetHeight;
    popup.classList.add('is-open');
    body.style.overflow = 'hidden';
    var first = popup.querySelector('input:not([type="checkbox"]), select, textarea');
    if (!first) first = popup.querySelector('.popup__close');
    if (first) window.setTimeout(function () { first.focus(); }, 40);
  }
  function closePopup() {
    if (!popup || popup.hidden) return;
    popup.classList.remove('is-open');
    body.style.overflow = (menu && !menu.hidden && menu.classList.contains('is-open')) ? 'hidden' : '';
    window.setTimeout(function () { if (!popup.classList.contains('is-open')) popup.hidden = true; }, 260);
    if (lastFocus && typeof lastFocus.focus === 'function') window.setTimeout(function () { lastFocus.focus(); }, 0);
  }
  doc.querySelectorAll('[data-popup]').forEach(function (trigger) {
    trigger.addEventListener('click', function (event) {
      event.preventDefault();
      var ctx = '';
      var calc = trigger.closest('#calc-form');
      if (calc) ctx = buildCalcDetails();
      openPopup(trigger, ctx);
    });
  });
  if (popup) {
    popup.querySelectorAll('[data-popup-close]').forEach(function (el) { el.addEventListener('click', closePopup); });
    doc.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closePopup();
        closeMenu();
      }
      if (event.key === 'Tab' && popup && !popup.hidden && popup.classList.contains('is-open')) {
        var items = Array.prototype.slice.call(popup.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]')).filter(function (el) { return el.offsetParent !== null; });
        if (!items.length) return;
        var first = items[0], last = items[items.length - 1];
        if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }

  // Phone input: keep typing natural and format Russian numbers on blur.
  function formatPhone(raw) {
    var digits = raw.replace(/\D/g, '');
    if (!digits) return raw;
    if (digits[0] === '8') digits = '7' + digits.slice(1);
    if (digits[0] !== '7') digits = '7' + digits;
    digits = digits.slice(0, 11);
    if (digits.length <= 1) return '+7';
    var out = '+7';
    if (digits.length > 1) out += ' (' + digits.slice(1, 4);
    if (digits.length >= 4) out += ')';
    if (digits.length > 4) out += ' ' + digits.slice(4, 7);
    if (digits.length > 7) out += '-' + digits.slice(7, 9);
    if (digits.length > 9) out += '-' + digits.slice(9, 11);
    return out;
  }
  var phoneInput = popupForm && popupForm.querySelector('input[name="phone"]');
  if (phoneInput) {
    phoneInput.addEventListener('blur', function () { if (phoneInput.value.trim()) phoneInput.value = formatPhone(phoneInput.value); });
    phoneInput.addEventListener('input', function () { phoneInput.removeAttribute('aria-invalid'); phoneInput.setCustomValidity(''); });
  }
  function buildRequestText() {
    if (!popupForm) return '';
    var data = {};
    new FormData(popupForm).forEach(function (value, key) { data[key] = value; });
    var serviceSelect = popupForm.querySelector('[name="service"]');
    var serviceText = serviceSelect && serviceSelect.selectedOptions.length ? serviceSelect.selectedOptions[0].textContent : (data.service || 'не указана');
    return [
      'Заявка CleanPro',
      'Имя: ' + (data.name || 'не указано'),
      'Телефон: ' + (data.phone || 'не указан'),
      'Услуга: ' + serviceText,
      'Комментарий: ' + (data.details || 'нет'),
      'Согласие с политикой: ' + (data.privacy ? 'да' : 'нет')
    ].join('\n');
  }
  function showPopupStatus(message, type) {
    if (!popupDone) return;
    popupDone.hidden = false;
    popupDone.classList.remove('is-error', 'is-success');
    if (type) popupDone.classList.add('is-' + type);
    popupDone.textContent = message;
  }
  function submitToEndpoint() {
    if (!popupForm || !LEAD_ENDPOINT) return Promise.resolve(false);
    var payload = {};
    new FormData(popupForm).forEach(function (value, key) { payload[key] = value; });
    var submitButton = popupForm.querySelector('[type="submit"]');
    var oldText = submitButton ? submitButton.innerHTML : '';
    if (submitButton) { submitButton.disabled = true; submitButton.setAttribute('aria-busy', 'true'); submitButton.textContent = 'Отправляем…'; }
    return fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (response) {
      if (!response.ok) throw new Error('Request failed: ' + response.status);
      showPopupStatus('Спасибо! Заявка отправлена. Мы свяжемся с вами по указанному телефону.', 'success');
      if (copyRequestButton) copyRequestButton.hidden = true;
      return true;
    }).catch(function () {
      showPopupStatus('Не удалось передать заявку. Скопируйте её данные и свяжитесь с нами по телефону.', 'error');
      if (copyRequestButton) copyRequestButton.hidden = false;
      return false;
    }).then(function (sent) {
      if (submitButton) { submitButton.disabled = false; submitButton.removeAttribute('aria-busy'); submitButton.innerHTML = oldText; }
      return sent;
    });
  }
  if (popupForm) {
    popupForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var phone = popupForm.querySelector('[name="phone"]');
      var digits = phone ? phone.value.replace(/\D/g, '') : '';
      // Normalize a 10-digit local number to a complete Russian number before validation/submission.
      if (phone && (digits.length === 10 || digits.length === 11)) {
        phone.value = formatPhone(phone.value);
        digits = phone.value.replace(/\D/g, '');
      }
      if (phone && digits.length !== 11) {
        phone.setAttribute('aria-invalid', 'true');
        phone.setCustomValidity('Укажите номер телефона: 10 цифр или полный номер с кодом страны.');
        phone.reportValidity();
        phone.focus();
        return;
      }
      if (phone) phone.setCustomValidity('');
      if (!popupForm.checkValidity()) { popupForm.reportValidity(); return; }
      if (popupDone) { popupDone.hidden = true; popupDone.classList.remove('is-error', 'is-success'); }
      if (copyRequestButton) copyRequestButton.hidden = true;
      if (LEAD_ENDPOINT) {
        submitToEndpoint();
      } else {
        showPopupStatus('Форма заполнена, но отправка ещё не подключена. Скопируйте данные заявки или подключите обработчик формы — менеджер пока не получил обращение.', '');
        if (copyRequestButton) copyRequestButton.hidden = false;
      }
    });
  }
  if (copyRequestButton) {
    copyRequestButton.addEventListener('click', function () {
      var text = buildRequestText();
      function success() {
        copyRequestButton.textContent = 'Данные заявки скопированы';
        copyRequestButton.classList.add('is-copied');
      }
      function fallbackCopy() {
        var area = doc.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed'; area.style.opacity = '0'; area.style.pointerEvents = 'none';
        body.appendChild(area); area.select();
        var ok = false;
        try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
        body.removeChild(area);
        if (ok) success(); else showPopupStatus('Не получилось скопировать автоматически. Скопируйте текст формы вручную и свяжитесь с нами по телефону.', 'error');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(success).catch(fallbackCopy);
      } else fallbackCopy();
    });
  }

  // Home page: the object tabs update the editorial copy/photo and sync the calculator.
  var tabCopy = {
    flat: { title: 'Мы заботимся о чистоте, чтобы у вас оставалось <span class="accent">больше времени</span> на важное.', lead: 'Поддерживающая и генеральная уборка квартиры — по согласованному перечню работ.', alt: 'Профессиональная уборка квартиры', image: 'assets-20-photos/home-service-maintenance.webp' },
    house: { title: 'Чистота загородного дома — без лишних <span class="accent">хлопот</span>.', lead: 'Учитываем площадь, этажность и дополнительные помещения, чтобы заранее согласовать объём работ.', alt: 'Светлый интерьер загородного дома', image: 'assets-20-photos/home-where-house.webp' },
    office: { title: 'Чистое рабочее пространство — с <span class="accent">понятным графиком</span>.', lead: 'Для офисов и коммерческих объектов уточняем зоны, частоту уборки и удобный режим доступа.', alt: 'Современное офисное пространство', image: 'assets-20-photos/home-service-office.webp' }
  };
  var tabs = Array.prototype.slice.call(doc.querySelectorAll('.tab[data-obj]'));
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (other) { other.classList.toggle('is-on', other === tab); other.setAttribute('aria-selected', other === tab ? 'true' : 'false'); });
      var obj = tab.getAttribute('data-obj') || 'flat';
      var copy = tabCopy[obj];
      var title = doc.querySelector('.about__title');
      var lead = doc.querySelector('.about__lead');
      var image = doc.querySelector('.about__media > img');
      if (copy && title && lead && image) {
        title.innerHTML = copy.title;
        lead.textContent = copy.lead;
        image.alt = copy.alt;
        image.src = copy.image;
      }
    });
  });

  // Service carousel: scroll one complete card and keep arrow states in sync.
  var rail = doc.getElementById('rail');
  var prev = doc.getElementById('rail-prev');
  var next = doc.getElementById('rail-next');
  if (rail && prev && next) {
    function step() {
      var card = rail.querySelector('.svc');
      if (!card) return 320;
      var style = window.getComputedStyle(rail);
      var gap = parseFloat(style.columnGap || style.gap) || 22;
      return card.getBoundingClientRect().width + gap;
    }
    function syncRail() {
      var max = Math.max(0, rail.scrollWidth - rail.clientWidth - 2);
      prev.disabled = rail.scrollLeft <= 2;
      next.disabled = rail.scrollLeft >= max;
      prev.setAttribute('aria-disabled', prev.disabled ? 'true' : 'false');
      next.setAttribute('aria-disabled', next.disabled ? 'true' : 'false');
    }
    prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: 'smooth' }); });
    rail.addEventListener('scroll', syncRail, { passive: true });
    window.addEventListener('resize', syncRail);
    if ('ResizeObserver' in window) new ResizeObserver(syncRail).observe(rail);
    syncRail();
  }

  // Price filters: display only rows matching the selected service group.
  var filters = doc.querySelectorAll('[data-price-filter]');
  var priceRows = doc.querySelectorAll('tr[data-price-category]');
  if (filters.length && priceRows.length) {
    var result = doc.querySelector('.price-filter__result');
    function applyFilter(value) {
      var visible = 0;
      priceRows.forEach(function (row) {
        var show = value === 'all' || row.getAttribute('data-price-category') === value;
        row.hidden = !show;
        if (show) visible++;
      });
      filters.forEach(function (button) {
        var active = button.getAttribute('data-price-filter') === value;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      if (result) {
        var names = { all: 'Показаны все направления', home: 'Показаны услуги для дома', business: 'Показаны услуги для бизнеса', special: 'Показаны специализированные услуги' };
        result.textContent = (names[value] || 'Выбранная категория') + ' · ' + visible + ' ' + (visible === 1 ? 'услуга' : (visible >= 2 && visible <= 4 ? 'услуги' : 'услуг'));
      }
    }
    filters.forEach(function (button) { button.addEventListener('click', function () { applyFilter(button.getAttribute('data-price-filter') || 'all'); }); });
    applyFilter('all');
  }

  // Calculator. The selection changes the actual displayed estimate, and submit carries
  // the selected object, service and area into the request modal rather than scrolling.
  var calcForm = doc.getElementById('calc-form');
  var calcState = { object: 'flat', rate: 170, fixed: false, service: 'flat' };
  var area = doc.getElementById('area');
  var areaOut = doc.getElementById('area-out');
  var sumEl = doc.getElementById('calc-sum');
  var noteEl = doc.getElementById('calc-note');
  var calcDone = doc.getElementById('calc-done');
  function fmt(n) { return Math.round(n).toLocaleString('ru-RU') + ' ₽'; }
  function selectedCleanName() {
    var selected = calcForm && calcForm.querySelector('[data-clean].is-on');
    return selected ? selected.textContent.trim() : 'Поддерживающая уборка';
  }
  function buildCalcDetails() {
    var a = area ? parseInt(area.value, 10) || 50 : null;
    var objectNames = { flat: 'квартира', house: 'дом', office: 'офис' };
    return 'Объект: ' + (objectNames[calcState.object] || 'не указан') + (a ? '; площадь: ' + a + ' м²' : '') + '; услуга: ' + selectedCleanName() + '; предварительная оценка: ' + (sumEl ? sumEl.textContent : 'по согласованию') + '. Итоговая стоимость требует подтверждения.';
  }
  if (calcForm && area && areaOut && sumEl && noteEl) {
    var objectButtons = calcForm.querySelectorAll('.chip[data-obj]');
    var cleanButtons = calcForm.querySelectorAll('.chip[data-clean]');
    function calculate() {
      var a = parseInt(area.value, 10) || 50;
      areaOut.textContent = String(a);
      var sum = calcState.fixed ? calcState.rate : Math.round(calcState.rate * a * (calcState.object === 'office' ? 1.1 : 1) / 10) * 10;
      sumEl.textContent = fmt(sum);
      noteEl.textContent = calcState.fixed
        ? 'Ориентир за одну позицию. Точная стоимость зависит от предмета и его состояния.'
        : 'Ориентировочно: ' + calcState.rate + ' ₽ × ' + a + ' м²' + (calcState.object === 'office' ? ' с коэффициентом для офиса' : '') + '. Сумма уточняется по составу работ.';
    }
    objectButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        objectButtons.forEach(function (item) { var active = item === button; item.classList.toggle('is-on', active); item.setAttribute('aria-checked', active ? 'true' : 'false'); });
        calcState.object = button.getAttribute('data-obj') || 'flat';
        calculate();
      });
    });
    cleanButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        cleanButtons.forEach(function (item) { var active = item === button; item.classList.toggle('is-on', active); item.setAttribute('aria-checked', active ? 'true' : 'false'); });
        calcState.rate = parseInt(button.getAttribute('data-clean'), 10) || 170;
        calcState.fixed = button.hasAttribute('data-fixed');
        var txt = button.textContent.toLowerCase();
        calcState.service = normaliseService(txt);
        calculate();
      });
    });
    area.addEventListener('input', calculate);
    calcForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var current = calcForm.querySelector('[data-clean].is-on');
      var service = current ? normaliseService(current.textContent) : 'flat';
      openPopup(current || calcForm.querySelector('button[type="submit"]'), buildCalcDetails());
      if (popupService && service) popupService.value = service;
      if (calcDone) calcDone.hidden = true;
    });
    calculate();
  }
})();
