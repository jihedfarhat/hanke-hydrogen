'use client';
import {useState, useEffect, useRef, Suspense} from 'react';
import {Form, useParams, Await, useRouteLoaderData} from '@remix-run/react';
import {CartForm} from '@shopify/hydrogen';
import {motion, AnimatePresence} from 'framer-motion';

import {Link} from '~/components/Link';
import {Cart} from '~/components/Cart';
import {CartLoading} from '~/components/CartLoading';
import {Drawer, useDrawer} from '~/components/Drawer';
import {useIsHomePath} from '~/lib/utils';
import {useIsHydrated} from '~/hooks/useIsHydrated';
import {useCartFetchers} from '~/hooks/useCartFetchers';
import {SmartNavItem} from '~/components/MegaMenu';

// ─── CSS injected once ────────────────────────────────────────────────────────
const HEADER_STYLES = `
  :root {
    --header-font-display: 'Cormorant Garamond', Georgia, serif;
    --header-font-sans: 'Syne', system-ui, sans-serif;
    --header-ink: #111010;
    --header-ink-muted: #6b6b6b;
    --header-gold: #b8924a;
    --header-bg: #FAFAF8;
    --header-line: rgba(17,16,16,0.08);
  }

  .hdr-logo {
    font-family: var(--header-font-display);
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: clamp(15px, 1.5vw, 19px);
    transition: letter-spacing 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  .hdr-logo:hover { letter-spacing: 0.18em; }

  .hdr-nav-link {
    font-family: var(--header-font-sans);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--header-ink-muted);
    position: relative;
    padding: 6px 0;
    transition: color 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    cursor: pointer;
  }
  .hdr-nav-link::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 100%; height: 1px;
    background: var(--header-ink);
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
  }
  .hdr-nav-link:hover,
  .hdr-nav-link.active {
    color: var(--header-ink);
  }
  .hdr-nav-link:hover::after,
  .hdr-nav-link.active::after {
    transform: scaleX(1);
    transform-origin: left;
  }

  .hdr-icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 38px; height: 38px;
    border-radius: 50%;
    color: var(--header-ink-muted);
    transition: color 0.2s, background 0.2s;
    cursor: pointer;
  }
  .hdr-icon-btn:hover { color: var(--header-ink); background: rgba(17,16,16,0.05); }

  .hdr-dropdown {
    font-family: var(--header-font-sans);
    background: #fff;
    border: 1px solid var(--header-line);
    border-radius: 2px;
    padding: 8px 0;
    min-width: 200px;
    box-shadow:
      0 4px 6px -1px rgba(0,0,0,0.04),
      0 12px 40px -8px rgba(0,0,0,0.12);
  }
  .hdr-dropdown-item {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--header-ink-muted);
    padding: 11px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: color 0.15s, background 0.15s;
  }
  .hdr-dropdown-item:hover { color: var(--header-ink); background: rgba(17,16,16,0.025); }

  .hdr-search-input {
    font-family: var(--header-font-display);
    font-size: clamp(22px, 4vw, 40px);
    font-weight: 300;
    letter-spacing: 0.02em;
    border: none; outline: none;
    background: transparent;
    color: #111;
    width: 100%;
  }
  .hdr-search-input::placeholder { color: rgba(17,16,16,0.25); }

  .hdr-mobile-link {
    font-family: var(--header-font-display);
    font-size: clamp(24px, 5vw, 36px);
    font-weight: 300;
    letter-spacing: 0.04em;
    color: var(--header-ink);
    display: block;
    padding: 10px 0;
    border-bottom: 1px solid var(--header-line);
    transition: letter-spacing 0.3s cubic-bezier(0.16,1,0.3,1), color 0.2s;
  }
  .hdr-mobile-link:hover { letter-spacing: 0.1em; color: var(--header-gold); }
`;

function useStyleInjection() {
  useEffect(() => {
    if (document.getElementById('hdr-styles')) return;
    const tag = document.createElement('style');
    tag.id = 'hdr-styles';
    tag.textContent = HEADER_STYLES;
    document.head.appendChild(tag);
  }, []);
}

