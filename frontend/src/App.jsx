import { useEffect, useState } from 'react';
import { defaultContent } from './defaultContent.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
    footer: { ...defaultContent.footer, ...remoteContent.footer }
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

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState('Заявка отправляется на backend API.');
  const [content, setContent] = useState(defaultContent);

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
  }, []);

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

      setStatus('Спасибо. Заявка принята — мы свяжемся с вами для подбора формата обслуживания.');
      form.reset();
    } catch (error) {
      setStatus('Не удалось отправить заявку. Проверьте, запущен ли backend, или напишите нам в мессенджер.');
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="logo" href="#top" aria-label="На главную">
          <span className="logo-mark" />
          <span className="logo-text">{content.brand}</span>
        </a>

        <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
          {(content.nav || []).map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
        </nav>

        <a className="header-cta" href="#quiz">{content.headerCta}</a>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Открыть меню">☰</button>
      </header>

      <main id="top">
        <section className="hero section">
          <div className="hero-content">
            <p className="eyebrow">{content.hero.eyebrow}</p>
            <h1>{content.hero.title}</h1>
            <p className="lead">{content.hero.lead}</p>

            <div className="hero-actions">
              <a className="btn primary" href="#quiz">{content.hero.primaryCta}</a>
              <a className="btn secondary" href="#service">{content.hero.secondaryCta}</a>
            </div>

            <div className="hero-points">
              {(content.hero.badges || []).map((badge) => <span key={badge}>{badge}</span>)}
            </div>
          </div>

          <div className="hero-visual" aria-label="Светлый ухоженный интерьер">
            <div className="visual-card large" style={imageStyle(content.hero.visual.main.imageUrl)}><span>{content.hero.visual.main.label}</span></div>
            <div className="visual-card small top" style={imageStyle(content.hero.visual.top.imageUrl)}><span>{content.hero.visual.top.label}</span></div>
            <div className="visual-card small bottom" style={imageStyle(content.hero.visual.bottom.imageUrl)}><span>{content.hero.visual.bottom.label}</span></div>
          </div>
        </section>

        <section className="section intro" id="service">
          <div className="section-heading"><p className="eyebrow">{content.intro.eyebrow}</p><h2>{content.intro.title}</h2></div>
          <p className="wide-text">{content.intro.text}</p>
        </section>

        <section className="section audience">
          <div className="section-heading"><p className="eyebrow">{content.audience.eyebrow}</p><h2>{content.audience.title}</h2></div>
          <div className="cards four">
            {(content.audience.items || []).map((item) => <article className="card" key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>)}
          </div>
        </section>

        <section className="section compare">
          <div className="section-heading"><p className="eyebrow">{content.compare.eyebrow}</p><h2>{content.compare.title}</h2></div>
          <div className="compare-grid">
            <div className="compare-box muted"><h3>{content.compare.leftTitle}</h3><ul>{(content.compare.leftItems || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div className="compare-box accent"><h3>{content.compare.rightTitle}</h3><ul>{(content.compare.rightItems || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
          </div>
        </section>

        <section className="section services">
          <div className="section-heading"><p className="eyebrow">{content.services.eyebrow}</p><h2>{content.services.title}</h2></div>
          <div className="cards three">
            {(content.services.items || []).map((item) => <article className="card" key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>)}
          </div>
        </section>

        <section className="section formats" id="formats">
          <div className="section-heading"><p className="eyebrow">{content.formats.eyebrow}</p><h2>{content.formats.title}</h2></div>
          <div className="pricing-grid">
            {(content.formats.items || []).map((item) => (
              <article className={`format-card ${item.featured ? 'featured' : ''}`} key={item.title}>
                <span className="format-label">{item.number}</span><h3>{item.title}</h3><p>{item.text}</p><p className="best-for">{item.bestFor}</p>
              </article>
            ))}
          </div>
          <div className="center"><a className="btn primary" href="#quiz">{content.formats.cta}</a></div>
        </section>

        <section className="section value">
          <div className="value-card">
            <div><p className="eyebrow">{content.value.eyebrow}</p><h2>{content.value.title}</h2></div>
            <div><p>{content.value.text}</p><ul className="check-list">{(content.value.items || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
          </div>
        </section>

        <section className="section process" id="process">
          <div className="section-heading"><p className="eyebrow">{content.process.eyebrow}</p><h2>{content.process.title}</h2></div>
          <div className="steps">
            {(content.process.items || []).map((item, index) => <div className="step" key={item.title}><span>{index + 1}</span><h3>{item.title}</h3><p>{item.text}</p></div>)}
          </div>
        </section>

        <section className="section trust" id="trust">
          <div className="section-heading"><p className="eyebrow">{content.trust.eyebrow}</p><h2>{content.trust.title}</h2></div>
          <div className="cards three">
            {(content.trust.items || []).map((item) => <article className="card" key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>)}
          </div>
        </section>

        <section className="section people">
          <div className="people-grid">
            <div><p className="eyebrow">{content.people.eyebrow}</p><h2>{content.people.title}</h2><p>{content.people.text}</p></div>
            <div className="photo-grid">
              {(content.people.photos || []).map((photo) => <div className="photo-placeholder" style={imageStyle(photo.imageUrl)} key={photo.label}>{photo.label}</div>)}
            </div>
          </div>
        </section>

        <section className="section gallery">
          <div className="section-heading"><p className="eyebrow">{content.gallery.eyebrow}</p><h2>{content.gallery.title}</h2></div>
          <div className="gallery-row">
            {(content.gallery.items || []).map((item) => <div className="gallery-item" style={imageStyle(item.imageUrl)} key={item.label}>{item.label}</div>)}
          </div>
          <p className="caption">{content.gallery.caption}</p>
        </section>

        <section className="section reviews">
          <div className="section-heading"><p className="eyebrow">{content.reviews.eyebrow}</p><h2>{content.reviews.title}</h2></div>
          <div className="reviews-grid">
            {(content.reviews.items || []).map((item) => <blockquote key={item.author}><p>{item.text}</p><cite>{item.author}</cite></blockquote>)}
          </div>
        </section>

        <section className="section faq" id="faq">
          <div className="section-heading"><p className="eyebrow">{content.faq.eyebrow}</p><h2>{content.faq.title}</h2></div>
          <div className="faq-list">
            {(content.faq.items || []).map((item, index) => <details open={index === 0} key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
          </div>
        </section>

        <section className="section quiz" id="quiz">
          <div className="quiz-card">
            <div className="quiz-copy"><p className="eyebrow">{content.quiz.eyebrow}</p><h2>{content.quiz.title}</h2><p>{content.quiz.text}</p></div>
            <form className="quiz-form" onSubmit={handleSubmit}>
              <label>Что нужно обслуживать?<select name="object" required><option value="">Выберите вариант</option><option>Квартира</option><option>Дом</option><option>Апартаменты</option></select></label>
              <label>Площадь пространства<select name="area" required><option value="">Выберите площадь</option><option>До 60 м²</option><option>60–100 м²</option><option>100–200 м²</option><option>Более 200 м²</option></select></label>
              <label>Как часто нужен уход?<select name="frequency" required><option value="">Выберите частоту</option><option>1 раз в неделю</option><option>2 раза в неделю</option><option>Несколько раз в месяц</option><option>Хочу обсудить</option></select></label>
              <label>Что особенно важно?<textarea name="details" rows="3" placeholder="Кухня, санузлы, пыль, порядок, дети, животные, дорогие материалы..." /></label>
              <label>Телефон или мессенджер<input type="text" name="contact" placeholder="+7..." required /></label>
              <button className="btn primary full" type="submit">{content.quiz.button}</button>
              <p className="form-note">{status}</p>
            </form>
          </div>
        </section>

        <section className="section final">
          <h2>{content.final.title}</h2><p>{content.final.text}</p><a className="btn primary" href="#quiz">{content.final.cta}</a><span>{content.final.note}</span>
        </section>
      </main>

      <footer className="footer">
        <div><strong>{content.brand}</strong><p>{content.footer.text}</p></div>
        <div className="footer-links"><a href={content.footer.phoneHref}>{content.footer.phoneLabel}</a><a href={content.footer.whatsappUrl}>{content.footer.whatsappLabel}</a><a href={content.footer.telegramUrl}>{content.footer.telegramLabel}</a></div>
      </footer>
    </>
  );
}
