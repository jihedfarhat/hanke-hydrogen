'use client';
import {useState, useRef, useCallback, useEffect} from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from 'framer-motion';
import {NavLink} from '@remix-run/react';

import {Link} from '~/components/Link';

// ─── Mega Menu CSS ────────────────────────────────────────────────────────────
const MEGA_STYLES = `
  .mm-panel {
    position: fixed;
    left: 0; right: 0;
    background: #FAFAF8;
    border-bottom: 1px solid rgba(17,16,16,0.07);
    z-index: 49;
    overflow: hidden;
    box-shadow: 0 24px 80px -12px rgba(0,0,0,0.12), 0 4px 0 0 rgba(0,0,0,0.03);
  }

  .mm-inner {
    max-width: 1440px;
    margin: 0 auto;
    padding: 0 clamp(20px, 4vw, 56px);
    display: grid;
    grid-template-columns: 280px 1fr;
    height: 100%;
    gap: 0;
  }

  .mm-tabs {
    padding: 40px 0 40px 0;
    border-right: 1px solid rgba(17,16,16,0.06);
    display: flex;
    flex-direction: column;
    gap: 2px;
    position: relative;
  }

  .mm-tab-btn {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 0;
    cursor: pointer;
    position: relative;
    text-decoration: none;
    border: none;
    background: none;
    text-align: left;
    width: 100%;
  }

  .mm-tab-num {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.08em;
    color: rgba(17,16,16,0.25);
    transition: color 0.2s;
    min-width: 20px;
  }

  .mm-tab-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(18px, 2vw, 26px);
    font-weight: 300;
    letter-spacing: 0.02em;
    color: rgba(17,16,16,0.35);
    transition: color 0.3s cubic-bezier(0.16,1,0.3,1), letter-spacing 0.3s;
    line-height: 1.1;
  }

  .mm-tab-arrow {
    margin-left: auto;
    color: rgba(17,16,16,0.15);
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), color 0.2s;
    opacity: 0;
  }

  .mm-tab-btn:hover .mm-tab-title,
  .mm-tab-btn.active .mm-tab-title {
    color: #111010;
    letter-spacing: 0.04em;
  }

  .mm-tab-btn:hover .mm-tab-num,
  .mm-tab-btn.active .mm-tab-num {
    color: #b8924a;
  }

  .mm-tab-btn:hover .mm-tab-arrow,
  .mm-tab-btn.active .mm-tab-arrow {
    opacity: 1;
    transform: translateX(4px);
    color: #111010;
  }

  .mm-content {
    padding: 40px 0 40px 56px;
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 40px;
    align-items: start;
    overflow: hidden;
  }

  .mm-links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 6px 24px;
    align-content: start;
  }

  .mm-link {
    font-family: 'Syne', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(17,16,16,0.55);
    padding: 10px 0;
    border-bottom: 1px solid rgba(17,16,16,0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: color 0.15s, border-color 0.15s;
    text-decoration: none;
  }

  .mm-link:hover {
    color: #111010;
    border-color: rgba(17,16,16,0.2);
  }

  .mm-link:hover .mm-link-arrow { transform: translateX(4px); }

  .mm-link-arrow {
    transition: transform 0.2s cubic-bezier(0.16,1,0.3,1);
    opacity: 0.3;
  }

  .mm-featured {
    position: relative;
    border-radius: 2px;
    overflow: hidden;
    aspect-ratio: 3/4;
    max-height: 320px;
  }

  .mm-featured-img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.8s cubic-bezier(0.16,1,0.3,1);
  }

  .mm-featured:hover .mm-featured-img { transform: scale(1.03); }

  .mm-featured-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 20px;
  }

  .mm-featured-tag {
    font-family: 'Syne', system-ui, sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #b8924a;
    margin-bottom: 6px;
  }

  .mm-featured-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 20px;
    font-weight: 400;
    color: #fff;
    line-height: 1.2;
    letter-spacing: 0.02em;
  }

  .mm-bg-num {
    position: absolute;
    top: 20px; right: 0;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(80px, 12vw, 160px);
    font-weight: 300;
    color: rgba(17,16,16,0.04);
    line-height: 1;
    pointer-events: none;
    user-select: none;
    letter-spacing: -0.05em;
  }

  .mm-section-label {
    font-family: 'Syne', system-ui, sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(17,16,16,0.3);
    margin-bottom: 16px;
  }

  .mm-view-all {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-family: 'Syne', system-ui, sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #111010;
    text-decoration: none;
    margin-top: 20px;
    padding-bottom: 2px;
    border-bottom: 1px solid #111010;
    transition: gap 0.2s, opacity 0.2s;
  }
  .mm-view-all:hover { gap: 16px; opacity: 0.7; }
`;

