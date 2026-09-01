const fs = require('fs')
const NL = '\r\n'

// ---------- main.jsx ----------
const jp = 'src/main.jsx'
let s = fs.readFileSync(jp, 'utf8')

function rep(search, replace, label) {
  const idx = s.indexOf(search)
  if (idx === -1) { console.error('NOT FOUND: ' + label); process.exit(1) }
  if (s.indexOf(search, idx + 1) !== -1) { console.error('NOT UNIQUE: ' + label); process.exit(1) }
  s = s.slice(0, idx) + replace + s.slice(idx + search.length)
  console.log('OK: ' + label)
}

// 1) hero: open copy wrapper right inside welcome-hero-inner
rep(
  '<div className="welcome-hero-inner">' + NL + '        <div className="welcome-brand">',
  '<div className="welcome-hero-inner">' + NL + '        <div className="welcome-hero-copy">' + NL + '        <div className="welcome-brand">',
  'hero copy open'
)

// 2) hero: close copy wrapper, insert QR card next to the text
rep(
  '        <div className="welcome-scroll-hint">' + NL +
  '          <span>向下滚动了解更多</span>' + NL +
  '          <div className="welcome-scroll-line" />' + NL +
  '        </div>' + NL +
  '      </div>' + NL +
  '    </section>',
  '        <div className="welcome-scroll-hint">' + NL +
  '          <span>向下滚动了解更多</span>' + NL +
  '          <div className="welcome-scroll-line" />' + NL +
  '        </div>' + NL +
  '        </div>' + NL +
  '        <WelcomeQrCard variant="hero" />' + NL +
  '      </div>' + NL +
  '    </section>',
  'hero qr card'
)

// 3) philosophy (welcome end): QR card after the bottom CTA
rep(
  '        <button className="welcome-enter-btn welcome-enter-bottom" onClick={onEnter}>' + NL +
  '          开始学习 <ArrowUpRight size={18} />' + NL +
  '        </button>' + NL +
  '      </div>' + NL +
  '    </section>',
  '        <button className="welcome-enter-btn welcome-enter-bottom" onClick={onEnter}>' + NL +
  '          开始学习 <ArrowUpRight size={18} />' + NL +
  '        </button>' + NL +
  '        <WelcomeQrCard variant="dark" />' + NL +
  '      </div>' + NL +
  '    </section>',
  'philosophy qr card'
)

// 4) WelcomeQrCard component after QrModal
const component = [
  '',
  'function WelcomeQrCard({ variant = \'hero\' }) {',
  '  const { qrData, shareUrl } = useMemo(() => {',
  '    const url = window.location.hostname.endsWith(\'.pages.dev\') ? `${window.location.origin}/` : \'https://lingua-lab-zll.pages.dev/\'',
  '    try {',
  '      const qr = qrcode(0, \'M\')',
  '      qr.addData(url)',
  '      qr.make()',
  '      return { qrData: qr.createDataURL(6, 2), shareUrl: url.replace(/^https?:\\/\\//, \'\').replace(/\\/$/, \'\') }',
  '    } catch (e) { return { qrData: \'\', shareUrl: url } }',
  '  }, [])',
  '  return <div className={`welcome-qr-card${variant === \'dark\' ? \' welcome-qr-dark\' : \'\'}`}>',
  '    {qrData ? <img src={qrData} alt="Lingua Lab 二维码" /> : <span className="welcome-qr-error">二维码生成失败</span>}',
  '    <div className="welcome-qr-text">',
  '      <strong>手机扫一扫 · 随时随地学</strong>',
  '      <span>{shareUrl}</span>',
  '    </div>',
  '  </div>',
  '}',
].join(NL)

rep(
  '    <p className="qr-hint">用手机微信扫一扫，在手机上继续学习</p>' + NL +
  '    <p className="qr-url">{shareUrl}</p>' + NL +
  '  </div></div>' + NL +
  '}',
  '    <p className="qr-hint">用手机微信扫一扫，在手机上继续学习</p>' + NL +
  '    <p className="qr-url">{shareUrl}</p>' + NL +
  '  </div></div>' + NL +
  '}' + NL + component,
  'WelcomeQrCard component'
)

fs.writeFileSync(jp, s)
console.log('main.jsx written')

// ---------- styles.css ----------
const cp = 'src/styles.css'
let c = fs.readFileSync(cp, 'utf8')
if (!c.endsWith('\n')) c += NL
const css = [
  '',
  '/* ===== 欢迎页二维码卡片 ===== */',
  '.welcome-qr-card {',
  '  position: relative; z-index: 1;',
  '  display: inline-flex; flex-direction: column; align-items: center; gap: 14px;',
  '  padding: 22px 26px 18px;',
  '  background: rgba(255, 255, 255, 0.82);',
  '  border: 1px solid rgba(190, 110, 125, 0.22);',
  '  border-radius: 18px;',
  '  box-shadow: 0 20px 50px rgba(180, 120, 140, 0.16);',
  '  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);',
  '  flex-shrink: 0;',
  '}',
  '.welcome-qr-card img { width: 148px; height: 148px; display: block; border-radius: 10px; background: #fff; }',
  '.welcome-qr-text { display: flex; flex-direction: column; gap: 3px; text-align: center; }',
  '.welcome-qr-text strong { font-size: 13.5px; font-weight: 700; color: #43343b; letter-spacing: 0.02em; }',
  '.welcome-qr-text span { font-size: 11px; color: #a38d99; letter-spacing: 0.02em; }',
  '.welcome-qr-error { font-size: 12px; color: #c46888; }',
  '',
  '/* Hero 双栏：文字在左，二维码在右 */',
  '.welcome-hero-inner { display: flex; align-items: center; justify-content: center; gap: 64px; max-width: 1080px; }',
  '.welcome-hero-copy { width: 100%; max-width: 720px; text-align: center; }',
  '',
  '/* 欢迎页末尾暗色区版本 */',
  '.welcome-qr-dark {',
  '  margin-top: 44px;',
  '  background: rgba(255, 255, 255, 0.07);',
  '  border-color: rgba(255, 255, 255, 0.16);',
  '  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);',
  '}',
  '.welcome-qr-dark img { padding: 10px; background: #fff; border-radius: 12px; }',
  '.welcome-qr-dark .welcome-qr-text strong { color: #fff; }',
  '.welcome-qr-dark .welcome-qr-text span { color: #8fa5b0; }',
  '',
  '@media (max-width: 900px) {',
  '  .welcome-hero-inner { flex-direction: column; gap: 44px; }',
  '}',
  '@media (max-width: 600px) {',
  '  .welcome-qr-card { padding: 18px 22px 14px; }',
  '  .welcome-qr-card img { width: 124px; height: 124px; }',
  '}',
  '',
].join(NL)
c += css
fs.writeFileSync(cp, c)
console.log('styles.css written')
