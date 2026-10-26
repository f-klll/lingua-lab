// 交互层：光标光斑、导航滑块、数字滚动、滚动进度。
// 只在 DOM 上做展示层操作，不参与 React 业务状态。

const reduceMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const SPOT_SELECTOR = [
  '.dash-card', '.dash-panel', '.word-card', '.affix-card',
  '.root-feature', '.reading-layout', '.vocab-stats', '.show-card',
  '.method-strip', '.daily-queue', '.primary-study',
].join(',')

const NUM_SELECTOR = [
  '.dash-card-info > strong',
  '.hero-mini-stats b',
  '.vocab-stats strong',
  '.root-stats strong',
  '.breakdown-count',
  '.xp-card strong',
  '.feedback-card strong',
].join(',')

function bindSpotlight() {
  const onMove = (event) => {
    if (event.pointerType === 'touch') return
    const el = event.target instanceof Element ? event.target.closest(SPOT_SELECTOR) : null
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--ll-mx', `${event.clientX - rect.left}px`)
    el.style.setProperty('--ll-my', `${event.clientY - rect.top}px`)
  }
  document.addEventListener('pointermove', onMove, { passive: true })
  return () => document.removeEventListener('pointermove', onMove)
}

function syncNavInk() {
  const nav = document.querySelector('.sidebar nav')
  if (!nav) return
  const active = nav.querySelector('.nav-item.active')
  if (!active || !active.getBoundingClientRect().width) {
    nav.style.setProperty('--ll-ink-ready', '0')
    return
  }
  const navRect = nav.getBoundingClientRect()
  const itemRect = active.getBoundingClientRect()
  nav.style.setProperty('--ll-ink-x', `${itemRect.left - navRect.left + nav.scrollLeft}px`)
  nav.style.setProperty('--ll-ink-y', `${itemRect.top - navRect.top + nav.scrollTop}px`)
  nav.style.setProperty('--ll-ink-w', `${itemRect.width}px`)
  nav.style.setProperty('--ll-ink-h', `${itemRect.height}px`)
  nav.style.setProperty('--ll-ink-ready', '1')
}

function animateNumber(el) {
  if (el.__llAnimating) return
  const node = [...el.childNodes].find(
    (n) => n.nodeType === 3 && /^\s*-?\d+(?:\.\d+)?\s*$/.test(n.nodeValue || '')
  )
  if (!node) return
  const target = parseFloat(node.nodeValue)
  if (!Number.isFinite(target)) return
  const raw = String(node.nodeValue).trim()
  const decimals = (raw.split('.')[1] || '').length
  const previous = el.__llNum
  el.__llNum = target
  if (reduceMotion() || previous === undefined || previous === target) return

  const from = previous
  const start = performance.now()
  const duration = 620
  el.__llAnimating = true

  const step = (now) => {
    const p = Math.min(1, Math.max(0, (now - start) / duration))
    const eased = 1 - Math.pow(1 - p, 3)
    node.nodeValue = (from + (target - from) * eased).toFixed(decimals)
    if (p < 1) {
      el.__llRaf = requestAnimationFrame(step)
    } else {
      node.nodeValue = target.toFixed(decimals)
      el.__llAnimating = false
      el.__llRaf = 0
    }
  }
  el.__llRaf = requestAnimationFrame(step)
}

function scanNumbers(root = document) {
  if (!root.querySelectorAll) return
  root.querySelectorAll(NUM_SELECTOR).forEach(animateNumber)
}

function bindScrollProgress() {
  const bar = document.createElement('div')
  bar.className = 'll-progress'
  document.body.appendChild(bar)
  let frame = 0
  const update = () => {
    frame = 0
    const doc = document.documentElement
    const max = doc.scrollHeight - window.innerHeight
    const ratio = max > 80 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    bar.style.setProperty('--ll-progress', ratio.toFixed(4))
    bar.classList.toggle('on', ratio > 0.01)
  }
  const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  update()
  return () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    bar.remove()
  }
}

export function startPolish() {
  if (typeof window === 'undefined') return () => {}
  if (window.__llPolishStarted) return window.__llPolishStarted

  const stopSpotlight = bindSpotlight()
  const stopProgress = bindScrollProgress()

  let raf = 0
  const run = () => {
    attachContentObserver()
    syncNavInk()
    scanNumbers()
  }
  const refresh = () => {
    cancelAnimationFrame(raf)
    run()
    raf = requestAnimationFrame(run)
  }

  const fontTimer = setTimeout(refresh, 400)
  window.addEventListener('resize', refresh, { passive: true })
  const onAnyScroll = (event) => {
    const target = event.target
    if (target instanceof Element && target.matches('.sidebar nav')) refresh()
  }
  document.addEventListener('scroll', onAnyScroll, true)

  // 页面切换（React 替换 .page-content 子树）后重新对齐
  let observer = null
  let observedContent = null
  function attachContentObserver() {
    const content = document.querySelector('.page-content')
    if (!content || content === observedContent) return
    if (observer) observer.disconnect()
    observedContent = content
    observer = new MutationObserver(refresh)
    observer.observe(content, { childList: true })
  }
  attachContentObserver()

  // 欢迎页 → 应用外壳：根节点整体替换时重新对接一次
  const root = document.getElementById('root')
  let rootObserver = null
  if (root) {
    rootObserver = new MutationObserver(() => {
      attachContentObserver()
      refresh()
      setTimeout(refresh, 80)
    })
    rootObserver.observe(root, { childList: true })
  }

  refresh()

  // 操作后数值可能变化，或侧栏折叠状态改变：轻量重扫一次
  let clickTimer = 0
  const onClick = () => {
    clearTimeout(clickTimer)
    clickTimer = setTimeout(refresh, 260)
  }
  document.addEventListener('click', onClick, true)

  const cleanup = () => {
    clearTimeout(fontTimer)
    clearTimeout(clickTimer)
    document.removeEventListener('click', onClick, true)
    document.removeEventListener('scroll', onAnyScroll, true)
    window.removeEventListener('resize', refresh)
    if (observer) observer.disconnect()
    if (rootObserver) rootObserver.disconnect()
    stopSpotlight()
    stopProgress()
    window.__llPolishStarted = null
  }

  window.__llPolishStarted = cleanup
  return cleanup
}