// ─── Inject styles once ───────────────────────────────────────────────────────
function useMegaStyles() {
  useEffect(() => {
    if (document.getElementById('mm-styles')) return;
    const tag = document.createElement('style');
    tag.id = 'mm-styles';
    tag.textContent = MEGA_STYLES;
    document.head.appendChild(tag);
  }, []);
}

// ─── Tab Indicator (animated vertical pill) ───────────────────────────────────
function TabIndicator({activeIndex, tabRefs}) {
  const [indicatorStyle, setIndicatorStyle] = useState({top: 0, height: 0});

  useEffect(() => {
    const el = tabRefs.current[activeIndex];
    if (!el) return;
    const parent = el.offsetParent;
    setIndicatorStyle({
      top: el.offsetTop + (parent?.offsetTop || 0),
      height: el.offsetHeight,
    });
  }, [activeIndex, tabRefs]);

  return (
    <motion.div
      animate={indicatorStyle}
      transition={{type: 'spring', stiffness: 300, damping: 30}}
      style={{
        position: 'absolute',
        left: -1,
        width: 2,
        background: '#111010',
        borderRadius: 2,
      }}
    />
  );
}

// ─── Mega Menu Panel ──────────────────────────────────────────────────────────
export function MegaMenuPanel({item, headerHeight = 70, onClose}) {
  useMegaStyles();
  const [activeTab, setActiveTab] = useState(0);
  const tabRefs = useRef([]);
  const children = item?.items || [];

  // Generate unique decorative colors per item
  const palettes = [
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(135deg, #2d1b00 0%, #4a2c00 50%, #6b3f00 100%)',
    'linear-gradient(135deg, #0d1f0d 0%, #1a3a1a 50%, #2d5a2d 100%)',
    'linear-gradient(135deg, #1f0d1f 0%, #3a1a3a 50%, #5a2d5a 100%)',
    'linear-gradient(135deg, #1f1a0d 0%, #3a321a 50%, #5a4d2d 100%)',
  ];

  const activeChild = children[activeTab];
  const subItems = activeChild?.items || [];

  return (
    <motion.div
      className="mm-panel"
      initial={{y: -8, opacity: 0}}
      animate={{y: 0, opacity: 1}}
      exit={{y: -8, opacity: 0}}
      transition={{duration: 0.3, ease: [0.16, 1, 0.3, 1]}}
      style={{top: headerHeight}}
    >
      <div className="mm-inner" style={{height: 420}}>
        {/* ── LEFT: Vertical Tabs ── */}
        <div className="mm-tabs">
          <TabIndicator activeIndex={activeTab} tabRefs={tabRefs} />

          {/* Section label */}
          <p className="mm-section-label" style={{marginBottom: 20}}>
            {item.title}
          </p>

          {children.map((child, i) => (
            <button
              key={child.id}
              ref={(el) => (tabRefs.current[i] = el)}
              className={`mm-tab-btn ${activeTab === i ? 'active' : ''}`}
              onMouseEnter={() => setActiveTab(i)}
              onClick={onClose}
            >
              <span className="mm-tab-num">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="mm-tab-title">{child.title}</span>
              <span className="mm-tab-arrow">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </button>
          ))}
        </div>

        {/* ── RIGHT: Tab Content ── */}
        <div className="mm-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{opacity: 0, x: 16}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: -16}}
              transition={{duration: 0.22, ease: [0.16, 1, 0.3, 1]}}
              style={{position: 'relative'}}
            >
              {/* Decorative background number */}
              <span className="mm-bg-num">
                {String(activeTab + 1).padStart(2, '0')}
              </span>

              <p className="mm-section-label">{activeChild?.title}</p>

              {subItems.length > 0 ? (
                <div className="mm-links-grid">
                  {subItems.map((sub, j) => (
                    <motion.div
                      key={sub.id}
                      initial={{opacity: 0, y: 8}}
                      animate={{opacity: 1, y: 0}}
                      transition={{delay: j * 0.04, duration: 0.2}}
                    >
                      <Link
                        to={sub.to}
                        target={sub.target}
                        prefetch="intent"
                        className="mm-link"
                        onClick={onClose}
                      >
                        <span>{sub.title}</span>
                        <span className="mm-link-arrow">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          >
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                /* If no sub-items, show the child as a featured link */
                <div style={{paddingTop: 8}}>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: 'clamp(28px, 4vw, 48px)',
                      fontWeight: 300,
                      color: 'rgba(17,16,16,0.12)',
                      letterSpacing: '0.02em',
                      lineHeight: 1.1,
                      marginBottom: 24,
                    }}
                  >
                    {activeChild?.title}
                  </p>
                </div>
              )}

              <Link
                to={activeChild?.to || '#'}
                className="mm-view-all"
                onClick={onClose}
              >
                <span>Explore {activeChild?.title}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* ── Featured Card ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`card-${activeTab}`}
              initial={{opacity: 0, scale: 0.97}}
              animate={{opacity: 1, scale: 1}}
              exit={{opacity: 0, scale: 0.97}}
              transition={{duration: 0.3, ease: [0.16, 1, 0.3, 1]}}
              className="mm-featured"
            >
              {/* Gradient placeholder (replace with real image) */}
              <div
                className="mm-featured-img"
                style={{background: palettes[activeTab % palettes.length]}}
              />
              <div className="mm-featured-overlay">
                <p className="mm-featured-tag">Featured</p>
                <p className="mm-featured-title">{activeChild?.title}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom accent line (animated) */}
      <motion.div
        initial={{scaleX: 0}}
        animate={{scaleX: 1}}
        transition={{duration: 0.6, ease: [0.16, 1, 0.3, 1]}}
        style={{
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(184,146,74,0.4), transparent)',
          transformOrigin: 'left',
        }}
      />
    </motion.div>
  );
}