// ─── Scroll state ─────────────────────────────────────────────────────────────
function useScrollState(stickyType) {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      if (stickyType === 'on-scroll-up')
        setVisible(y < lastY.current || y < 80);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, [stickyType]);

  return {scrolled, visible};
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function Header({title, menu, layout = 'left', stickyType = 'always'}) {
  useStyleInjection();
  const isHome = useIsHomePath();
  const {scrolled, visible} = useScrollState(stickyType);

  const {
    isOpen: isCartOpen,
    openDrawer: openCart,
    closeDrawer: closeCart,
  } = useDrawer();
  const {
    isOpen: isMenuOpen,
    openDrawer: openMenu,
    closeDrawer: closeMenu,
  } = useDrawer();
  const [searchOpen, setSearchOpen] = useState(false);

  const addToCartFetchers = useCartFetchers(CartForm.ACTIONS.LinesAdd);
  useEffect(() => {
    if (isCartOpen || !addToCartFetchers.length) return;
    openCart();
  }, [addToCartFetchers, isCartOpen, openCart]);

  // Close search on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isTransparent = isHome && !scrolled;

  return (
    <>
      {/* ── Overlays ── */}
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      <MobileMenuDrawer isOpen={isMenuOpen} onClose={closeMenu} menu={menu} />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ── Header shell ── */}
      <motion.header
        role="banner"
        animate={
          stickyType === 'on-scroll-up' ? {y: visible ? 0 : '-100%'} : {y: 0}
        }
        transition={{duration: 0.4, ease: [0.16, 1, 0.3, 1]}}
        style={{
          position: stickyType === 'none' ? 'relative' : 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          transition:
            'background 0.5s cubic-bezier(0.16,1,0.3,1), border-color 0.5s',
          background: isTransparent ? 'transparent' : 'rgba(250,250,248,0.96)',
          borderBottom: `1px solid ${
            isTransparent ? 'rgba(255,255,255,0.1)' : 'rgba(17,16,16,0.07)'
          }`,
          backdropFilter: isTransparent ? 'none' : 'blur(12px)',
        }}
      >
        {/* Gradient scrim for legibility over hero images */}
        {isTransparent && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
        )}

        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            padding: '0 clamp(20px, 4vw, 56px)',
            height: 'clamp(60px, 6vw, 76px)',
            display: 'grid',
            gridTemplateColumns:
              layout === 'center-split'
                ? '1fr auto 1fr'
                : layout === 'center'
                ? 'auto 1fr auto'
                : '1fr 1fr auto',
            alignItems: 'center',
            gap: 24,
            position: 'relative',
          }}
        >
          {/* ── LEFT: nav or logo ── */}
          {layout === 'center-split' ? (
            <nav style={{display: 'flex', alignItems: 'center', gap: 32}}>
              <DesktopNav
                items={(menu?.items || []).slice(
                  0,
                  Math.ceil((menu?.items?.length || 0) / 2),
                )}
                isTransparent={isTransparent}
                headerHeight={76}
              />
            </nav>
          ) : layout === 'center' ? (
            <div />
          ) : (
            <LogoMark title={title} isTransparent={isTransparent} />
          )}

          {/* ── CENTER: logo or nav ── */}
          {layout === 'center-split' ||
          layout === 'center' ||
          layout === 'center-left' ? (
            <LogoMark title={title} isTransparent={isTransparent} centered />
          ) : (
            <nav
              className="hidden lg:flex"
              style={{alignItems: 'center', gap: 32}}
            >
              <DesktopNav
                items={menu?.items || []}
                isTransparent={isTransparent}
                headerHeight={76}
              />
            </nav>
          )}

          {/* ── RIGHT: icons ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              justifyContent: 'flex-end',
            }}
          >
            {/* Right side nav for center-split */}
            {layout === 'center-split' && (
              <nav
                className="hidden lg:flex"
                style={{alignItems: 'center', gap: 32, marginRight: 24}}
              >
                <DesktopNav
                  items={(menu?.items || []).slice(
                    Math.ceil((menu?.items?.length || 0) / 2),
                  )}
                  isTransparent={isTransparent}
                />
              </nav>
            )}
            {/* Center nav for center layout */}
            {layout === 'center' && (
              <nav
                className="hidden lg:flex"
                style={{alignItems: 'center', gap: 32, marginRight: 24}}
              >
                <DesktopNav
                  items={menu?.items || []}
                  isTransparent={isTransparent}
                  headerHeight={76}
                />
              </nav>
            )}

            <button
              onClick={() => setSearchOpen(true)}
              className="hdr-icon-btn hidden lg:flex"
              aria-label="Search"
              style={{
                color: isTransparent ? 'rgba(255,255,255,0.85)' : undefined,
              }}
            >
              <SearchIcon />
            </button>

            <AccountButton isTransparent={isTransparent} />
            <CartButton isTransparent={isTransparent} openCart={openCart} />

            <button
              onClick={openMenu}
              className="hdr-icon-btn lg:hidden"
              aria-label="Menu"
              style={{
                color: isTransparent ? 'rgba(255,255,255,0.85)' : undefined,
              }}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </motion.header>
    </>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function LogoMark({title, isTransparent, centered}) {
  return (
    <Link
      to="/"
      prefetch="intent"
      className="hdr-logo"
      style={{
        color: isTransparent ? '#ffffff' : 'var(--header-ink)',
        justifySelf: centered ? 'center' : undefined,
        textDecoration: 'none',
      }}
    >
      {title}
    </Link>
  );
}

