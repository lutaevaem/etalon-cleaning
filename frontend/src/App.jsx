import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const audience = [
  ['Занятые девушки', 'Когда работа, встречи, спорт, личная жизнь и планы важнее бытовой рутины.'],
  ['Женщины с семьёй', 'Когда хочется порядка, но не хочется постоянно организовывать и контролировать.'],
  ['Большие квартиры и дома', 'Когда пространство требует регулярного внимания, аккуратности и системного ухода.'],
  ['Те, кто ценит сервис', 'Когда важны пунктуальность, деликатность, безопасность и бережное отношение к дому.']
];

const services = [
  ['Регулярная поддерживающая уборка', 'Комнаты, кухня, санузлы, прихожая и общие зоны: чистота, свежесть и порядок по графику.'],
  ['Генеральный уход по графику', 'Периодическая глубокая уборка: труднодоступные зоны, фасады, плинтусы, светильники и детали.'],
  ['Уход за кухней', 'Поверхности, фасады, техника снаружи, рабочие зоны, раковина и столешницы.'],
  ['Уход за санузлами', 'Сантехника, зеркала, стеклянные поверхности, плитка, смесители и зоны повышенной гигиены.'],
  ['Окна и стеклянные поверхности', 'По сезону или в рамках расширенного обслуживания для ощущения света и свежести.'],
  ['Дополнительные задачи', 'Смена белья, подготовка к гостям, уход за отдельными зонами, порядок после поездки или мероприятия.']
];

