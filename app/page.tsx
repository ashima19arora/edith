import Image from "next/image";
import Link from "next/link";
import { SpiderIcon } from "@/components/art";
import { HeroSkyline, UpsideDownCity } from "@/components/landing-city";
import { LandingEffects } from "@/components/landing-effects";
import { LANDING as T } from "@/lib/landing";
import "./landing.css";

function Sticker({ children }: { children: string }) {
  return <p className="lp-sticker">{children}</p>;
}

function Heading({ parts }: { parts: string[] }) {
  return (
    <h2 className="lp-h2">
      {parts[0]}
      <span>{parts[1]}</span>
    </h2>
  );
}

function Phone({ src, alt, sizes, priority = false }: { src: string; alt: string; sizes: string; priority?: boolean }) {
  return (
    <div className="lp-phone">
      <Image src={`/landing/${src}.jpg`} alt={alt} width={420} height={910} sizes={sizes} priority={priority} />
    </div>
  );
}

function GithubIcon() {
  return <span className="lp-github-icon" aria-hidden="true" />;
}

function TagIcon({ index }: { index: number }) {
  const paths = [
    "M3 8h11a3 3 0 10-3-3M3 13h16a3 3 0 11-3 3M3 18h8",
    "M12 3s7 7.5 7 12a7 7 0 01-14 0c0-4.5 7-12 7-12z",
    "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  ];
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FDE24D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[index]} />
    </svg>
  );
}

const NEXT_ICONS = [
  "M5 12a7 7 0 0114 0M8.5 12a3.5 3.5 0 017 0M12 12v8M8 20h8",
  "M9 3v5M15 3v5M6 8h12v4a6 6 0 01-12 0zM12 18v3",
  "M9 3h6v10a3 3 0 01-6 0zM5 11a7 7 0 0014 0M12 18v3",
  "M6 16V10a6 6 0 0112 0v6l2 2H4zM10 21h4",
  "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
];