// ─── Desktop nav items ────────────────────────────────────────────────────────
function DesktopNav({items, isTransparent, headerHeight}) {
  return (
    <div className="hidden lg:flex" style={{alignItems: 'center', gap: 32}}>
      {items.map((item) => (
        <SmartNavItem
          key={item.id}
          item={item}
          isTransparent={isTransparent}
          headerHeight={headerHeight}
        />
      ))}
    </div>
  );
}

// ─── Account ──────────────────────────────────────────────────────────────────
function AccountButton({isTransparent}) {
  const rootData = useRouteLoaderData('root');
  return (
    <Link
      to="/account"
      className="hdr-icon-btn"
      aria-label="Account"
      style={{color: isTransparent ? 'rgba(255,255,255,0.85)' : undefined}}
    >
      <Suspense fallback={<PersonIcon />}>
        <Await resolve={rootData?.isLoggedIn} errorElement={<PersonIcon />}>
          {(loggedIn) => (loggedIn ? <PersonFilledIcon /> : <PersonIcon />)}
        </Await>
      </Suspense>
    </Link>
  );
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
function CartButton({isTransparent, openCart}) {
  const rootData = useRouteLoaderData('root');
  const isHydrated = useIsHydrated();

  const inner = (count) => (
    <span
      className="hdr-icon-btn"
      style={{
        position: 'relative',
        color: isTransparent ? 'rgba(255,255,255,0.85)' : undefined,
      }}
    >
      <BagIcon />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{scale: 0, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            exit={{scale: 0, opacity: 0}}
            transition={{type: 'spring', stiffness: 600, damping: 25}}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: isTransparent ? '#fff' : '#111',
              color: isTransparent ? '#111' : '#fff',
              fontSize: 9,
              fontFamily: 'var(--header-font-sans)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: 0,
            }}
          >
            {count > 9 ? '9+' : count}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );

  if (!rootData) return inner(0);

  return (
    <Suspense
      fallback={
        isHydrated ? (
          <button onClick={openCart} aria-label="Cart">
            {inner(0)}
          </button>
        ) : (
          <Link to="/cart" aria-label="Cart">
            {inner(0)}
          </Link>
        )
      }
    >
      <Await resolve={rootData?.cart}>
        {(cart) => {
          const count = cart?.totalQuantity || 0;
          return isHydrated ? (
            <button onClick={openCart} aria-label={`Cart (${count})`}>
              {inner(count)}
            </button>
          ) : (
            <Link to="/cart" aria-label="Cart">
              {inner(count)}
            </Link>
          );
        }}
      </Await>
    </Suspense>
  );
}

// ─── Search overlay ───────────────────────────────────────────────────────────
function SearchOverlay({isOpen, onClose}) {
  const params = useParams();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.3}}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(250,250,248,0.7)',
              backdropFilter: 'blur(20px)',
              zIndex: 100,
            }}
          />
          <motion.div
            initial={{opacity: 0, y: -30}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -30}}
            transition={{duration: 0.35, ease: [0.16, 1, 0.3, 1]}}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 101,
              background: 'rgba(250,250,248,0.98)',
              borderBottom: '1px solid rgba(17,16,16,0.07)',
              padding: 'clamp(20px, 4vw, 40px) clamp(20px, 4vw, 56px)',
            }}
          >
            <Form
              method="get"
              action={params.locale ? `/${params.locale}/search` : '/search'}
              onSubmit={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                maxWidth: 800,
                margin: '0 auto',
              }}
            >
              <span
                style={{
                  color: 'rgba(17,16,16,0.3)',
                  flexShrink: 0,
                  paddingTop: 4,
                }}
              >
                <SearchIcon size={22} />
              </span>
              <input
                ref={inputRef}
                name="q"
                type="search"
                placeholder="Search products, collections…"
                className="hdr-search-input"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={onClose}
                className="hdr-icon-btn"
                style={{flexShrink: 0}}
                aria-label="Close search"
              >
                <CloseIcon />
              </button>
            </Form>
            <p
              style={{
                fontFamily: 'var(--header-font-sans)',
                fontSize: 10,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(17,16,16,0.3)',
                textAlign: 'center',
                marginTop: 16,
              }}
            >
              Press Enter to search · Esc to close
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Cart drawer ──────────────────────────────────────────────────────────────
function CartDrawer({isOpen, onClose}) {
  const rootData = useRouteLoaderData('root');
  if (!rootData) return null;
  return (
    <Drawer open={isOpen} onClose={onClose} heading="Cart" openFrom="right">
      <Suspense fallback={<CartLoading />}>
        <Await resolve={rootData?.cart}>
          {(cart) => <Cart layout="drawer" onClose={onClose} cart={cart} />}
        </Await>
      </Suspense>
    </Drawer>
  );
}