const trust = [
  ['Пунктуальность', 'Приезжаем в согласованное время и заранее подтверждаем визит.'],
  ['Деликатность', 'Бережно относимся к личному пространству, вещам и привычному порядку.'],
  ['Аккуратность в деталях', 'Следим за поверхностями, зеркалами, сантехникой, углами и визуальным ощущением порядка.'],
  ['Безопасность', 'Работаем с проверенными сотрудниками и понятными правилами доступа в дом.'],
  ['Контроль качества', 'Фиксируем стандарты и поддерживаем стабильный уровень сервиса.'],
  ['Персональный подход', 'Учитываем материалы, планировку, график семьи и зоны повышенного внимания.']
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState('Заявка отправляется на backend API.');

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

      if (!response.ok) {
        throw new Error('Request failed');
      }

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
          <span className="logo-text">Эталон</span>
        </a>

        <nav className={`main-nav ${menuOpen ? 'open' : ''}`}>
          <a href="#service">О сервисе</a>
          <a href="#formats">Форматы ухода</a>
          <a href="#process">Как работаем</a>
          <a href="#trust">Доверие</a>
          <a href="#faq">Вопросы</a>
        </nav>

        <a className="header-cta" href="#quiz">Подобрать сервис</a>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Открыть меню">☰</button>
      </header>

      <main id="top">
        <section className="hero section">
          <div className="hero-content">
            <p className="eyebrow">Премиальный клининг • Новосибирск</p>
            <h1>Ваш дом всегда чистый — без вашего участия</h1>
            <p className="lead">
              Постоянный сервис ухода за домом для занятых женщин. Мы не делаем разовые уборки —
              мы берём дом на регулярное обслуживание и поддерживаем идеальную чистоту, порядок и свежесть.
            </p>

            <div className="hero-actions">
              <a className="btn primary" href="#quiz">Подобрать формат ухода</a>
              <a className="btn secondary" href="#service">Узнать, как работает сервис</a>
            </div>

            <div className="hero-points">
              <span>Постоянный уход</span>
              <span>Бережно к интерьеру</span>
              <span>Контроль качества</span>
              <span>Персональный формат</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Светлый ухоженный интерьер">
            <div className="visual-card large">
              <span>светлый интерьер</span>
            </div>
            <div className="visual-card small top">
              <span>детали чистоты</span>
            </div>
            <div className="visual-card small bottom">
              <span>сервис без контроля</span>
            </div>
          </div>
        </section>

        <section className="section intro" id="service">
          <div className="section-heading">
            <p className="eyebrow">Позиционирование</p>
            <h2>Мы берём не разовый заказ на уборку, а дом на постоянный сервис</h2>
          </div>
          <p className="wide-text">
            Эталон — премиальный сервис постоянного ухода за домом в Новосибирске для девушек и женщин,
            которые ценят чистоту, комфорт, время и спокойствие. Мы изучаем пространство, учитываем материалы,
            привычки семьи, зоны внимания и поддерживаем чистоту системно.
          </p>
        </section>

        <section className="section audience">
          <div className="section-heading">
            <p className="eyebrow">Для кого</p>
            <h2>Для тех, кто хочет жить в чистом доме, а не управлять уборкой</h2>
          </div>

          <div className="cards four">
            {audience.map(([title, text]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section compare">
          <div className="section-heading">
            <p className="eyebrow">Почему не разово</p>
            <h2>Разовая уборка решает задачу на день. Постоянный уход меняет ощущение дома</h2>
          </div>

          <div className="compare-grid">
            <div className="compare-box muted">
              <h3>Разовая уборка</h3>
              <ul>
                <li>каждый раз новый контекст;</li>
                <li>задачи нужно объяснять заново;</li>
                <li>качество зависит от случайной команды;</li>
                <li>чистота быстро уходит;</li>
                <li>клиент снова возвращается к быту.</li>
              </ul>
            </div>

            <div className="compare-box accent">
              <h3>Постоянный сервис</h3>
              <ul>
                <li>команда знает дом;</li>
                <li>есть понятный регламент;</li>
                <li>учитываются материалы и привычки семьи;</li>
                <li>качество стабильнее;</li>
                <li>дома всегда чисто без управления процессом.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section services">
          <div className="section-heading">
            <p className="eyebrow">Что входит</p>
            <h2>Заботимся о доме системно — от видимой чистоты до деталей</h2>
          </div>

          <div className="cards three">
            {services.map(([title, text]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section formats" id="formats">
          <div className="section-heading">
            <p className="eyebrow">Форматы</p>
            <h2>Подберём формат ухода под ваш дом и ритм жизни</h2>
          </div>

          <div className="pricing-grid">
            <article className="format-card">
              <span className="format-label">01</span>
              <h3>Регулярный уход</h3>
              <p>Для квартир и домов, где нужно стабильно поддерживать чистоту 1 раз в неделю.</p>
              <p className="best-for">Подходит, если хочется убрать бытовую нагрузку и не заниматься уборкой самостоятельно.</p>
            </article>

            <article className="format-card featured">
              <span className="format-label">02</span>
              <h3>Расширенный уход</h3>
              <p>Для больших квартир, домов, семей с детьми, животными или высокой бытовой нагрузкой.</p>
              <p className="best-for">Подходит, если нужен внимательный сервис с дополнительными зонами и задачами.</p>
            </article>

            <article className="format-card">
              <span className="format-label">03</span>
              <h3>Персональный сервис</h3>
              <p>Индивидуальный формат для клиентов, которым важно, чтобы дом всегда был в идеальном состоянии.</p>
              <p className="best-for">Для дорогих интерьеров, насыщенного графика, частых гостей и высоких требований к деталям.</p>
            </article>
          </div>

          <div className="center">
            <a className="btn primary" href="#quiz">Получить консультацию и подобрать формат</a>
          </div>
        </section>

        <section className="section value">
          <div className="value-card">
            <div>
              <p className="eyebrow">Ценность</p>
              <h2>Вы платите не за часы уборки. Вы платите за спокойствие, сервис и стабильный результат</h2>
            </div>

            <div>
              <p>
                Обычный клининг часто оценивают по количеству часов. Мы смотрим шире: важны площадь,
                материалы, образ жизни, частота обслуживания, зоны внимания, требования к качеству и уровень ответственности.
              </p>

              <ul className="check-list">
                <li>индивидуальный регламент;</li>
                <li>бережное отношение к материалам;</li>
                <li>профессиональные средства;</li>
                <li>стабильная команда;</li>
                <li>контроль качества;</li>
                <li>спокойная коммуникация.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section process" id="process">
          <div className="section-heading">
            <p className="eyebrow">Как начинается работа</p>
            <h2>Сначала мы знакомимся с домом, потом предлагаем формат обслуживания</h2>
          </div>

          <div className="steps">
            {['Заявка', 'Консультация', 'Расчёт', 'Знакомство', 'Первый визит', 'Регулярный уход'].map((title, index) => (
              <div className="step" key={title}>
                <span>{index + 1}</span>
                <h3>{title}</h3>
                <p>
                  {[
                    'Клиент оставляет заявку на сайте или пишет в мессенджер.',
                    'Уточняем площадь, задачи, частоту уборки и особенности пространства.',
                    'Ориентируем по формату и стоимости регулярного обслуживания.',
                    'Фиксируем зоны внимания, материалы, график и индивидуальные требования.',
                    'Проводим первую уборку, смотрим особенности дома и донастраиваем процесс.',
                    'Дом находится на постоянном сервисе, чистота поддерживается системно.'
                  ][index]}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="section trust" id="trust">
          <div className="section-heading">
            <p className="eyebrow">Доверие</p>
            <h2>Сервис, которому можно доверить дом</h2>
          </div>

          <div className="cards three">
            {trust.map(([title, text]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section people">
          <div className="people-grid">
            <div>
              <p className="eyebrow">Люди</p>
              <h2>В ваш дом приходят люди, которым можно доверять</h2>
              <p>
                Дом — это личное пространство. Поэтому важны не только профессиональные навыки сотрудников,
                но и аккуратность, тактичность, внимательность и умение работать спокойно, бережно и незаметно.
              </p>
            </div>

            <div className="photo-grid">
              <div className="photo-placeholder">форма</div>
              <div className="photo-placeholder">процесс</div>
              <div className="photo-placeholder">детали</div>
              <div className="photo-placeholder">интерьер</div>
            </div>
          </div>
        </section>

        <section className="section gallery">
          <div className="section-heading">
            <p className="eyebrow">Результат</p>
            <h2>Чистота видна в деталях</h2>
          </div>

          <div className="gallery-row">
            <div className="gallery-item">чистая столешница</div>
            <div className="gallery-item">блеск смесителя</div>
            <div className="gallery-item">стекло без разводов</div>
            <div className="gallery-item">ухоженная спальня</div>
          </div>

          <p className="caption">
            Хорошая уборка ощущается спокойно: поверхности чистые, вещи на местах,
            воздух свежее, а дом выглядит ухоженным.
          </p>
        </section>

        <section className="section reviews">
          <div className="section-heading">
            <p className="eyebrow">Отзывы</p>
            <h2>Клиенты доверяют нам не уборку, а свой дом</h2>
          </div>

          <div className="reviews-grid">
            <blockquote>
              <p>«Раньше я откладывала уборку на выходные и всё равно чувствовала, что дома не идеально. Сейчас команда приезжает регулярно, и я просто возвращаюсь в чистый дом».</p>
              <cite>Анна, квартира 92 м²</cite>
            </blockquote>

            <blockquote>
              <p>«Очень ценно, что не нужно ничего контролировать. Приехали, всё сделали спокойно, аккуратно, с вниманием к деталям. Дом стал ощущаться ухоженным».</p>
              <cite>Мария, дом 180 м²</cite>
            </blockquote>
          </div>
        </section>

        <section className="section faq" id="faq">
          <div className="section-heading">
            <p className="eyebrow">FAQ</p>
            <h2>Важные вопросы перед началом обслуживания</h2>
          </div>

          <div className="faq-list">
            <details open>
              <summary>Вы делаете разовые уборки?</summary>
              <p>Нет. Мы работаем только с домами на постоянном обслуживании. Такой формат позволяет знать особенности пространства и поддерживать стабильное качество.</p>
            </details>

            <details>
              <summary>Как часто можно приглашать команду?</summary>
              <p>Формат подбирается индивидуально: 1–2 раза в неделю, несколько раз в месяц или по персональному графику.</p>
            </details>

            <details>
              <summary>Можно ли доверить вам дом без личного присутствия?</summary>
              <p>Да, формат доступа обсуждается индивидуально. Мы понимаем уровень ответственности и выстраиваем работу так, чтобы клиенту было спокойно.</p>
            </details>

            <details>
              <summary>Сколько стоит обслуживание?</summary>
              <p>Стоимость зависит от площади, частоты, состава работ, состояния дома и индивидуальных задач. После консультации мы предложим подходящий формат.</p>
            </details>
          </div>
        </section>

        <section className="section quiz" id="quiz">
          <div className="quiz-card">
            <div className="quiz-copy">
              <p className="eyebrow">Расчёт</p>
              <h2>Подберите формат ухода за домом за 1 минуту</h2>
              <p>Ответьте на несколько вопросов — мы предложим формат постоянного обслуживания под ваш дом, график и требования к чистоте.</p>
            </div>

            <form className="quiz-form" onSubmit={handleSubmit}>
              <label>
                Что нужно обслуживать?
                <select name="object" required>
                  <option value="">Выберите вариант</option>
                  <option>Квартира</option>
                  <option>Дом</option>
                  <option>Апартаменты</option>
                </select>
              </label>

              <label>
                Площадь пространства
                <select name="area" required>
                  <option value="">Выберите площадь</option>
                  <option>До 60 м²</option>
                  <option>60–100 м²</option>
                  <option>100–200 м²</option>
                  <option>Более 200 м²</option>
                </select>
              </label>

              <label>
                Как часто нужен уход?
                <select name="frequency" required>
                  <option value="">Выберите частоту</option>
                  <option>1 раз в неделю</option>
                  <option>2 раза в неделю</option>
                  <option>Несколько раз в месяц</option>
                  <option>Хочу обсудить</option>
                </select>
              </label>

              <label>
                Что особенно важно?
                <textarea name="details" rows="3" placeholder="Кухня, санузлы, пыль, порядок, дети, животные, дорогие материалы..." />
              </label>

              <label>
                Телефон или мессенджер
                <input type="text" name="contact" placeholder="+7..." required />
              </label>

              <button className="btn primary full" type="submit">Получить расчёт обслуживания</button>
              <p className="form-note">{status}</p>
            </form>
          </div>
        </section>

        <section className="section final">
          <h2>Пусть дом остаётся чистым без вашего участия</h2>
          <p>Вы можете жить, работать, отдыхать, встречаться с близкими и заниматься собой. А заботу о чистоте, порядке и свежести дома мы возьмём на себя.</p>
          <a className="btn primary" href="#quiz">Обсудить постоянный уход за домом</a>
          <span>Работаем в Новосибирске. Берём дома и квартиры на регулярное обслуживание.</span>
        </section>
      </main>

      <footer className="footer">
        <div>
          <strong>Эталон</strong>
          <p>Премиальный сервис постоянного ухода за домом.</p>
        </div>

        <div className="footer-links">
          <a href="tel:+70000000000">+7 000 000-00-00</a>
          <a href="https://wa.me/70000000000">WhatsApp</a>
          <a href="https://t.me/">Telegram</a>
        </div>
      </footer>
    </>
  );
}