// ─── Simple Dropdown Panel ────────────────────────────────────────────────────
export function SimpleDropdownPanel({item, onClose}) {
  const children = item?.items || [];

  return (
    <motion.div
      initial={{opacity: 0, y: 8, scaleY: 0.96}}
      animate={{opacity: 1, y: 0, scaleY: 1}}
      exit={{opacity: 0, y: 8, scaleY: 0.96}}
      transition={{duration: 0.2, ease: [0.16, 1, 0.3, 1]}}
      style={{
        position: 'absolute',
        top: 'calc(100% + 16px)',
        left: '50%',
        transform: 'translateX(-50%)',
        transformOrigin: 'top center',
        zIndex: 60,
        background: '#fff',
        border: '1px solid rgba(17,16,16,0.08)',
        borderRadius: 2,
        padding: '8px 0',
        minWidth: 220,
        boxShadow:
          '0 4px 6px -1px rgba(0,0,0,0.04), 0 16px 48px -8px rgba(0,0,0,0.12)',
      }}
    >
      {/* Tiny caret */}
      <div
        style={{
          position: 'absolute',
          top: -5,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: 9,
          height: 9,
          background: '#fff',
          border: '1px solid rgba(17,16,16,0.08)',
          borderRight: 'none',
          borderBottom: 'none',
        }}
      />

      {children.map((child, i) => (
        <motion.div
          key={child.id}
          initial={{opacity: 0, x: -8}}
          animate={{opacity: 1, x: 0}}
          transition={{delay: i * 0.04, duration: 0.18}}
        >
          <Link
            to={child.to}
            target={child.target}
            prefetch="intent"
            className="mm-link"
            onClick={onClose}
            style={{
              margin: '0 8px',
              borderRadius: 2,
              padding: '11px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{child.title}</span>
            <span
              className="mm-link-arrow"
              style={{opacity: 0.3, transition: 'transform 0.2s'}}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </span>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Nav Item Wrapper (decides which menu to show) ────────────────────────────
export function SmartNavItem({item, isTransparent, headerHeight}) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  const hasChildren = item.items?.length > 0;
  const isMega =
    item.items?.length >= 3 || item.items?.some((c) => c.items?.length > 0);

  const enter = useCallback(() => {
    clearTimeout(timerRef.current);
    setOpen(true);
  }, []);

  const leave = useCallback(() => {
    timerRef.current = setTimeout(() => setOpen(false), 180);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Magnetic spring
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, {stiffness: 180, damping: 18});
  const sy = useSpring(my, {stiffness: 180, damping: 18});

  const onMouseMove = (e) => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.22);
    my.set((e.clientY - (r.top + r.height / 2)) * 0.22);
  };
  const onMouseLeave2 = () => {
    mx.set(0);
    my.set(0);
  };

  const textColor = isTransparent ? 'rgba(255,255,255,0.80)' : undefined;

  return (
    <div
      style={{position: 'relative'}}
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <motion.div
        ref={wrapRef}
        style={{x: sx, y: sy}}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave2}
      >
        <NavLink
          to={item.to}
          target={item.target}
          prefetch="intent"
          className={({isActive}) => `hdr-nav-link ${isActive ? 'active' : ''}`}
          style={{color: textColor}}
        >
          <span>{item.title}</span>
          {hasChildren && (
            <motion.span
              animate={{rotate: open ? 180 : 0}}
              transition={{duration: 0.25}}
              style={{display: 'flex', opacity: 0.45, marginLeft: 2}}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </motion.span>
          )}
        </NavLink>
      </motion.div>

      <AnimatePresence>
        {hasChildren &&
          open &&
          (isMega ? (
            <MegaMenuPanel
              item={item}
              headerHeight={headerHeight}
              onClose={() => setOpen(false)}
            />
          ) : (
            <SimpleDropdownPanel item={item} onClose={() => setOpen(false)} />
          ))}
      </AnimatePresence>
    </div>
  );
}