// ─── Mobile menu full-screen ──────────────────────────────────────────────────
export function MobileMenuDrawer({isOpen, onClose, menu}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.2)',
              zIndex: 60,
            }}
            onClick={onClose}
          />
          <motion.div
            initial={{x: '-100%'}}
            animate={{x: 0}}
            exit={{x: '-100%'}}
            transition={{duration: 0.45, ease: [0.16, 1, 0.3, 1]}}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 'min(85vw, 380px)',
              background: '#FAFAF8',
              zIndex: 61,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header of drawer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '24px 28px',
                borderBottom: '1px solid rgba(17,16,16,0.07)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--header-font-sans)',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--header-ink-muted)',
                }}
              >
                Navigation
              </span>
              <button
                onClick={onClose}
                className="hdr-icon-btn"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Nav links */}
            <nav style={{padding: '24px 28px', flex: 1}}>
              {(menu?.items || []).map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{opacity: 0, x: -20}}
                  animate={{opacity: 1, x: 0}}
                  transition={{
                    delay: 0.05 + i * 0.06,
                    duration: 0.35,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <MobileNavItem item={item} onClose={onClose} />
                </motion.div>
              ))}
            </nav>

            {/* Footer of drawer */}
            <div
              style={{
                padding: '20px 28px',
                borderTop: '1px solid rgba(17,16,16,0.07)',
                display: 'flex',
                gap: 16,
              }}
            >
              <Link
                to="/account"
                onClick={onClose}
                style={{
                  fontFamily: 'var(--header-font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--header-ink-muted)',
                  textDecoration: 'none',
                }}
              >
                Account
              </Link>
              <Link
                to="/search"
                onClick={onClose}
                style={{
                  fontFamily: 'var(--header-font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--header-ink-muted)',
                  textDecoration: 'none',
                }}
              >
                Search
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MobileNavItem({item, onClose, depth = 0}) {
  const [open, setOpen] = useState(false);
  const hasChildren = item.items?.length > 0;

  if (depth === 0) {
    return (
      <div style={{marginBottom: 2}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            to={item.to}
            onClick={hasChildren ? undefined : onClose}
            className="hdr-mobile-link"
            style={{flex: 1, textDecoration: 'none'}}
          >
            {item.title}
          </Link>
          {hasChildren && (
            <button
              onClick={() => setOpen(!open)}
              style={{
                padding: '0 0 0 12px',
                color: 'var(--header-ink-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <motion.span
                animate={{rotate: open ? 180 : 0}}
                transition={{duration: 0.25}}
                style={{display: 'flex'}}
              >
                <ChevronIcon />
              </motion.span>
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {open && hasChildren && (
            <motion.div
              initial={{height: 0, opacity: 0}}
              animate={{height: 'auto', opacity: 1}}
              exit={{height: 0, opacity: 0}}
              transition={{duration: 0.3, ease: [0.16, 1, 0.3, 1]}}
              style={{overflow: 'hidden', paddingLeft: 16}}
            >
              {item.items.map((child) => (
                <MobileNavItem
                  key={child.id}
                  item={child}
                  onClose={onClose}
                  depth={1}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      to={item.to}
      onClick={onClose}
      style={{
        display: 'block',
        fontFamily: 'var(--header-font-sans)',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--header-ink-muted)',
        padding: '10px 0',
        borderBottom: '1px solid rgba(17,16,16,0.05)',
        textDecoration: 'none',
        transition: 'color 0.2s',
      }}
    >
      {item.title}
    </Link>
  );
}

// ─── Inline SVG icons (no external deps) ─────────────────────────────────────
const SearchIcon = ({size = 18}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="15.5" y1="15.5" x2="22" y2="22" />
  </svg>
);

const MenuIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <line x1="3" y1="7" x2="21" y2="7" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="17" x2="15" y2="17" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <line x1="4" y1="4" x2="20" y2="20" />
    <line x1="20" y1="4" x2="4" y2="20" />
  </svg>
);

const PersonIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const PersonFilledIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const BagIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const ChevronIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
