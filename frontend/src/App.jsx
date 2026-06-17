import { useEffect, useState } from 'react';
import { defaultContent } from './defaultContent.js';

const API_URL = import.meta.env.VITE_API_URL || '';

function mergeContent(remoteContent) {
  if (!remoteContent) return defaultContent;

  return {
    ...defaultContent,
    ...remoteContent,
    hero: { ...defaultContent.hero, ...remoteContent.hero, visual: { ...defaultContent.hero.visual, ...(remoteContent.hero?.visual || {}) } },
    intro: { ...defaultContent.intro, ...remoteContent.intro },
    audience: { ...defaultContent.audience, ...remoteContent.audience },
    compare: { ...defaultContent.compare, ...remoteContent.compare },
    services: { ...defaultContent.services, ...remoteContent.services },
    formats: { ...defaultContent.formats, ...remoteContent.formats },
    value: { ...defaultContent.value, ...remoteContent.value },
    process: { ...defaultContent.process, ...remoteContent.process },
    trust: { ...defaultContent.trust, ...remoteContent.trust },
    people: { ...defaultContent.people, ...remoteContent.people },
    gallery: { ...defaultContent.gallery, ...remoteContent.gallery },
    reviews: { ...defaultContent.reviews, ...remoteContent.reviews },
    faq: { ...defaultContent.faq, ...remoteContent.faq },
    quiz: { ...defaultContent.quiz, ...remoteContent.quiz },
    final: { ...defaultContent.final, ...remoteContent.final },
    footer: { ...defaultContent.footer, ...remoteContent.footer },
    legal: { ...(defaultContent.legal || {}), ...(remoteContent.legal || {}) }
  };
}