export default function Landing() {
  return (
    <div className="lp">
      <LandingEffects />

      <header className="lp-header">
        <div className="lp-header-inner">
          <a href="#top" className="lp-brand">
            <Image src="/brand/edith-icon.png" alt="" width={40} height={40} />
            <span>{T.name}</span>
          </a>
          <nav className="lp-nav" aria-label="Page sections">
            {T.nav.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <a href={T.githubHref} target="_blank" rel="noopener noreferrer" className="lp-github-square" aria-label={T.github}>
            <GithubIcon />
          </a>
          <Link href={T.appHref} className="lp-btn lp-btn-yellow lp-header-btn">{T.tryIt}</Link>
        </div>
      </header>

      <main id="top">
        <section className="lp-hero">
          <UpsideDownCity />
          <div className="lp-spider" aria-hidden="true">
            <div className="lp-spider-bob">
              <span />
              <SpiderIcon />
            </div>
          </div>
          <div className="lp-hero-inner">
            <div className="lp-hero-text">
              <Sticker>{T.hero.sticker}</Sticker>
              <h1>{T.hero.title[0]}<span>{T.hero.title[1]}</span></h1>
              <p className="lp-hero-sub">{T.hero.sub}</p>
              <p className="lp-hero-intro">{T.hero.intro[0]}<b>{T.hero.intro[1]}</b>{T.hero.intro[2]}</p>
              <ul className="lp-tags">
                {T.hero.tags.map((tag, i) => <li key={tag}><TagIcon index={i} />{tag}</li>)}
              </ul>
              <div className="lp-actions">
                <Link href={T.appHref} className="lp-btn lp-btn-yellow">{T.tryIt}</Link>
                <a href={T.githubHref} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-white"><GithubIcon />{T.github}</a>
              </div>
              <p className="lp-free">{T.hero.free}</p>
            </div>
            <div className="lp-hero-phones">
              <div className="lp-hp lp-hp-left"><Phone src="feature-home-hero" alt="EDITH Home in Hero mode" sizes="250px" priority /></div>
              <div className="lp-hp lp-hp-right"><Phone src="feature-home-plain" alt="EDITH Home in Plain mode" sizes="250px" priority /></div>
              <div className="lp-hp lp-hp-mid"><Phone src="feature-style" alt="Choosing Hero or Plain style" sizes="300px" priority /></div>
            </div>
          </div>
          <HeroSkyline />
        </section>

        <section className="lp-section lp-stats-section">
          <div className="lp-stats">
            {T.stats.map((stat, i) => (
              <article key={stat.source + i} className={`lp-box lp-stat tone-${stat.tone}`} data-reveal="up" style={{ transitionDelay: `${i * 0.1}s` }}>
                <p className="lp-stat-number">
                  {stat.prefix}<span data-count={stat.count}>{stat.count}</span><b>{stat.unit}</b>
                </p>
                <p className="lp-stat-text">{stat.text}</p>
                <p className="lp-stat-source">{stat.source}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="problem" className="lp-section">
          <div data-reveal="up">
            <Sticker>{T.problem.sticker}</Sticker>
            <Heading parts={T.problem.title} />
            <p className="lp-problem-lead">{T.problem.lead[0]}<span>{T.problem.lead[1]}</span></p>
          </div>
          <ol className="lp-points">
            {T.problem.points.map(([title, text], i) => (
              <li key={title} data-reveal="up" style={{ transitionDelay: `${i * 0.08}s` }}>
                <span className="lp-point-number">{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="tracks" className="lp-section">
          <div data-reveal="up">
            <Sticker>{T.tracks.sticker}</Sticker>
            <Heading parts={T.tracks.title} />
            <p className="lp-lead">{T.tracks.lead}</p>
          </div>
          <div className="lp-damage">
            <article className="lp-box lp-damage-card tone-red" data-reveal="left">
              <h3>{T.tracks.taken.title}</h3>
              <ul>{T.tracks.taken.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
            <div className="lp-arrows" aria-hidden="true">
              <svg viewBox="0 0 150 46"><path d="M3 15H110V3L147 23L110 43V31H3Z" fill="#FDE24D" stroke="#080611" strokeWidth="4" strokeLinejoin="round" /></svg>
              <svg viewBox="0 0 150 46"><path d="M147 15H40V3L3 23L40 43V31H147Z" fill="#FDE24D" stroke="#080611" strokeWidth="4" strokeLinejoin="round" /></svg>
            </div>
            <article className="lp-box lp-damage-card tone-blue" data-reveal="right">
              <h3>{T.tracks.dealt.title}</h3>
              <ul>{T.tracks.dealt.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          </div>
        </section>

        <section id="features" className="lp-section">
          <div data-reveal="up">
            <Sticker>{T.features.sticker}</Sticker>
            <Heading parts={T.features.title} />
            <p className="lp-lead">{T.features.lead}</p>
          </div>

          <div className="lp-styles">
            <div className="lp-styles-phones" data-reveal="up">
              <Phone src="feature-home-hero" alt="Home in Hero mode" sizes="240px" />
              <Phone src="feature-home-plain" alt="Home in Plain mode" sizes="240px" />
            </div>
            <div data-reveal="up">
              <h3 className="lp-h3">{T.features.styles.title[0]}<span>{T.features.styles.title[1]}</span></h3>
              <p className="lp-lead">{T.features.styles.text}</p>
              <p className="lp-mode-stickers">
                <span className="yellow">{T.features.styles.hero}</span>
                <span className="white">{T.features.styles.plain}</span>
              </p>
            </div>
          </div>

          <div className="lp-grid">
            {T.features.grid.map(([src, alt, title, text], i) => (
              <article key={title} data-reveal="up" style={{ transitionDelay: `${(i % 3) * 0.1}s` }}>
                <Phone src={src} alt={alt} sizes="220px" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>

          <div className="lp-india">
            <div data-reveal="up">
              <h3 className="lp-h3">{T.features.india.title[0]}<span>{T.features.india.title[1]}</span></h3>
              <p className="lp-lead">{T.features.india.text}</p>
              <ul className="lp-chips">{T.features.india.chips.map((chip) => <li key={chip}>{chip}</li>)}</ul>
            </div>
            <div className="lp-india-phone" data-reveal="up">
              <Phone src="feature-diwali" alt="The Diwali air guide" sizes="250px" />
            </div>
          </div>
        </section>

        <section id="numbers" className="lp-section">
          <div data-reveal="up">
            <Sticker>{T.numbers.sticker}</Sticker>
            <Heading parts={T.numbers.title} />
          </div>
          <div className="lp-equation" data-reveal="up">
            <span>{T.numbers.equation[0]}</span>
            <b aria-hidden="true">×</b>
            <span>{T.numbers.equation[1]}</span>
            <b aria-hidden="true">=</b>
            <span className="last">{T.numbers.equation[2]}</span>
          </div>
          <div className="lp-facts">
            {T.numbers.cards.map((card, i) => (
              <article key={card.label} className={`lp-box lp-fact tone-${card.tone}`} data-reveal="up" style={{ transitionDelay: `${i * 0.08}s` }}>
                <p className="lp-fact-label">{card.label}</p>
                <p className="lp-fact-big">{card.big}</p>
                <p className="lp-fact-line">{card.line}</p>
                <p className="lp-fact-source">{card.source}</p>
              </article>
            ))}
          </div>
          <p className="lp-note">{T.numbers.note}</p>

          <div id="tech" className="lp-tech-block">
          <h3 className="lp-tech-title">{T.numbers.techTitle}</h3>
          <div className="lp-tech">
            {T.numbers.tech.map(([icon, colour, name, line], i) => (
              <article key={name} className="lp-box" data-reveal="up" style={{ transitionDelay: `${(i % 4) * 0.08}s` }}>
                <span
                  className="lp-tech-icon"
                  aria-hidden="true"
                  style={{ background: colour, maskImage: `url(/landing/tech/${icon}.svg)`, WebkitMaskImage: `url(/landing/tech/${icon}.svg)` }}
                />
                <h4>{name}</h4>
                <p>{line}</p>
              </article>
            ))}
          </div>
          </div>
        </section>

        <section id="next" className="lp-section">
          <div data-reveal="up">
            <Sticker>{T.next.sticker}</Sticker>
            <Heading parts={T.next.title} />
            <p className="lp-lead">{T.next.lead}</p>
          </div>
          <div className="lp-next">
            {T.next.cards.map((card, i) => (
              <article key={card.title} className={`lp-box lp-next-card next-${card.tone} ${i === 0 ? "lead" : ""}`} data-reveal="up" style={{ transitionDelay: `${(i % 3) * 0.1}s` }}>
                <div className="lp-next-top">
                  <span className="lp-next-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={NEXT_ICONS[i]} /></svg>
                  </span>
                  <span className="lp-next-kind">{card.kind}</span>
                  <span className="lp-next-number" aria-hidden="true">0{i + 1}</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <span className="lp-next-pill">{card.pill}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-closing">
          <div className="lp-quote" data-reveal="up">
            <h2>{T.closing.quote}</h2>
            <p>{T.closing.line}</p>
          </div>
          <Link href={T.appHref} className="lp-btn lp-btn-yellow">{T.tryIt}</Link>
          <p className="lp-note">{T.closing.note}</p>
          <div className="lp-sequence"><HeroSkyline sequence /></div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-left">
            <Image src="/brand/edith-icon.png" alt="" width={48} height={48} />
            <div>
              <p className="lp-footer-name">{T.name}</p>
              <p className="lp-footer-full">{T.fullName}</p>
              <p className="lp-footer-legal">
                <Link href="/privacy">{T.footer.privacy}</Link>
                <Link href="/terms">{T.footer.terms}</Link>
              </p>
            </div>
          </div>
          <div className="lp-footer-right">
            <a href={T.githubHref} target="_blank" rel="noopener noreferrer" className="lp-footer-github"><GithubIcon />{T.footer.githubLabel}</a>
            <p className="lp-footer-team">{T.footer.team}</p>
          </div>
        </div>
        <p className="lp-made">{T.footer.made[0]} <span aria-label="love">♥</span> {T.footer.made[1]}</p>
      </footer>
    </div>
  );
}