function imageStyle(imageUrl) {
  if (!imageUrl) return undefined;
  return {
    backgroundImage: `linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.32)), url(${imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };
}

function hasLegalInfo(legal = {}) {
  return Boolean(legal.companyName || legal.inn || legal.ogrn || legal.address || legal.email || legal.privacyUrl || legal.policyUrl || legal.consentUrl);
}

const checkboxLabelStyle = { display: 'grid', gridTemplateColumns: '18px 1fr', gap: '10px', alignItems: 'start', fontWeight: 500, fontSize: '13px', color: '#706a61' };
const checkboxInputStyle = { width: '18px', height: '18px', marginTop: '3px', accentColor: '#6f5948' };

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState('Оставьте заявку — мы свяжемся с вами в течение 30 минут и предложим подходящий формат обслуживания.');
  const [content, setContent] = useState(defaultContent);
  const [showCookieNotice, setShowCookieNotice] = useState(false);

  useEffect(() => {
    async function loadContent() {
      try {
        const response = await fetch(`${API_URL}/api/content`);
        const data = await response.json();
        setContent(mergeContent(data.content));
      } catch (error) {
        setContent(defaultContent);
      }
    }

    loadContent();

    try {
      setShowCookieNotice(localStorage.getItem('cookieConsent') !== 'accepted');
    } catch (error) {
      setShowCookieNotice(true);
    }
  }, []);

  function acceptCookies() {
    try {
      localStorage.setItem('cookieConsent', 'accepted');
    } catch (error) {
      // ignore storage errors
    }

    setShowCookieNotice(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus('Отправляем заявку...');

    try {
      const response = await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, source: 'site-quiz' })
      });

      if (!response.ok) throw new Error('Request failed');

      setStatus('Спасибо. Заявка принята — менеджер свяжется с вами в течение 30 минут.');
      form.reset();
    } catch (error) {
      setStatus('Заявку не удалось отправить. Пожалуйста, попробуйте ещё раз или напишите нам в мессенджер.');
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="logo" href="#top" aria-label="На главную"><span className="logo-mark" /><span className="logo-text">{content.brand}</span></a>
        <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>{(content.nav || []).map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}<a href="/prices">Цены</a></nav>
        <a className="header-cta" href="#quiz">{content.headerCta}</a>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Открыть меню">☰</button>
      </header>

      <main id="top">
        <section className="hero section">
          <div className="hero-content">
            <p className="eyebrow">{content.hero.eyebrow}</p><h1>{content.hero.title}</h1><p className="lead">{content.hero.lead}</p>
            <div className="hero-actions"><a className="btn primary" href="#quiz">{content.hero.primaryCta}</a><a className="btn secondary" href="#service">{content.hero.secondaryCta}</a></div>
            <div className="hero-points">{(content.hero.badges || []).map((badge) => <span key={badge}>{badge}</span>)}</div>
          </div>
          <div className="hero-visual" aria-label="Светлый ухоженный интерьер">
            <div className="visual-card large" style={imageStyle(content.hero.visual.main.imageUrl)}><span>{content.hero.visual.main.label}</span></div>
            <div className="visual-card small top" style={imageStyle(content.hero.visual.top.imageUrl)}><span>{content.hero.visual.top.label}</span></div>
            <div className="visual-card small bottom" style={imageStyle(content.hero.visual.bottom.imageUrl)}><span>{content.hero.visual.bottom.label}</span></div>
          </div>
        </section>

        <section className="section intro" id="service"><div className="section-heading"><p className="eyebrow">{content.intro.eyebrow}</p><h2>{content.intro.title}</h2></div><p className="wide-text">{content.intro.text}</p></section>
        <section className="section audience"><div className="section-heading"><p className="eyebrow">{content.audience.eyebrow}</p><h2>{content.audience.title}</h2></div><div className="cards four">{(content.audience.items || []).map((item) => <article className="card" key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
        <section className="section compare"><div className="section-heading"><p className="eyebrow">{content.compare.eyebrow}</p><h2>{content.compare.title}</h2></div><div className="compare-grid"><div className="compare-box muted"><h3>{content.compare.leftTitle}</h3><ul>{(content.compare.leftItems || []).map((item) => <li key={item}>{item}</li>)}</ul></div><div className="compare-box accent"><h3>{content.compare.rightTitle}</h3><ul>{(content.compare.rightItems || []).map((item) => <li key={item}>{item}</li>)}</ul></div></div></section>
        <section className="section services"><div className="section-heading"><p className="eyebrow">{content.services.eyebrow}</p><h2>{content.services.title}</h2></div><div className="cards three">{(content.services.items || []).map((item) => <article className="card" key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
        <section className="section formats" id="formats"><div className="section-heading"><p className="eyebrow">{content.formats.eyebrow}</p><h2>{content.formats.title}</h2></div><div className="pricing-grid">{(content.formats.items || []).map((item) => <article className={`format-card ${item.featured ? 'featured' : ''}`} key={item.title}><span className="format-label">{item.number}</span><h3>{item.title}</h3><p>{item.text}</p><p className="best-for">{item.bestFor}</p></article>)}</div><div className="center"><a className="btn primary" href="#quiz">{content.formats.cta}</a></div></section>
        <section className="section value"><div className="value-card"><div><p className="eyebrow">{content.value.eyebrow}</p><h2>{content.value.title}</h2></div><div><p>{content.value.text}</p><ul className="check-list">{(content.value.items || []).map((item) => <li key={item}>{item}</li>)}</ul></div></div></section>
        <section className="section process" id="process"><div className="section-heading"><p className="eyebrow">{content.process.eyebrow}</p><h2>{content.process.title}</h2></div><div className="steps">{(content.process.items || []).map((item, index) => <div className="step" key={item.title}><span>{index + 1}</span><h3>{item.title}</h3><p>{item.text}</p></div>)}</div></section>
        <section className="section trust" id="trust"><div className="section-heading"><p className="eyebrow">{content.trust.eyebrow}</p><h2>{content.trust.title}</h2></div><div className="cards three">{(content.trust.items || []).map((item) => <article className="card" key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
        <section className="section people"><div className="people-grid"><div><p className="eyebrow">{content.people.eyebrow}</p><h2>{content.people.title}</h2><p>{content.people.text}</p></div><div className="photo-grid">{(content.people.photos || []).map((photo) => <div className="photo-placeholder" style={imageStyle(photo.imageUrl)} key={photo.label}>{photo.label}</div>)}</div></div></section>
        <section className="section gallery"><div className="section-heading"><p className="eyebrow">{content.gallery.eyebrow}</p><h2>{content.gallery.title}</h2></div><div className="gallery-row">{(content.gallery.items || []).map((item) => <div className="gallery-item" style={imageStyle(item.imageUrl)} key={item.label}>{item.label}</div>)}</div><p className="caption">{content.gallery.caption}</p></section>
        <section className="section reviews"><div className="section-heading"><p className="eyebrow">{content.reviews.eyebrow}</p><h2>{content.reviews.title}</h2></div><div className="reviews-grid">{(content.reviews.items || []).map((item) => <blockquote key={item.author}><p>{item.text}</p><cite>{item.author}</cite></blockquote>)}</div></section>
        <section className="section faq" id="faq"><div className="section-heading"><p className="eyebrow">{content.faq.eyebrow}</p><h2>{content.faq.title}</h2></div><div className="faq-list">{(content.faq.items || []).map((item, index) => <details open={index === 0} key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></section>

        <section className="section quiz" id="quiz"><div className="quiz-card"><div className="quiz-copy"><p className="eyebrow">{content.quiz.eyebrow}</p><h2>{content.quiz.title}</h2><p>{content.quiz.text}</p></div><form className="quiz-form" onSubmit={handleSubmit}>
          <label>Тип помещения<select name="object" required><option value="">Выберите вариант</option><option>Квартира</option><option>Дом</option><option>Апартаменты</option><option>Офис</option></select></label>
          <label>Площадь помещения<select name="area"><option value="">Можно не указывать</option><option>До 60 м²</option><option>60–100 м²</option><option>100–200 м²</option><option>Более 200 м²</option><option>Хочу обсудить</option></select></label>
          <label>Как часто нужен уход?<select name="frequency" required><option value="">Выберите частоту</option><option>Разовая уборка</option><option>Ежедневно</option><option>1 раз в неделю</option><option>2 раза в неделю</option><option>Периодически</option><option>Хочу обсудить</option></select></label>
          <label>Дополнительная информация<textarea name="details" rows="3" placeholder="Пожелания, зоны внимания, ограничения по средствам, удобное время, особенности помещения..." /></label>
          <label>Телефон или мессенджер<input type="text" name="contact" placeholder="+7..." required /></label>
          <label className="consent-checkbox" style={checkboxLabelStyle}><input type="checkbox" name="personalDataConsent" required style={checkboxInputStyle} /><span>Я соглашаюсь с <a href="/consent.html" target="_blank" rel="noreferrer">обработкой персональных данных</a>, принимаю <a href="/privacy.html" target="_blank" rel="noreferrer">Политику защиты и обработки персональных данных</a> и ознакомлен(а) с <a href="/offer.html" target="_blank" rel="noreferrer">условиями оказания услуг</a>.</span></label>
          <label className="consent-checkbox" style={checkboxLabelStyle}><input type="checkbox" name="marketingConsent" value="yes" style={checkboxInputStyle} /><span>Согласен(на) получать сервисные и маркетинговые сообщения о клининговых услугах, акциях и специальных предложениях. Можно отказаться в любой момент. <a href="/marketing-consent.html" target="_blank" rel="noreferrer">Подробнее</a>.</span></label>
          <button className="btn primary full" type="submit">{content.quiz.button}</button>
          <p className="form-note">{status}</p>
        </form></div></section>

        <section className="section final"><h2>{content.final.title}</h2><p>{content.final.text}</p><a className="btn primary" href="#quiz">{content.final.cta}</a><span>{content.final.note}</span></section>
      </main>

      <footer className="footer">
        <div className="footer-main"><div><strong>{content.brand}</strong><p>{content.footer.text}</p></div><div className="footer-links"><a href="/prices">Цены</a><a href={content.footer.phoneHref}>{content.footer.phoneLabel}</a><a href={content.footer.whatsappUrl}>{content.footer.whatsappLabel}</a><a href={content.footer.telegramUrl}>{content.footer.telegramLabel}</a></div></div>
        {hasLegalInfo(content.legal) && <div className="footer-legal"><strong>{content.legal.title || 'Юридическая информация'}</strong>{content.legal.companyName && <span>{content.legal.companyName}</span>}{content.legal.inn && <span>ИНН: {content.legal.inn}</span>}{content.legal.ogrn && <span>ОГРНИП/ОГРН: {content.legal.ogrn}</span>}{content.legal.address && <span>Адрес: {content.legal.address}</span>}{content.legal.email && <a href={`mailto:${content.legal.email}`}>{content.legal.email}</a>}<div className="footer-policy-links"><a href="/privacy.html">Политика обработки персональных данных</a><a href="/consent.html">Согласие на обработку персональных данных</a><a href="/offer.html">Условия оказания услуг</a><a href="/marketing-consent.html">Согласие на рекламные сообщения</a></div></div>}
      </footer>

      {showCookieNotice && <div style={{ position: 'fixed', left: '16px', right: '16px', bottom: '16px', zIndex: 100, maxWidth: '980px', margin: '0 auto', padding: '18px', borderRadius: '24px', background: '#fff', border: '1px solid #e6dfd4', boxShadow: '0 24px 80px rgba(68,55,43,.16)', display: 'grid', gap: '12px' }}><p style={{ margin: 0, color: '#706a61', fontSize: '14px' }}>Сайт использует cookie-файлы и технические данные, чтобы обеспечить работу сайта, улучшать сервис и анализировать обращения. Подробнее — в <a href="/privacy.html" target="_blank" rel="noreferrer">Политике защиты и обработки персональных данных</a>.</p><button className="btn primary" type="button" onClick={acceptCookies} style={{ justifySelf: 'start' }}>Понятно</button></div>}
    </>
  );
}
