import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createPortal } from 'react-dom'
import {
  ArrowUpRight, BookOpen, Brain, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, MessageSquare, Heart,
  Download, FileImage, Flame, Headphones, Highlighter, Library, Lightbulb, Link2, Menu, Merge, Minus, Play, Plus, Search,
  Settings2, Sparkles, Trash2, Upload, Volume2, X, Zap, Trophy, BarChart3, LogOut, User, Target, Award, TrendingUp, Medal, Crown, Star, Rocket, BookMarked, XCircle, CheckCircle, Languages, ScanText, ZoomIn, RotateCcw, Info, GraduationCap, Repeat, ShieldCheck, QrCode
} from 'lucide-react'
import qrcode from 'qrcode-generator'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import ePub from 'epubjs'
import PdfViewer from './PdfViewer'
import ImageTranslator from './OcrTranslate'
import './styles.css'
import { AFFIX_TYPES, affixData } from './rootData'

GlobalWorkerOptions.workerSrc = pdfWorker

// 用 pdf.js 解析 PDF 论文：提取每页纯文本（图片位置插入 [图片] 占位），并保留原始数据用于原页预览
async function extractPdfFile(file) {
  const buffer = await file.arrayBuffer()
  const savedBuffer = buffer.slice(0)
  const pdf = await getDocument({ data: buffer }).promise
  const pages = []
  let imageCount = 0
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    let imgCount = 0
    try {
      const ops = await page.getOperatorList()
      for (const code of ops.fnArray) {
        if (code >= 83 && code <= 90) imgCount++
      }
    } catch (e) { /* 某些页面算子解析失败时忽略图片检测 */ }
    imageCount += imgCount
    const content = await page.getTextContent()
    const pageText = content.items.map((item) => (item.str || '')).join(' ').replace(/\s{2,}/g, ' ').trim()
    // 含图的页渲染一张缩略图，内嵌到正文对应位置
    let thumb = null
    if (imgCount > 0) {
      try {
        const base = page.getViewport({ scale: 1 })
        const scale = 320 / base.width
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        const ctx = canvas.getContext('2d')
        await page.render({ canvasContext: ctx, viewport }).promise
        thumb = canvas.toDataURL('image/jpeg', 0.78)
      } catch (e) { thumb = null }
    }
    pages.push({ text: pageText, imageCount: imgCount, thumb })
  }
  const text = pages.map((p) => p.text).join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
  const numPages = pdf.numPages
  await pdf.destroy()
  return { text, buffer: savedBuffer, numPages, pages, imageCount }
}

// 用 epub.js 解析 EPUB：提取所有章节纯文本
async function extractEpubFile(file) {
  const arrayBuffer = await file.arrayBuffer()
  const book = ePub(arrayBuffer)
  await book.ready
  const texts = []
  let chapterCount = 0
  // 遍历 spine（章节列表）
  for (let i = 0; i < book.spine.length; i++) {
    const item = book.spine.items[i]
    try {
      await item.load(book.load.bind(book))
      const doc = item.document
      if (doc && doc.body) {
        const text = (doc.body.innerText || doc.body.textContent || '').trim()
        if (text) {
          texts.push(text)
          chapterCount++
        }
      }
      item.unload()
    } catch (e) {
      // 某些章节加载失败时跳过
      try { item.unload() } catch (_) {}
    }
  }
  const text = texts.join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
  try { book.destroy() } catch (e) {}
  return { text, chapterCount }
}

// 把 PDF 某一页渲染成图片（用于原页预览，保留图表、公式和版式）
async function renderPdfPageImage(buffer, pageNum, targetWidth) {
  const data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : (buffer.slice ? buffer.slice(0) : buffer)
  const pdf = await getDocument({ data }).promise
  try {
    const page = await pdf.getPage(pageNum)
    const base = page.getViewport({ scale: 1 })
    const scale = targetWidth / base.width
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
    return canvas.toDataURL('image/jpeg', 0.85)
  } finally {
    await pdf.destroy()
  }
}

// 用有道词典 JSONP 在线查中文释义（本地词库没有时兜底）
function fetchYoudao(word) {
  return new Promise((resolve) => {
    const cbName = '__yd_cb_' + Date.now() + '_' + Math.floor(Math.random() * 10000)
    let done = false
    const finish = (result) => { if (done) return; done = true; resolve(result) }
    const cleanup = () => {
      try { delete window[cbName] } catch (e) { window[cbName] = undefined }
      const s = document.getElementById('__yd_script')
      if (s && s.parentNode) s.parentNode.removeChild(s)
    }
    const timer = setTimeout(() => { finish(null); cleanup() }, 8000)
    window[cbName] = (data) => {
      clearTimeout(timer)
      cleanup()
      try {
        const entries = data && data.data && data.data.entries
        if (entries && entries.length) {
          const explain = entries[0].explain
          if (typeof explain === 'string') finish(explain)
          else if (Array.isArray(explain)) finish(explain.join('；'))
          else finish(null)
        } else finish(null)
      } catch (e) { finish(null) }
    }
    const s = document.createElement('script')
    s.id = '__yd_script'
    s.src = 'https://dict.youdao.com/suggest?num=1&doctype=json&callback=' + cbName + '&q=' + encodeURIComponent(word)
    s.onerror = () => { clearTimeout(timer); cleanup(); finish(null) }
    document.head.appendChild(s)
  })
}

const navItems = [
  { id: 'dashboard', label: '学习中心', icon: Trophy },
  { id: 'today', label: '今日学习', icon: Sparkles },
  { id: 'read', label: '文本阅读', icon: BookOpen },
  { id: 'fusion', label: '融合阅读', icon: Merge },
  { id: 'words', label: '词汇库', icon: Library },
  { id: 'roots', label: '词根实验室', icon: Brain },
  { id: 'shows', label: '英文剧场', icon: Play },
]

const articleWords = [
  { text: 'Curiosity', key: 'curiosity' }, { text: 'is' }, { text: 'a', }, { text: 'quiet', key: 'quiet' },
  { text: 'force' }, { text: 'behind' }, { text: 'many' }, { text: 'of' }, { text: 'the' },
  { text: 'world’s', key: 'world' }, { text: 'most' }, { text: 'important', key: 'important' },
  { text: 'discoveries.', }, { text: 'It' }, { text: 'turns' }, { text: 'a' }, { text: 'simple' },
  { text: 'question' }, { text: 'into' }, { text: 'a' }, { text: 'path' }, { text: 'for' },
  { text: 'exploration' }, { text: 'and' }, { text: 'growth.' },
]

// 默认文章的纯文本（用于全文朗读）
const defaultArticleText = articleWords.map((w) => w.text).join(' ') +
  ' In a world filled with instant answers, the act of asking a question can feel surprisingly powerful. A question slows us down. It creates a small opening through which a new idea can enter. "The important thing is not to stop questioning." Albert Einstein. A question is a direction. When we ask why, we are not simply looking for information. We are choosing a direction for our attention. That choice is often the beginning of learning.'

// 内置阅读文库：原创六级难度短文（点词可查、可标记、可朗读）
const builtinArticles = [
  {
    id: 'curiosity',
    title: 'The quiet force of curiosity',
    level: 'CET-6 · 短文',
    minutes: '6 min',
    text: defaultArticleText,
  },
  {
    id: 'attention',
    title: 'The cost of divided attention',
    level: 'CET-6 · 观点文',
    minutes: '5 min',
    text: 'In a culture that celebrates multitasking, the ability to focus on a single task has become a rare and undervalued skill. We check messages while watching videos, reply to emails during meetings, and scroll through feeds at the dinner table. Yet a growing body of research suggests that the brain does not actually multitask. It switches rapidly between tasks, and every switch carries a cost.\n\nPsychologists call this cost "attention residue." When we leave a task unfinished and turn to another, part of our attention lingers behind, like a shadow that follows us into the next room. Studies show that even a brief interruption can take more than twenty minutes to recover from, and that people who constantly switch between screens consistently underestimate how long their work actually takes.\n\nThe good news is that focus is a skill, not a gift. It can be trained the same way a muscle is trained — through short, deliberate sessions of undivided attention. Turn off notifications. Close the extra tabs. Give one task the whole of your mind. In a world engineered to scatter our attention, choosing to concentrate is itself an act of resistance.',
  },
  {
    id: 'sleep',
    title: 'Why your brain needs sleep',
    level: 'CET-6 · 科普文',
    minutes: '6 min',
    text: 'Sleep is not a luxury or a sign of laziness. It is one of the most active and essential processes in the human body, and modern science is only beginning to understand how much we owe to it.\n\nDuring deep sleep, the brain consolidates memory. The experiences of the day are replayed, strengthened, and moved from fragile short-term storage into more permanent long-term memory. Students who sleep after studying consistently recall more than those who stay up late to cram — because the brain, not the textbook, does the learning.\n\nSleep also clears the waste that accumulates in the brain during waking hours. Recent research has revealed a "cleaning system" that operates mainly at night, flushing away proteins linked to conditions like Alzheimer\'s disease. When we sacrifice sleep for productivity, we are not just tired the next morning; we are quietly interfering with the brain\'s maintenance work.\n\nThe practical message is simple: treat sleep as part of the work, not the enemy of it. A well-rested mind is faster, sharper, and more creative than one running on caffeine and willpower. Sometimes the most productive thing you can do is to turn off the light.',
  },
]

const wordData = {
  curiosity: { word: 'curiosity', phonetic: '/ˌkjʊəriˈɒsəti/', stress: '主重音在 os', meaning: '好奇心', root: 'cur / cura', rootMeaning: 'care · 关心', scene: '你在实验室里发现一个闪烁的红色按钮，忍不住想知道它会做什么。', example: 'Curiosity led her to ask one more question.', tag: '六级高频' },
  quiet: { word: 'quiet', phonetic: '/ˈkwaɪət/', stress: '主重音在 qui', meaning: '安静的；平静的', root: 'qui / quies', rootMeaning: 'rest · 休息', scene: '图书馆窗边，雨声很轻，你终于进入了专注状态。', example: 'The quiet room helped me focus.', tag: '四级核心' },
  world: { word: 'world', phonetic: '/wɜːld/', stress: '单音节重读', meaning: '世界；领域', root: 'wer / wor', rootMeaning: 'turn · 转动', scene: '打开地图，所有城市像小灯一样连成一个巨大的世界。', example: 'Travel can change the way we see the world.', tag: '四级核心' },
  important: { word: 'important', phonetic: '/ɪmˈpɔːtənt/', stress: '主重音在 por', meaning: '重要的', root: 'port', rootMeaning: 'carry · 携带', scene: '一个重要的决定像行李一样，需要你亲自把它带到未来。', example: 'It is important to keep asking questions.', tag: '六级高频' },
}

// 朗读：TTS，语速从设置读取（默认 0.9，稍慢更适合学习）
function speak(text) {
  if (!('speechSynthesis' in window) || !text) return
  const u = new SpeechSynthesisUtterance(String(text))
  try {
    const rate = parseFloat(localStorage.getItem('tts_rate') || '0.9')
    if (!isNaN(rate) && rate > 0) u.rate = rate
  } catch (e) { /* ignore */ }
  window.speechSynthesis.speak(u)
}
// 停止朗读
function stopSpeak() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

const basicMeanings = {
  is: '是；存在', a: '一个；一件', quiet: '安静的；平静的', force: '力量；促使', behind: '在……背后', many: '许多的',
  of: '……的；关于', the: '这；那', most: '最；大多数', discoveries: '发现', it: '它', turns: '使变成；转动',
  simple: '简单的', question: '问题；提问', into: '进入；变成', path: '道路；路径', for: '为了；对于',
  exploration: '探索', and: '和；以及', growth: '成长；增长', in: '在……里面', world: '世界；领域',
  filled: '充满的', with: '和；带有', instant: '即时的', answers: '答案', act: '行为；行动', asking: '提问',
  can: '能够；可以', feel: '感觉', surprisingly: '出乎意料地', powerful: '有力量的', slows: '使变慢', down: '向下；减少',
  creates: '创造；产生', small: '小的', opening: '开口；机会', through: '通过', which: '哪一个；这', new: '新的',
  idea: '想法', enter: '进入', why: '为什么', are: '是', not: '不；不是', simply: '简单地', looking: '寻找；看',
  information: '信息', choosing: '选择', direction: '方向', attention: '注意力', beginning: '开始', learning: '学习',
}

function wordKey(text) {
  return text.toLowerCase().replace(/[^a-z]/g, '')
}

// 本地日期键（YYYY-MM-DD）：避免 toISOString 的 UTC 时区偏移导致凌晨日期错位
function localDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildWordData(text) {
  const key = wordKey(text)
  if (wordData[key]) return wordData[key]
  return {
    word: key, phonetic: '点击播放发音', stress: '按音节自然重读',
    meaning: basicMeanings[key] || '根据文章语境理解', root: 'context', rootMeaning: 'meaning · 语境',
    scene: '在这篇文章里，这个词和“好奇心如何推动学习”这个场景一起出现。',
    example: 'The word "' + text.replace(/[’']/g, '') + '" appears in today’s reading.', tag: '文章词汇',
  }
}

// ===== 词根词缀字典（用于自动拆分导入词）=====
const AFFIX_DICT = {
  prefixes: [
    { a: 'un', m: '不，非，相反' }, { a: 're', m: '再，重新，回' }, { a: 'pre', m: '前，预先' },
    { a: 'dis', m: '不，分离，相反' }, { a: 'in', m: '不，向内' }, { a: 'im', m: '不，向内（b/m/p前）' },
    { a: 'en', m: '使…，进入' }, { a: 'em', m: '使…（b/m/p前）' }, { a: 'ex', m: '出，外，前任' },
    { a: 'pro', m: '向前，支持' }, { a: 'con', m: '共同，一起' }, { a: 'com', m: '共同，一起' },
    { a: 'de', m: '向下，去除，相反' }, { a: 'sub', m: '下，次，副' }, { a: 'trans', m: '跨越，转移' },
    { a: 'inter', m: '在…之间，相互' }, { a: 'anti', m: '反对，对抗' }, { a: 'auto', m: '自己，自动' },
    { a: 'bi', m: '二，双' }, { a: 'co', m: '共同' }, { a: 'counter', m: '相反，对抗' },
    { a: 'extra', m: '额外，超出' }, { a: 'fore', m: '前，预先' }, { a: 'hyper', m: '超过，过度' },
    { a: 'micro', m: '微小' }, { a: 'mis', m: '错误，坏' }, { a: 'mono', m: '单一' },
    { a: 'multi', m: '多' }, { a: 'non', m: '非，不' }, { a: 'over', m: '过度，在上' },
    { a: 'post', m: '后，在…之后' }, { a: 'semi', m: '半' }, { a: 'super', m: '超级，在上' },
    { a: 'sur', m: '超过，在上' }, { a: 'syn', m: '共同，一起' }, { a: 'sym', m: '共同，一起' },
    { a: 'tele', m: '远' }, { a: 'tri', m: '三' }, { a: 'ultra', m: '超，极端' },
    { a: 'under', m: '在下，不足' }, { a: 'out', m: '外，超过' }, { a: 'up', m: '向上' },
    { a: 'down', m: '向下' }, { a: 'back', m: '向后，回' }, { a: 'mid', m: '中间' },
    { a: 'self', m: '自我' }, { a: 'step', m: '继，后' }, { a: 'vice', m: '副' },
    { a: 'ad', m: '朝向，加强' }, { a: 'ac', m: '朝向（ad-变体）' }, { a: 'af', m: '朝向（ad-变体）' },
    { a: 'ag', m: '朝向（ad-变体）' }, { a: 'al', m: '朝向（ad-变体）' }, { a: 'an', m: '朝向（ad-变体）' },
    { a: 'ap', m: '朝向（ad-变体）' }, { a: 'ar', m: '朝向（ad-变体）' }, { a: 'as', m: '朝向（ad-变体）' },
    { a: 'at', m: '朝向（ad-变体）' }, { a: 'ab', m: '离开，相反' }, { a: 'abs', m: '离开，相反' },
    { a: 'ambi', m: '两边，周围' }, { a: 'amphi', m: '两边，周围' }, { a: 'ante', m: '前' },
    { a: 'circum', m: '周围' }, { a: 'contra', m: '相反' }, { a: 'contro', m: '相反' },
    { a: 'deca', m: '十' }, { a: 'deci', m: '十分之一' }, { a: 'demi', m: '半' },
    { a: 'di', m: '二，分开' }, { a: 'dia', m: '穿过，相对' }, { a: 'dif', m: '分开（dis-变体）' },
    { a: 'dys', m: '坏，困难' }, { a: 'e', m: '出（ex-变体）' }, { a: 'ef', m: '出（ex-变体）' },
    { a: 'electro', m: '电' }, { a: 'em', m: '使…（b/m/p前）' }, { a: 'epi', m: '在…上，附加' },
    { a: 'eu', m: '好，优' }, { a: 'exo', m: '外' }, { a: 'extra', m: '额外，超出' },
    { a: 'infra', m: '在下' }, { a: 'intra', m: '在内' }, { a: 'intro', m: '向内' },
    { a: 'iso', m: '等，同' }, { a: 'macro', m: '大' }, { a: 'magni', m: '大' },
    { a: 'maxi', m: '大' }, { a: 'mega', m: '大，百万' }, { a: 'meta', m: '变化，超越' },
    { a: 'milli', m: '千分之一' }, { a: 'mini', m: '小' }, { a: 'mis', m: '错误，坏' },
    { a: 'mono', m: '单一' }, { a: 'multi', m: '多' }, { a: 'neo', m: '新' },
    { a: 'non', m: '非，不' }, { a: 'omni', m: '全' }, { a: 'ortho', m: '正，直' },
    { a: 'paleo', m: '古' }, { a: 'pan', m: '全，泛' }, { a: 'para', m: '旁，类似' },
    { a: 'pen', m: '几乎' }, { a: 'penta', m: '五' }, { a: 'per', m: '通过，完全' },
    { a: 'peri', m: '周围，环绕' }, { a: 'poly', m: '多' }, { a: 'post', m: '后，在…之后' },
    { a: 'pre', m: '前，预先' }, { a: 'preter', m: '超过' }, { a: 'pro', m: '向前，支持' },
    { a: 'pros', m: '向前，向' }, { a: 'proto', m: '原始，第一' }, { a: 'pseudo', m: '假' },
    { a: 'quad', m: '四' }, { a: 'quadri', m: '四' }, { a: 'quasi', m: '类似，半' },
    { a: 'quin', m: '五' }, { a: 're', m: '再，重新，回' }, { a: 'retro', m: '向后，回' },
    { a: 'se', m: '分开，离开' }, { a: 'semi', m: '半' }, { a: 'sept', m: '七' },
    { a: 'sex', m: '六' }, { a: 'sin', m: '中国' }, { a: 'sino', m: '中国' },
    { a: 'socio', m: '社会' }, { a: 'solo', m: '单独' }, { a: 'soph', m: '智慧' },
    { a: 'speci', m: '种类' }, { a: 'spectro', m: '光谱' }, { a: 'sperm', m: '种子' },
    { a: 'sphero', m: '球' }, { a: 'spino', m: '脊柱' }, { a: 'spiro', m: '呼吸' },
    { a: 'splanchno', m: '内脏' }, { a: 'staphylo', m: '葡萄状' }, { a: 'steato', m: '脂肪' },
    { a: 'steno', m: '狭窄' }, { a: 'stereo', m: '立体' }, { a: 'stheno', m: '力量' },
    { a: 'stomato', m: '口' }, { a: 'strepto', m: '链状' }, { a: 'sub', m: '下，次，副' },
    { a: 'suc', m: '在下（sub-变体）' }, { a: 'suf', m: '在下（sub-变体）' }, { a: 'sug', m: '在下（sub-变体）' },
    { a: 'sum', m: '在下（sub-变体）' }, { a: 'sup', m: '在下（sub-变体）' }, { a: 'sur', m: '在下（sub-变体）' },
    { a: 'sus', m: '在下（sub-变体）' }, { a: 'super', m: '超级，在上' }, { a: 'supra', m: '在上' },
    { a: 'sym', m: '共同（syn-变体）' }, { a: 'syn', m: '共同，一起' }, { a: 'syringo', m: '管，瘘管' },
    { a: 'tab', m: '平板' }, { a: 'tachy', m: '快速' }, { a: 'tauto', m: '相同' },
    { a: 'techno', m: '技术' }, { a: 'tele', m: '远' }, { a: 'temporo', m: '时间，颞' },
    { a: 'ten', m: '保持，伸展' }, { a: 'tendo', m: '腱' }, { a: 'teneo', m: '保持' },
    { a: 'terato', m: '畸形' }, { a: 'tetra', m: '四' }, { a: 'thalamo', m: '丘脑' },
    { a: 'thermo', m: '热' }, { a: 'thoraco', m: '胸' }, { a: 'thrombo', m: '血栓' },
    { a: 'thyro', m: '甲状腺' }, { a: 'toco', m: '分娩' }, { a: 'tono', m: '张力' },
    { a: 'topo', m: '地方' }, { a: 'toxico', m: '毒' }, { a: 'trachelo', m: '颈' },
    { a: 'tracheo', m: '气管' }, { a: 'trans', m: '跨越，转移' }, { a: 'traumato', m: '创伤' },
    { a: 'tri', m: '三' }, { a: 'tricho', m: '毛，发' }, { a: 'trigono', m: '三角' },
    { a: 'triplo', m: '三倍' }, { a: 'tropho', m: '营养' }, { a: 'tropo', m: '转变' },
    { a: 'tubo', m: '管' }, { a: 'tumo', m: '肿胀' }, { a: 'tympano', m: '鼓，鼓膜' },
    { a: 'typhlo', m: '盲，盲肠' }, { a: 'ultra', m: '超，极端' }, { a: 'umbra', m: '阴影' },
    { a: 'un', m: '不，非，相反' }, { a: 'uni', m: '一' }, { a: 'urano', m: '腭，天空' },
    { a: 'uretero', m: '输尿管' }, { a: 'urethro', m: '尿道' }, { a: 'urg', m: '工作，驱动' },
    { a: 'uro', m: '尿，尾' }, { a: 'uter', m: '子宫' }, { a: 'uve', m: '葡萄膜' },
    { a: 'vago', m: '迷走，流浪' }, { a: 'vasculo', m: '血管' }, { a: 'vaso', m: '管，血管' },
    { a: 'ven', m: '来，静脉' }, { a: 'ventro', m: '腹，前' }, { a: 'vermi', m: '蠕虫' },
    { a: 'verso', m: '转' }, { a: 'vertebro', m: '椎骨，关节' }, { a: 'vesico', m: '膀胱，泡' },
    { a: 'vestibulo', m: '前庭' }, { a: 'vibrio', m: '弧菌' }, { a: 'villi', m: '绒毛' },
    { a: 'vir', m: '男人，毒' }, { a: 'viscero', m: '内脏' }, { a: 'vitello', m: '卵黄' },
    { a: 'vitro', m: '玻璃' }, { a: 'viv', m: '活' }, { a: 'vulvo', m: '外阴' },
    { a: 'xantho', m: '黄色' }, { a: 'xeno', m: '异，外来' }, { a: 'xero', m: '干燥' },
    { a: 'xylo', m: '木' }, { a: 'zo', m: '动物，生命' }, { a: 'zoo', m: '动物' },
    { a: 'zygo', m: '接合，轭' }, { a: 'zymo', m: '酶，发酵' },
  ],
  suffixes: [
    { a: 'tion', m: '名词，表行为/状态' }, { a: 'sion', m: '名词，表行为/状态' },
    { a: 'ment', m: '名词，表行为/结果' }, { a: 'ness', m: '名词，表性质/状态' },
    { a: 'ity', m: '名词，表性质/状态' }, { a: 'ty', m: '名词，表性质/状态' },
    { a: 'ance', m: '名词，表性质/状态' }, { a: 'ence', m: '名词，表性质/状态' },
    { a: 'age', m: '名词，表集合/状态' }, { a: 'ure', m: '名词，表行为/结果' },
    { a: 'dom', m: '名词，表领域/状态' }, { a: 'ship', m: '名词，表身份/关系' },
    { a: 'hood', m: '名词，表身份/状态' }, { a: 'ism', m: '名词，表主义/学说' },
    { a: 'ist', m: '名词，表从事…的人' }, { a: 'er', m: '名词，表人/物' },
    { a: 'or', m: '名词，表人/物' }, { a: 'ar', m: '名词，表人/物' },
    { a: 'ee', m: '名词，表受动者' }, { a: 'able', m: '形容词，可…的' },
    { a: 'ible', m: '形容词，可…的' }, { a: 'ful', m: '形容词，充满…的' },
    { a: 'less', m: '形容词，无…的' }, { a: 'ous', m: '形容词，具有…的' },
    { a: 'ive', m: '形容词，有…性质的' }, { a: 'al', m: '形容词，与…有关的' },
    { a: 'ary', m: '形容词/名词后缀' }, { a: 'ory', m: '形容词/名词后缀' },
    { a: 'ic', m: '形容词，与…有关的' }, { a: 'ical', m: '形容词，与…有关的' },
    { a: 'ly', m: '副词，以…方式' }, { a: 'ize', m: '动词，使…化' },
    { a: 'ise', m: '动词，使…化（英）' }, { a: 'ify', m: '动词，使…化' },
    { a: 'en', m: '动词，使…' }, { a: 'ate', m: '动词/形容词后缀' },
    { a: 'ward', m: '副词，向…方向' }, { a: 'wards', m: '副词，向…方向' },
    { a: 'esque', m: '形容词，…风格的' }, { a: 'most', m: '形容词，最…的' },
  ],
  roots: [
    { r: 'port', m: '携带，运送' }, { r: 'dict', m: '说，言' }, { r: 'spect', m: '看' },
    { r: 'struct', m: '建造' }, { r: 'duct', m: '引导' }, { r: 'tract', m: '拉，拖' },
    { r: 'ject', m: '投掷' }, { r: 'mit', m: '发送' }, { r: 'miss', m: '发送' },
    { r: 'vert', m: '转' }, { r: 'vers', m: '转' }, { r: 'form', m: '形状，形成' },
    { r: 'scrib', m: '写' }, { r: 'script', m: '写' }, { r: 'graph', m: '写，画' },
    { r: 'log', m: '说，学科' }, { r: 'logy', m: '学科，研究' }, { r: 'duc', m: '引导' },
    { r: 'duce', m: '引导' }, { r: 'cap', m: '拿，抓，头' }, { r: 'cept', m: '拿，抓' },
    { r: 'ceive', m: '拿，抓' }, { r: 'cip', m: '拿，抓' }, { r: 'tain', m: '保持，拿住' },
    { r: 'ten', m: '保持，伸展' }, { r: 'tend', m: '伸展，趋向' }, { r: 'tens', m: '伸展' },
    { r: 'sent', m: '感觉' }, { r: 'sens', m: '感觉' }, { r: 'vid', m: '看' },
    { r: 'vis', m: '看' }, { r: 'aud', m: '听' }, { r: 'voc', m: '声音，叫' },
    { r: 'vok', m: '叫' }, { r: 'cred', m: '相信' }, { r: 'cur', m: '跑，发生' },
    { r: 'curs', m: '跑' }, { r: 'curr', m: '跑' }, { r: 'ven', m: '来' },
    { r: 'vent', m: '来' }, { r: 'mov', m: '移动' }, { r: 'mot', m: '移动' },
    { r: 'mob', m: '移动' }, { r: 'pend', m: '悬挂，支付' }, { r: 'pens', m: '悬挂，支付' },
    { r: 'pos', m: '放置' }, { r: 'pon', m: '放置' }, { r: 'press', m: '压' },
    { r: 'prim', m: '第一' }, { r: 'prin', m: '第一' }, { r: 'rupt', m: '破裂' },
    { r: 'sect', m: '切割' }, { r: 'sec', m: '切割，跟随' }, { r: 'sequ', m: '跟随' },
    { r: 'serv', m: '服务，保持' }, { r: 'sign', m: '标记，信号' }, { r: 'simil', m: '相似' },
    { r: 'sist', m: '站立' }, { r: 'sta', m: '站立' }, { r: 'stat', m: '站立，状态' },
    { r: 'stit', m: '站立，建立' }, { r: 'solv', m: '松开，解决' }, { r: 'solut', m: '松开' },
    { r: 'spec', m: '看' }, { r: 'spir', m: '呼吸' }, { r: 'spond', m: '承诺，回应' },
    { r: 'spons', m: '承诺，回应' }, { r: 'strict', m: '拉紧' }, { r: 'string', m: '拉紧' },
    { r: 'stru', m: '建造' }, { r: 'sum', m: '拿，取' }, { r: 'sumpt', m: '拿，取，花费' },
    { r: 'tact', m: '触摸' }, { r: 'tang', m: '触摸' }, { r: 'tect', m: '覆盖' },
    { r: 'temp', m: '时间' }, { r: 'tempor', m: '时间' }, { r: 'term', m: '界限，末端' },
    { r: 'terr', m: '土地' }, { r: 'test', m: '证明，测试' }, { r: 'text', m: '编织，文本' },
    { r: 'tom', m: '切割' }, { r: 'ton', m: '声音，音调' }, { r: 'tort', m: '扭曲' },
    { r: 'tors', m: '扭曲' }, { r: 'tox', m: '毒' }, { r: 'tribut', m: '给予' },
    { r: 'trud', m: '推' }, { r: 'trus', m: '推' }, { r: 'turb', m: '扰乱' },
    { r: 'uni', m: '一' }, { r: 'urb', m: '城市' }, { r: 'vac', m: '空' },
    { r: 'van', m: '空' }, { r: 'var', m: '变化' }, { r: 'ver', m: '真实' },
    { r: 'verb', m: '词，动词' }, { r: 'via', m: '路' }, { r: 'viv', m: '活' },
    { r: 'vit', m: '生命' }, { r: 'vol', m: '意愿，飞' }, { r: 'volv', m: '滚动' },
    { r: 'volut', m: '滚动' }, { r: 'vor', m: '吃' }, { r: 'vot', m: '发誓，投票' },
    { r: 'vulg', m: '民众' }, { r: 'act', m: '做，行动' }, { r: 'ag', m: '做，驱动' },
    { r: 'anim', m: '生命，精神' }, { r: 'ann', m: '年' }, { r: 'aqua', m: '水' },
    { r: 'arch', m: '统治，首要' }, { r: 'astro', m: '星' }, { r: 'audi', m: '听' },
    { r: 'bio', m: '生命' }, { r: 'brev', m: '短' }, { r: 'cad', m: '落' },
    { r: 'cas', m: '落' }, { r: 'cid', m: '落，发生' }, { r: 'cand', m: '白，发光' },
    { r: 'cant', m: '唱' }, { r: 'chron', m: '时间' }, { r: 'civ', m: '公民' },
    { r: 'claim', m: '喊叫' }, { r: 'clam', m: '喊叫' }, { r: 'clin', m: '倾斜' },
    { r: 'clud', m: '关闭' }, { r: 'clus', m: '关闭' }, { r: 'cogn', m: '知道' },
    { r: 'cord', m: '心' }, { r: 'corp', m: '身体' }, { r: 'cosm', m: '宇宙，秩序' },
    { r: 'crat', m: '统治' }, { r: 'crit', m: '判断，分离' }, { r: 'cruc', m: '十字' },
    { r: 'crypt', m: '隐藏' }, { r: 'cult', m: '耕种，培养' }, { r: 'dem', m: '人民' },
    { r: 'dent', m: '牙齿' }, { r: 'derm', m: '皮肤' }, { r: 'di', m: '日' },
    { r: 'doc', m: '教' }, { r: 'doct', m: '教' }, { r: 'dom', m: '家，统治' },
    { r: 'dorm', m: '睡眠' }, { r: 'drom', m: '跑' }, { r: 'dur', m: '持续，硬' },
    { r: 'ego', m: '自我' }, { r: 'equ', m: '相等' }, { r: 'erg', m: '工作' },
    { r: 'err', m: '漫游，错误' }, { r: 'ev', m: '年龄，时代' }, { r: 'fac', m: '做' },
    { r: 'fact', m: '做' }, { r: 'fect', m: '做' }, { r: 'fer', m: '携带，带来' },
    { r: 'fid', m: '信任' }, { r: 'fin', m: '结束，界限' }, { r: 'firm', m: '坚固' },
    { r: 'fix', m: '固定' }, { r: 'flam', m: '火焰' }, { r: 'flect', m: '弯曲' },
    { r: 'flex', m: '弯曲' }, { r: 'flu', m: '流' }, { r: 'fluct', m: '流' },
    { r: 'frag', m: '破碎' }, { r: 'fract', m: '破碎' }, { r: 'frig', m: '冷' },
    { r: 'frug', m: '果实，节俭' }, { r: 'fug', m: '逃' }, { r: 'fus', m: '倾倒，流' },
    { r: 'gam', m: '婚姻，结合' }, { r: 'gen', m: '产生，种类' }, { r: 'geo', m: '地球' },
    { r: 'germ', m: '芽，种子' }, { r: 'gest', m: '携带' }, { r: 'gigant', m: '巨大' },
    { r: 'glaci', m: '冰' }, { r: 'gloss', m: '语言，舌头' }, { r: 'glot', m: '语言' },
    { r: 'gon', m: '角' }, { r: 'grad', m: '步，级' }, { r: 'gress', m: '步，走' },
    { r: 'grat', m: '感谢，喜悦' }, { r: 'grav', m: '重' }, { r: 'greg', m: '群' },
    { r: 'gyn', m: '女性' }, { r: 'hab', m: '拥有，居住' }, { r: 'hibit', m: '拥有，展示' },
    { r: 'helio', m: '太阳' }, { r: 'hema', m: '血' }, { r: 'hemo', m: '血' },
    { r: 'her', m: '粘附' }, { r: 'hes', m: '粘附' }, { r: 'hetero', m: '异' },
    { r: 'hex', m: '六' }, { r: 'hier', m: '神圣' }, { r: 'hist', m: '组织，历史' },
    { r: 'homo', m: '同' }, { r: 'hor', m: '时间，小时' }, { r: 'hort', m: '花园' },
    { r: 'hum', m: '地，人' }, { r: 'hydr', m: '水' }, { r: 'hyg', m: '健康' },
    { r: 'iatr', m: '治疗' }, { r: 'icon', m: '图像' }, { r: 'ideo', m: '观念' },
    { r: 'idi', m: '自己的，特有的' }, { r: 'ign', m: '火' }, { r: 'imag', m: '形象' },
    { r: 'imit', m: '模仿' }, { r: 'insul', m: '岛' }, { r: 'integr', m: '完整' },
    { r: 'intr', m: '内部' }, { r: 'iod', m: '碘' }, { r: 'ir', m: '彩虹' },
    { r: 'iron', m: '铁' }, { r: 'iso', m: '等，同' }, { r: 'it', m: '走' },
    { r: 'jac', m: '躺，投掷' }, { r: 'jan', m: '门' }, { r: 'joc', m: '玩笑' },
    { r: 'jud', m: '判断' }, { r: 'jug', m: '连接，轭' }, { r: 'junct', m: '连接' },
    { r: 'jur', m: '法律，发誓' }, { r: 'just', m: '公正' }, { r: 'juven', m: '年轻' },
    { r: 'labor', m: '劳动' }, { r: 'lact', m: '乳' }, { r: 'lapid', m: '石头' },
    { r: 'laps', m: '滑，落' }, { r: 'lat', m: '携带，宽' }, { r: 'later', m: '侧面' },
    { r: 'lav', m: '洗' }, { r: 'lax', m: '松' }, { r: 'lect', m: '选择，读' },
    { r: 'leg', m: '法律，读，选择' }, { r: 'leng', m: '长' }, { r: 'lev', m: '轻，举' },
    { r: 'liber', m: '自由' }, { r: 'libr', m: '书，秤' }, { r: 'lic', m: '允许，引诱' },
    { r: 'lig', m: '绑，选择' }, { r: 'lim', m: '门槛，限制' }, { r: 'limp', m: '跛' },
    { r: 'line', m: '线' }, { r: 'ling', m: '语言，舌' }, { r: 'linqu', m: '离开' },
    { r: 'liqu', m: '液体' }, { r: 'liter', m: '字母，文学' }, { r: 'lith', m: '石头' },
    { r: 'loc', m: '地方' }, { r: 'log', m: '说，学科' }, { r: 'long', m: '长' },
    { r: 'loqu', m: '说' }, { r: 'luc', m: '光' }, { r: 'lud', m: '玩，欺骗' },
    { r: 'lus', m: '玩，欺骗' }, { r: 'lumin', m: '光' }, { r: 'lun', m: '月亮' },
    { r: 'lust', m: '光，渴望' }, { r: 'ly', m: '松开' }, { r: 'lys', m: '松开，分解' },
  ]
}

// 自动分析单词的词根词缀
function analyzeWord(word) {
  const w = (word || '').toLowerCase().replace(/[^a-z]/g, '')
  const result = { prefix: null, root: null, suffix: null, breakdown: [] }
  if (w.length < 3) return result

  // 前缀（最长匹配，且剩余部分至少3个字母）
  const pfx = [...AFFIX_DICT.prefixes].sort((a, b) => b.a.length - a.a.length)
  for (const p of pfx) {
    if (w.startsWith(p.a) && w.length - p.a.length >= 3) {
      result.prefix = p
      break
    }
  }

  // 后缀（最长匹配）
  const sfx = [...AFFIX_DICT.suffixes].sort((a, b) => b.a.length - a.a.length)
  for (const s of sfx) {
    const startIdx = result.prefix ? result.prefix.a.length : 0
    const middle = w.slice(startIdx)
    if (middle.endsWith(s.a) && middle.length - s.a.length >= 2) {
      result.suffix = s
      break
    }
  }

  // 词根（在去掉前后缀后的中间部分匹配，最长优先）
  // 修复：只在中间部分「开头」匹配，禁止在全词乱找短子串，避免
  // disappointing→di日、authoritative→hor时间 这类错误拆解
  let middle = w
  if (result.prefix) middle = middle.slice(result.prefix.a.length)
  if (result.suffix) middle = middle.slice(0, middle.length - result.suffix.a.length)
  const rts = [...AFFIX_DICT.roots].sort((a, b) => b.r.length - a.r.length)
  for (const r of rts) {
    if (middle === r.r || middle.startsWith(r.r)) {
      // 短词根（≤3字母）必须几乎占满中段，否则视为无关子串跳过
      if (r.r.length <= 3 && middle.length - r.r.length > 2) continue
      result.root = r
      break
    }
  }

  // 构建拆分描述
  if (result.prefix) result.breakdown.push(`${result.prefix.a}-（${result.prefix.m}）`)
  if (result.root) result.breakdown.push(`${result.root.r}（${result.root.m}）`)
  if (result.suffix) result.breakdown.push(`-${result.suffix.a}（${result.suffix.m}）`)

  return result
}

// 联网查询单词的音标和例句（Free Dictionary API，带 localStorage 缓存）
// ARPAbet 音素 → IPA 映射（简化版）
const ARPABET_TO_IPA = {
  AA: 'ɑ', AE: 'æ', AH: 'ʌ', AO: 'ɔ', AW: 'aʊ', AY: 'aɪ',
  B: 'b', CH: 'tʃ', D: 'd', DH: 'ð', EH: 'ɛ', ER: 'ɜr', EY: 'eɪ',
  F: 'f', G: 'ɡ', HH: 'h', IH: 'ɪ', IY: 'i', JH: 'dʒ',
  K: 'k', L: 'l', M: 'm', N: 'n', NG: 'ŋ', OW: 'oʊ', OY: 'ɔɪ',
  P: 'p', R: 'r', S: 's', SH: 'ʃ', T: 't', TH: 'θ',
  UH: 'ʊ', UW: 'u', V: 'v', W: 'w', Y: 'j', Z: 'z', ZH: 'ʒ',
}

// ARPAbet 发音串 → IPA 音标（带重音）
function arpabetToIPA(arpabet) {
  if (!arpabet) return ''
  const phonemes = arpabet.trim().split(/\s+/)
  let ipa = ''
  for (const ph of phonemes) {
    const match = ph.match(/^([A-Z]+)([012]?)$/)
    if (!match) continue
    const [, base, stress] = match
    const ipaPhoneme = ARPABET_TO_IPA[base] || base.toLowerCase()
    if (stress === '1') ipa += 'ˈ'
    else if (stress === '2') ipa += 'ˌ'
    ipa += ipaPhoneme
  }
  return ipa ? `/${ipa}/` : ''
}

// 联网查询单词的音标和例句（Datamuse API，带 localStorage 缓存）
async function fetchWordDetail(word) {
  const key = `vocab_detail_${(word || '').toLowerCase()}`
  try {
    const cached = localStorage.getItem(key)
    if (cached) return JSON.parse(cached)
  } catch (e) { /* ignore */ }

  // 1. 优先 Free Dictionary API（标准 IPA 音标 + 真实例句，最可靠）
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
    if (res.ok) {
      const data = await res.json()
      const entry = Array.isArray(data) ? (data[0] || {}) : {}
      let phonetic = entry.phonetic || ''
      if (!phonetic && Array.isArray(entry.phonetics)) {
        const p = entry.phonetics.find(x => x && x.text)
        if (p) phonetic = p.text
      }
      let enMeaning = '', partOfSpeech = '', example = ''
      if (Array.isArray(entry.meanings) && entry.meanings.length) {
        const m = entry.meanings[0]
        partOfSpeech = m.partOfSpeech || ''
        if (Array.isArray(m.definitions) && m.definitions.length) {
          enMeaning = m.definitions[0].definition || ''
          example = m.definitions[0].example || ''
        }
      }
      const detail = { phonetic, example, enMeaning, partOfSpeech, source: 'dictionaryapi' }
      try { localStorage.setItem(key, JSON.stringify(detail)) } catch (e) { /* ignore */ }
      return detail
    }
  } catch (e) { /* 回退 Datamuse */ }

  // 2. 回退 Datamuse API（ARPAbet 转 IPA + 英文释义）
  try {
    const res = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=dp&max=1`)
    if (!res.ok) throw new Error('api error')
    const data = await res.json()
    const entry = data[0] || {}

    // 音标：从 tags 里找 pron: 开头的 ARPAbet 发音，转 IPA
    let phonetic = ''
    if (Array.isArray(entry.tags)) {
      const pronTag = entry.tags.find(t => typeof t === 'string' && t.startsWith('pron:'))
      if (pronTag) phonetic = arpabetToIPA(pronTag.replace('pron:', ''))
    }

    // 英文释义 + 词性
    let enMeaning = '', partOfSpeech = ''
    if (Array.isArray(entry.defs) && entry.defs.length) {
      const firstDef = entry.defs[0]
      const parts = firstDef.split('\t')
      if (parts.length >= 2) {
        partOfSpeech = parts[0].trim()
        enMeaning = parts[1].trim()
      } else {
        enMeaning = firstDef.trim()
      }
    }

    // 例句：Datamuse 不返回例句，根据词性和单词生成简单例句
    let example = ''
    if (partOfSpeech && word) {
      const w = word.charAt(0).toUpperCase() + word.slice(1)
      if (partOfSpeech === 'n') example = `This is a common ${word} in academic writing.`
      else if (partOfSpeech === 'v') example = `They often ${word} new ideas in their discussions.`
      else if (partOfSpeech === 'adj') example = `It is ${word} to see such results in practice.`
      else example = `${w} plays an important role in this context.`
    }

    const detail = { phonetic, example, enMeaning, partOfSpeech, source: 'datamuse' }
    try { localStorage.setItem(key, JSON.stringify(detail)) } catch (e) { /* ignore */ }
    return detail
  } catch (e) {
    const detail = { phonetic: '', example: '', enMeaning: '', partOfSpeech: '', source: 'none' }
    try { localStorage.setItem(key, JSON.stringify(detail)) } catch (e2) { /* ignore */ }
    return detail
  }
}

// 把用户导入的四六级词条转成完整词卡数据
function buildEntryData(key, entry) {
  const analysis = analyzeWord(entry.word || key)
  const rootText = analysis.root ? analysis.root.r : (analysis.prefix ? analysis.prefix.a : 'imported')
  const rootMeaningText = analysis.root ? analysis.root.m : (analysis.prefix ? `${analysis.prefix.m} · 前缀` : '四六级词汇 · 已导入')
  const breakdown = analysis.breakdown.length ? analysis.breakdown.join(' + ') : ''

  // 生成情境记忆描述
  let scene = '来自你导入的四六级词汇库。'
  if (analysis.root) {
    scene = `词根「${analysis.root.r}」=「${analysis.root.m}」。把这个画面记住：${entry.meaning || ''}——从词根出发，意思自然浮现。`
  } else if (analysis.prefix) {
    scene = `前缀「${analysis.prefix.a}-」=「${analysis.prefix.m}」。${entry.meaning || ''}——前缀决定了词的方向。`
  } else if (analysis.suffix) {
    scene = `后缀「-${analysis.suffix.a}」=「${analysis.suffix.m}」。${entry.meaning || ''}——后缀提示了词性。`
  }

  return {
    word: entry.word || key,
    phonetic: entry.phonetic || '',
    stress: '按音节自然重读',
    meaning: entry.meaning || '根据语境理解',
    root: rootText,
    rootMeaning: rootMeaningText,
    breakdown,
    scene,
    example: entry.example || '',
    tag: entry.tag || (entry.level === 6 ? '六级词汇' : entry.level === 4 ? '四级词汇' : '四六级词汇'),
  }
}

function ClickableText({ text, saved, setSelectedWord }) {
  return text.split(/(\\b[A-Za-z][A-Za-z’'-]*\\b)/g).map((part, index) => {
    const key = wordKey(part)
    if (!key || !/[A-Za-z]/.test(part)) return <React.Fragment key={index}>{part}</React.Fragment>
    return <button key={index} className={saved.includes(key) ? 'word-mark saved' : 'word-mark'} onClick={() => setSelectedWord(key)}>{part}</button>
  })
}

// 把正文段落按单词渲染：所有单词可单击查释义；已标记的单词加高亮 + 括号中文释义
function ArticleText({ text, marks, setSelectedWord, extraDict }) {
  const tokens = text.split(/(\b[A-Za-z][A-Za-z’'-]*\b)/g)
  return tokens.map((token, index) => {
    if (!/[A-Za-z]/.test(token)) return <React.Fragment key={index}>{token}</React.Fragment>
    const key = wordKey(token)
    const mark = marks.find(m => m.key === key)
    const meaning = (wordData[key] && wordData[key].meaning) || (extraDict && extraDict[key] && extraDict[key].meaning) || basicMeanings[key] || ''
    if (mark) {
      return (
        <span key={index} className={`hl-mark ${mark.color}`}>
          <span className="hl-word" onClick={(e) => { e.stopPropagation(); setSelectedWord(key) }}>{token}</span>
          {meaning && <span className="hl-cn">（{meaning}）</span>}
        </span>
      )
    }
    return <span key={index} className="clickable-word" onClick={(e) => { e.stopPropagation(); setSelectedWord(key) }}>{token}</span>
  })
}

// 根据连续学习天数返回火焰样式（天数越高越旺越大越红）
function getFlameProps(streak) {
  const s = Math.max(0, streak || 0)
  const size = Math.min(36, 14 + s * 0.8)
  let color = '#fbbf24'
  if (s >= 30) color = '#dc2626'
  else if (s >= 15) color = '#ef4444'
  else if (s >= 8) color = '#f97316'
  else if (s >= 4) color = '#f59e0b'
  let burnClass = 'flame-calm'
  if (s >= 30) burnClass = 'flame-fury'
  else if (s >= 15) burnClass = 'flame-blaze'
  else if (s >= 7) burnClass = 'flame-dance'
  const glow = s >= 15 ? `0 0 ${Math.min(20, s * 0.5)}px ${color}66` : 'none'
  return { size, color, burnClass, glow }
}

// 通用图标等级系统：根据数值返回大小/颜色/动画/光晕
// type: trophy(奖杯/单词) | clock(时钟/阅读) | zap(闪电/XP) | flame(火焰/天数)
function getIconProps(type, value) {
  const v = Math.max(0, value || 0)
  // 各类型的等级阈值
  const thresholds = {
    trophy: [10, 50, 200, 500],      // 单词数
    clock: [1, 5, 20, 50],             // 阅读小时
    zap: [100, 500, 2000, 5000],       // XP
    flame: [4, 8, 15, 30],              // 天数
  }
  const colors = {
    trophy: ['#cd7f32', '#c0c0c0', '#f59e0b', '#fbbf24', '#a855f7'],  // 铜→银→金→亮金→紫(传说)
    clock: ['#9ca3af', '#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b'],     // 灰→蓝→青→紫→金
    zap: ['#fbbf24', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],        // 黄→橙→红→紫→粉
    flame: ['#fbbf24', '#f59e0b', '#f97316', '#ef4444', '#dc2626'],      // 黄→橙→深橙→红→深红
  }
  const labels = {
    trophy: ['入门', '初级', '中级', '高级', '大师'],
    clock: ['入门', '初级', '中级', '高级', '大师'],
    zap: ['入门', '初级', '中级', '高级', '大师'],
    flame: ['初燃', '渐旺', '跳动', '燃烧', '狂暴'],
  }
  const thresh = thresholds[type] || [10, 50, 200, 500]
  let level = 0
  for (let i = 0; i < thresh.length; i++) {
    if (v >= thresh[i]) level = i + 1
  }
  const color = colors[type][level]
  const size = 18 + level * 4  // 18→22→26→30→34
  const animClass = level >= 4 ? 'icon-legendary' : level >= 3 ? 'icon-advanced' : level >= 2 ? 'icon-intermediate' : level >= 1 ? 'icon-beginner' : 'icon-starter'
  const glow = level >= 3 ? `0 0 ${8 + level * 3}px ${color}88` : 'none'
  return { level, color, size, animClass, glow, label: labels[type][level] }
}

function WelcomePage({ onEnter }) {
  const tags = ['PDF / EPUB 导入', '点词查释义', '词根词缀记忆', '智能记忆反馈', '经验等级系统', '融合阅读', '论文PDF精读']
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [showAppreciate, setShowAppreciate] = useState(false)
  const features = [
    {
      icon: BookOpen,
      tag: '01 · 语境阅读',
      title: '在真实文本中遇见单词',
      desc: '导入 PDF、EPUB 或 TXT，点词即查释义，一键加入生词本。不是孤立地背单词表，而是在文章的语境里自然地记住它们。',
      mockup: 'reading',
    },
    {
      icon: Brain,
      tag: '02 · 词根记忆',
      title: '从根源理解，而不是死记硬背',
      desc: '130 个词根、54 个前缀、28 个后缀，每个词都拆解成"前缀 + 词根 + 后缀"的故事。理解一个词根，就是理解一串单词。',
      mockup: 'roots',
    },
    {
      icon: BarChart3,
      tag: '03 · 记忆反馈',
      title: '每一次进步都看得见',
      desc: '今日、本周、本月记住的单词一目了然。记忆等级从"未记忆"到"已掌握"逐级推进，火焰续火和经验等级让坚持变成习惯。',
      mockup: 'stats',
    },
    {
      icon: Library,
      tag: '04 · 词汇库',
      title: '你的私人单词实验室',
      desc: '所有收藏的单词集中管理，按记忆等级筛选，支持搜索和批量操作。阅读中遇到的每一个生词，都不会被遗忘。',
      mockup: 'words',
    },
    {
      icon: Merge,
      tag: '05 · 融合阅读',
      title: '阅读与词汇，同屏共振',
      desc: '左侧读文章，右侧实时解析生词。点一个词，释义、词根、例句同步呈现，不用在词典和原文之间来回切换。',
      mockup: 'fusion',
    },
    {
      icon: GraduationCap,
      tag: '06 · 论文精读',
      title: '学术论文，也能轻松读',
      desc: '导入 PDF 论文，双栏排版原样保留。专业术语一键查释义，长难句逐词拆解，让读文献不再是负担。',
      mockup: 'paper',
    },
  ]

  const renderMockup = (type) => {
    if (type === 'reading') {
      return <div className="mockup-reading">
        <div className="mockup-bar"><span></span><span></span><span></span></div>
        <div className="mockup-doc">
          <div className="mockup-doc-title">The quiet force of curiosity</div>
          <div className="mockup-lines">
            <div className="mockup-line w-90"></div>
            <div className="mockup-line w-95"><span className="mockup-hl">curiosity</span></div>
            <div className="mockup-line w-85"></div>
            <div className="mockup-line w-92"><span className="mockup-hl">exploration</span></div>
            <div className="mockup-line w-70"></div>
          </div>
          <div className="mockup-tooltip">
            <strong>curiosity</strong> <span>/ˌkjʊəriˈɒsəti/</span>
            <em>好奇心 · cur(care) + ity</em>
          </div>
        </div>
      </div>
    }
    if (type === 'roots') {
      return <div className="mockup-roots">
        <div className="mockup-bar"><span></span><span></span><span></span></div>
        <div className="mockup-root-card">
          <div className="mockup-root-word">
            <span className="root-prefix">im</span><span className="root-main">port</span><span className="root-suffix">ant</span>
          </div>
          <div className="mockup-root-meaning">重要的 · 携带进来的</div>
          <div className="mockup-root-tree">
            <div className="root-node"><b>port</b><span>carry · 携带</span></div>
            <div className="root-children">
              <div className="root-child">im·port<span>进口</span></div>
              <div className="root-child">ex·port<span>出口</span></div>
              <div className="root-child">trans·port<span>运输</span></div>
              <div className="root-child">re·port<span>报告</span></div>
            </div>
          </div>
        </div>
      </div>
    }
    if (type === 'stats') {
      return <div className="mockup-stats">
        <div className="mockup-bar"><span></span><span></span><span></span></div>
        <div className="mockup-stats-grid">
          <div className="mockup-stat-card">
            <div className="mockup-stat-num">12</div>
            <div className="mockup-stat-label">今日记住</div>
          </div>
          <div className="mockup-stat-card">
            <div className="mockup-stat-num">47</div>
            <div className="mockup-stat-label">本周记住</div>
          </div>
          <div className="mockup-stat-card">
            <div className="mockup-stat-num">186</div>
            <div className="mockup-stat-label">本月记住</div>
          </div>
          <div className="mockup-stat-card flame">
            <div className="mockup-stat-num">🔥 15</div>
            <div className="mockup-stat-label">连续天数</div>
          </div>
        </div>
        <div className="mockup-bars">
          <div className="mockup-bar-row"><span>一</span><div className="mockup-bar-fill" style={{width:'60%'}}></div></div>
          <div className="mockup-bar-row"><span>二</span><div className="mockup-bar-fill" style={{width:'80%'}}></div></div>
          <div className="mockup-bar-row"><span>三</span><div className="mockup-bar-fill" style={{width:'45%'}}></div></div>
          <div className="mockup-bar-row"><span>四</span><div className="mockup-bar-fill" style={{width:'90%'}}></div></div>
          <div className="mockup-bar-row"><span>五</span><div className="mockup-bar-fill" style={{width:'70%'}}></div></div>
        </div>
      </div>
    }
    if (type === 'words') {
      return <div className="mockup-words">
        <div className="mockup-bar"><span></span><span></span><span></span></div>
        <div className="mockup-word-list">
          <div className="mockup-word-item">
            <div className="mockup-word-head"><b>curiosity</b><span className="mockup-level l4">已掌握</span></div>
            <div className="mockup-word-phon">/ˌkjʊəriˈɒsəti/ · 好奇心</div>
          </div>
          <div className="mockup-word-item">
            <div className="mockup-word-head"><b>exploration</b><span className="mockup-level l2">记忆中</span></div>
            <div className="mockup-word-phon">/ˌekspləˈreɪʃn/ · 探索</div>
          </div>
          <div className="mockup-word-item">
            <div className="mockup-word-head"><b>perception</b><span className="mockup-level l1">初识</span></div>
            <div className="mockup-word-phon">/pəˈsepʃn/ · 感知</div>
          </div>
          <div className="mockup-word-item">
            <div className="mockup-word-head"><b>resilient</b><span className="mockup-level l0">未记忆</span></div>
            <div className="mockup-word-phon">/rɪˈzɪliənt/ · 有韧性的</div>
          </div>
        </div>
      </div>
    }
    if (type === 'fusion') {
      return <div className="mockup-fusion">
        <div className="mockup-bar"><span></span><span></span><span></span></div>
        <div className="mockup-fusion-body">
          <div className="mockup-fusion-left">
            <div className="mockup-doc-title">Deep Learning Survey</div>
            <div className="mockup-lines">
              <div className="mockup-line w-90"></div>
              <div className="mockup-line w-85"><span className="mockup-hl">neural</span></div>
              <div className="mockup-line w-92"></div>
              <div className="mockup-line w-78"><span className="mockup-hl">gradient</span></div>
              <div className="mockup-line w-88"></div>
            </div>
          </div>
          <div className="mockup-fusion-right">
            <div className="mockup-fusion-word">
              <b>neural</b><span>/ˈnjʊərəl/</span>
              <em>神经的 · neur(神经) + al</em>
            </div>
            <div className="mockup-fusion-word">
              <b>gradient</b><span>/ˈɡreɪdiənt/</span>
              <em>梯度 · grad(步) + ient</em>
            </div>
            <div className="mockup-fusion-save">＋ 加入生词本</div>
          </div>
        </div>
      </div>
    }
    if (type === 'paper') {
      return <div className="mockup-paper">
        <div className="mockup-bar"><span></span><span></span><span></span></div>
        <div className="mockup-paper-body">
          <div className="mockup-paper-title">Attention Is All You Need</div>
          <div className="mockup-paper-meta">Ashish Vaswani et al. · NeurIPS 2017</div>
          <div className="mockup-paper-abstract">
            <div className="mockup-line w-100"></div>
            <div className="mockup-line w-95"></div>
            <div className="mockup-line w-88"></div>
          </div>
          <div className="mockup-paper-columns">
            <div className="mockup-paper-col">
              <div className="mockup-line w-90"></div>
              <div className="mockup-line w-85"><span className="mockup-hl">attention</span></div>
              <div className="mockup-line w-92"></div>
              <div className="mockup-line w-78"></div>
            </div>
            <div className="mockup-paper-col">
              <div className="mockup-line w-88"></div>
              <div className="mockup-line w-92"></div>
              <div className="mockup-line w-80"><span className="mockup-hl">transformer</span></div>
              <div className="mockup-line w-85"></div>
            </div>
          </div>
          <div className="mockup-tooltip">
            <strong>attention</strong> <span>/əˈtenʃn/</span>
            <em>注意力 · at(向) + tent(伸展) + ion</em>
          </div>
        </div>
      </div>
    }
    return null
  }

  return <div className="welcome-page">
    {/* Hero */}
    <section className="welcome-hero">
      <div className="welcome-hero-bg">
        <div className="welcome-orb orb-1" />
        <div className="welcome-orb orb-2" />
        <div className="welcome-grid" />
      </div>
      <div className="welcome-hero-inner">
        <div className="welcome-hero-copy">
        <div className="welcome-brand">
          <div className="welcome-brand-mark"><span></span><span></span><span></span></div>
          <span className="welcome-brand-name">lingua<span>.</span>lab</span>
        </div>
        <h1 className="welcome-title">把理解<br />变成<i>直觉</i></h1>
        <p className="welcome-subtitle">语境记忆 · 词根驱动 · 数据反馈</p>
        <div className="welcome-tags">
          {tags.map((t, i) => <span key={i} className="welcome-tag">{t}</span>)}
        </div>
        <div className="welcome-actions">
          <div className="welcome-secondary-actions">
            <button className="welcome-mini-btn" onClick={() => { setShowFeedback(true); setFeedbackSent(false); setFeedbackText('') }}><MessageSquare size={14} /> 使用反馈</button>
            <button className="welcome-mini-btn welcome-mini-btn-primary" onClick={() => setShowAppreciate(true)}><Heart size={14} /> 赞赏</button>
          </div>
          <button className="welcome-enter-btn" onClick={onEnter}>
            进入体验 <ArrowUpRight size={18} />
          </button>
        </div>
        <div className="welcome-scroll-hint">
          <span>向下滚动了解更多</span>
          <div className="welcome-scroll-line" />
        </div>
        </div>
        <WelcomeQrCard variant="hero" />
      </div>
    </section>

    {/* Features */}
    <section className="welcome-features-section">
      <div className="welcome-section-head">
        <span className="welcome-section-label">核心功能</span>
        <h2 className="welcome-section-title">六个模块，一条学习路径</h2>
        <p className="welcome-section-desc">从阅读中发现生词，用词根理解词义，用反馈巩固记忆，用词汇库管理一切。</p>
      </div>
      {features.map((f, i) => {
        const Icon = f.icon
        return (
          <div key={i} className={`welcome-feature-row ${i % 2 ? 'reverse' : ''}`}>
            <div className="welcome-feature-text">
              <span className="welcome-feature-tag">{f.tag}</span>
              <h3 className="welcome-feature-title">{f.title}</h3>
              <p className="welcome-feature-desc">{f.desc}</p>
              <div className="welcome-feature-icon-inline"><Icon size={22} /></div>
            </div>
            <div className="welcome-feature-visual">{renderMockup(f.mockup)}</div>
          </div>
        )
      })}
    </section>

    {/* Philosophy */}
    <section className="welcome-philosophy">
      <div className="welcome-philosophy-inner">
        <span className="welcome-section-label">设计理念</span>
        <h2 className="welcome-philosophy-title">不是又一个背单词 App</h2>
        <p className="welcome-philosophy-text">
          大多数英语学习工具把单词从语境中抽离出来，让你对着卡片反复背诵。Lingua Lab 相信另一种方式：
          单词应该在你真正阅读的文本里被遇见，在词根的故事里被理解，在持续的反馈中被巩固。
        </p>
        <button className="welcome-enter-btn welcome-enter-bottom" onClick={onEnter}>
          开始学习 <ArrowUpRight size={18} />
        </button>
        <WelcomeQrCard variant="dark" />
      </div>
    </section>

    {/* 反馈弹窗 */}
    {showFeedback && createPortal(<div className="login-modal-overlay" onClick={() => setShowFeedback(false)}>
      <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="login-modal-close" onClick={() => setShowFeedback(false)}><X size={18} /></button>
        <div className="login-brand">
          <div className="login-brand-mark"><span></span><span></span><span></span></div>
          <span className="login-brand-name">lingua<span>.</span>lab</span>
        </div>
        {feedbackSent ? (
          <div className="forgot-success" style={{paddingTop: 10}}>
            <div className="forgot-success-icon"><CheckCircle size={40} /></div>
            <h3>感谢你的反馈！</h3>
            <p>我们会认真阅读每一条建议</p>
            <button className="login-submit" onClick={() => setShowFeedback(false)}>关闭</button>
          </div>
        ) : (
          <>
            <h2 className="login-title">使用反馈</h2>
            <p className="login-subtitle">遇到问题或有建议？告诉我们，让 Lingua Lab 变得更好</p>
            <div className="login-field">
              <label>反馈内容</label>
              <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="请描述你遇到的问题或改进建议..." rows={5} style={{width: '100%', padding: '12px 14px', border: '1px solid #e0d5da', borderRadius: '10px', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', outline: 'none'}} onFocus={(e) => e.target.style.borderColor = '#df8f91'} onBlur={(e) => e.target.style.borderColor = '#e0d5da'} />
            </div>
            <button className="login-submit" disabled={!feedbackText.trim()} onClick={() => {
              try {
                const list = JSON.parse(localStorage.getItem('ll_feedback') || '[]')
                list.push({ text: feedbackText, time: new Date().toISOString() })
                localStorage.setItem('ll_feedback', JSON.stringify(list))
              } catch (e) {}
              setFeedbackSent(true)
            }}>提交反馈</button>
          </>
        )}
      </div>
    </div>, document.body)}

    {/* 赞赏弹窗 */}
    {showAppreciate && createPortal(<div className="login-modal-overlay" onClick={() => setShowAppreciate(false)}>
      <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="login-modal-close" onClick={() => setShowAppreciate(false)}><X size={18} /></button>
        <div className="login-brand">
          <div className="login-brand-mark"><span></span><span></span><span></span></div>
          <span className="login-brand-name">lingua<span>.</span>lab</span>
        </div>
        <h2 className="login-title">赞赏支持</h2>
        <p className="login-subtitle">如果 Lingua Lab 对你有帮助，欢迎请开发者喝杯咖啡</p>
        <div className="appreciate-body">
          <div className="appreciate-icon"><Heart size={36} fill="#df8f91" color="#df8f91" /></div>
          <p className="appreciate-text">你的每一份支持，都是持续更新的动力</p>
          <div className="appreciate-ways">
            <div className="appreciate-way">
              <span className="appreciate-way-label">微信赞赏</span>
              <div className="appreciate-qrcode-placeholder">扫码赞赏</div>
            </div>
            <div className="appreciate-way">
              <span className="appreciate-way-label">支付宝</span>
              <div className="appreciate-qrcode-placeholder">扫码赞赏</div>
            </div>
          </div>
          <p className="appreciate-tip">赞赏码可在「学习设置」中替换为你的收款码</p>
        </div>
        <button className="login-submit" onClick={() => setShowAppreciate(false)}>关闭</button>
      </div>
    </div>, document.body)}

    <footer className="welcome-footer">
      <span>Lingua Lab · 英语学习实验室 · 数据保存在本地浏览器</span>
    </footer>
  </div>
}

// 简单哈希（本地应用，非安全用途）
function simpleHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return h.toString(36)
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem('ll_users') || '{}') } catch (e) { return {} }
}
function saveUsers(users) {
  try { localStorage.setItem('ll_users', JSON.stringify(users)) } catch (e) {}
}
function getCurrentUser() {
  try { return localStorage.getItem('ll_current_user') || '' } catch (e) { return '' }
}

function LoginModal({ onLogin, onClose }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // 忘记密码
  const [forgotStep, setForgotStep] = useState(1)
  const [resetCode, setResetCode] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  const resetForgot = () => {
    setForgotStep(1); setResetCode(''); setCodeInput('')
    setNewPassword(''); setConfirmNewPassword(''); setResetSuccess(false); setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const em = email.trim().toLowerCase()
    const nm = nickname.trim()
    if (!em) { setError('请输入邮箱'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setError('请输入有效的邮箱地址'); return }
    if (mode === 'register') {
      if (!nm) { setError('请输入昵称'); return }
      if (nm.length < 2) { setError('昵称至少 2 个字符'); return }
      if (nm.length > 20) { setError('昵称最多 20 个字符'); return }
    }
    if (!password) { setError('请输入密码'); return }
    if (password.length < 4) { setError('密码至少 4 个字符'); return }
    setLoading(true)
    setTimeout(() => {
      const users = getUsers()
      if (mode === 'register') {
        if (password !== confirm) { setError('两次输入的密码不一致'); setLoading(false); return }
        if (users[em]) { setError('该邮箱已被注册'); setLoading(false); return }
        users[em] = { password: simpleHash(password), name: nm }
        saveUsers(users)
        try { localStorage.setItem('ll_current_user', em); localStorage.setItem('ll_current_user_name', nm) } catch (e) {}
        onLogin(em, nm)
      } else {
        if (!users[em]) { setError('邮箱未注册，请先注册'); setLoading(false); return }
        const rec = users[em]
        const storedPwd = typeof rec === 'string' ? rec : rec.password
        const storedName = typeof rec === 'string' ? em.split('@')[0] : rec.name
        if (storedPwd !== simpleHash(password)) { setError('密码错误'); setLoading(false); return }
        try { localStorage.setItem('ll_current_user', em); localStorage.setItem('ll_current_user_name', storedName) } catch (e) {}
        onLogin(em, storedName)
      }
    }, 400)
  }

  // 忘记密码 - 第一步：发送验证码
  const handleSendCode = (e) => {
    e.preventDefault()
    setError('')
    const em = email.trim().toLowerCase()
    if (!em) { setError('请输入邮箱'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setError('请输入有效的邮箱地址'); return }
    const users = getUsers()
    if (!users[em]) { setError('该邮箱未注册'); return }
    setLoading(true)
    setTimeout(() => {
      const code = String(Math.floor(100000 + Math.random() * 900000))
      setResetCode(code)
      setForgotStep(2)
      setLoading(false)
    }, 500)
  }

  // 忘记密码 - 第二步：验证验证码
  const handleVerifyCode = (e) => {
    e.preventDefault()
    setError('')
    if (!codeInput.trim()) { setError('请输入验证码'); return }
    if (codeInput.trim() !== resetCode) { setError('验证码错误，请重新输入'); return }
    setForgotStep(3)
  }

  // 忘记密码 - 第三步：重置密码
  const handleResetPassword = (e) => {
    e.preventDefault()
    setError('')
    if (!newPassword) { setError('请输入新密码'); return }
    if (newPassword.length < 4) { setError('密码至少 4 个字符'); return }
    if (newPassword !== confirmNewPassword) { setError('两次输入的密码不一致'); return }
    setLoading(true)
    setTimeout(() => {
      const em = email.trim().toLowerCase()
      const users = getUsers()
      if (users[em]) {
        const rec = users[em]
        const name = typeof rec === 'string' ? em.split('@')[0] : rec.name
        users[em] = { password: simpleHash(newPassword), name }
        saveUsers(users)
      }
      setResetSuccess(true)
      setLoading(false)
    }, 500)
  }

  const goBackToLogin = () => { setMode('login'); resetForgot(); setEmail(''); setPassword('') }

  return createPortal(<div className="login-modal-overlay" onClick={onClose}>
    <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
      <button className="login-modal-close" onClick={onClose}><X size={18} /></button>
      <div className="login-brand">
        <div className="login-brand-mark"><span></span><span></span><span></span></div>
        <span className="login-brand-name">lingua<span>.</span>lab</span>
      </div>

      {mode === 'forgot' ? (
        <>
          <h2 className="login-title">重置密码</h2>
          <p className="login-subtitle">通过注册邮箱验证后设置新密码</p>

          {/* 步骤指示器 */}
          <div className="forgot-steps">
            <div className={`forgot-step ${forgotStep >= 1 ? 'active' : ''}`}>1 邮箱</div>
            <div className={`forgot-step-line ${forgotStep >= 2 ? 'active' : ''}`} />
            <div className={`forgot-step ${forgotStep >= 2 ? 'active' : ''}`}>2 验证</div>
            <div className={`forgot-step-line ${forgotStep >= 3 ? 'active' : ''}`} />
            <div className={`forgot-step ${forgotStep >= 3 ? 'active' : ''}`}>3 新密码</div>
          </div>

          {resetSuccess ? (
            <div className="forgot-success">
              <div className="forgot-success-icon"><CheckCircle size={40} /></div>
              <h3>密码重置成功</h3>
              <p>请使用新密码登录</p>
              <button className="login-submit" onClick={goBackToLogin}>返回登录</button>
            </div>
          ) : (
            <>
              {forgotStep === 1 && (
                <form className="login-form" onSubmit={handleSendCode}>
                  <div className="login-field">
                    <label>注册邮箱</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入注册时的邮箱" autoComplete="email" />
                  </div>
                  {error && <div className="login-error">{error}</div>}
                  <button type="submit" className="login-submit" disabled={loading}>
                    {loading ? '发送中…' : '发送验证码'}
                  </button>
                </form>
              )}

              {forgotStep === 2 && (
                <form className="login-form" onSubmit={handleVerifyCode}>
                  <div className="login-field">
                    <label>验证码</label>
                    <input type="text" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="请输入6位验证码" maxLength={6} autoComplete="one-time-code" />
                  </div>
                  <div className="forgot-code-hint">
                    <span>验证码已发送至 {email}</span>
                    <span className="forgot-code-demo">本地演示验证码：<b>{resetCode}</b></span>
                  </div>
                  {error && <div className="login-error">{error}</div>}
                  <button type="submit" className="login-submit" disabled={loading}>验证</button>
                  <button type="button" className="forgot-resend" onClick={() => { const code = String(Math.floor(100000 + Math.random() * 900000)); setResetCode(code); setCodeInput('') }}>重新发送验证码</button>
                </form>
              )}

              {forgotStep === 3 && (
                <form className="login-form" onSubmit={handleResetPassword}>
                  <div className="login-field">
                    <label>新密码</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="请输入新密码（至少4位）" autoComplete="new-password" />
                  </div>
                  <div className="login-field">
                    <label>确认新密码</label>
                    <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="请再次输入新密码" autoComplete="new-password" />
                  </div>
                  {error && <div className="login-error">{error}</div>}
                  <button type="submit" className="login-submit" disabled={loading}>
                    {loading ? '重置中…' : '确认重置'}
                  </button>
                </form>
              )}

              <div className="login-footer-note">
                <button onClick={goBackToLogin}>← 返回登录</button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <h2 className="login-title">{mode === 'login' ? '登录解锁功能' : '创建账号'}</h2>
          <p className="login-subtitle">{mode === 'login' ? '登录后即可收藏单词、标记记忆、导入文档' : '注册后解锁全部学习功能'}</p>
          <div className="login-tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>登录</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError('') }}>注册</button>
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label>邮箱</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="请输入邮箱地址" autoComplete="email" />
            </div>
            {mode === 'register' && (
              <div className="login-field">
                <label>昵称</label>
                <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="给自己起个名字" autoComplete="nickname" maxLength={20} />
              </div>
            )}
            <div className="login-field">
              <label>密码</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>
            {mode === 'register' && (
              <div className="login-field">
                <label>确认密码</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="请再次输入密码" autoComplete="new-password" />
              </div>
            )}
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? '请稍候…' : (mode === 'login' ? '登 录' : '注 册')}
            </button>
          </form>
          <div className="login-footer-note">
            {mode === 'login' ? (
              <span>还没有账号？<button onClick={() => { setMode('register'); setError('') }}>立即注册</button></span>
            ) : (
              <span>已有账号？<button onClick={() => { setMode('login'); setError('') }}>去登录</button></span>
            )}
          </div>
          {mode === 'login' && (
            <div className="login-forgot-link">
              <button onClick={() => { setMode('forgot'); resetForgot(); setError('') }}>忘记密码？</button>
            </div>
          )}
        </>
      )}
    </div>
  </div>, document.body)
}

function App() {
  const [showWelcome, setShowWelcome] = useState(() => {
    try { return localStorage.getItem('skip_welcome') !== '1' } catch (e) { return true }
  })
  const [active, setActive] = useState('dashboard')
  const [saved, setSaved] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('vocab_saved') || '')
      return Array.isArray(stored) && stored.length ? stored : ['curiosity', 'important']
    } catch (e) { return ['curiosity', 'important'] }
  })
  const [selectedWord, setSelectedWord] = useState(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try { return !!localStorage.getItem('ll_current_user') } catch (e) { return false }
  })
  const [currentUser, setCurrentUser] = useState(() => {
    try { return localStorage.getItem('ll_current_user') || '' } catch (e) { return '' }
  })
  const [currentUserName, setCurrentUserName] = useState(() => {
    try { return localStorage.getItem('ll_current_user_name') || '' } catch (e) { return '' }
  })
  const [showLogin, setShowLogin] = useState(false)
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [importedVocab, setImportedVocab] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vocab_imported') || '{}') } catch (e) { return {} }
  })
  // 阅读难词（收藏词卡）持久化：保存从阅读加入词汇库时的完整词卡数据
  const [readingVocab, setReadingVocab] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vocab_reading') || '{}') } catch (e) { return {} }
  })
  // 记忆等级：0=未记忆, 1=第一次记忆, 2=第二次, 3=第三次, 4=已掌握
  const [memoryLevels, setMemoryLevels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vocab_memory') || '{}') } catch (e) { return {} }
  })
  // 词根词缀记忆等级：0=未记忆, 1=第一次记忆, 2=第二次, 3=第三次, 4=已掌握
  const [rootMemoryLevels, setRootMemoryLevels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('root_memory') || '{}') } catch (e) { return {} }
  })
  // 记忆历史：{ 'YYYY-MM-DD': ['wordKey1', 'wordKey2', ...] }，记录每个单词首次被记住（等级0→1）的日期
  const [memorizeHistory, setMemorizeHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('memorize_history') || '{}') } catch (e) { return {} }
  })
  // 阅读时长（秒）：在阅读/融合阅读页面时累计
  const [readingSeconds, setReadingSeconds] = useState(() => {
    try { return parseInt(localStorage.getItem('reading_seconds') || '0', 10) } catch (e) { return 0 }
  })
  // 已读文章数
  const [articlesRead, setArticlesRead] = useState(() => {
    try { return parseInt(localStorage.getItem('articles_read') || '0', 10) } catch (e) { return 0 }
  })
  // 每日学习数据：{ 'YYYY-MM-DD': { words: 新掌握单词数, minutes: 阅读分钟, xp: XP, saved: 收藏数 } }
  const [dailyStats, setDailyStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem('daily_stats') || '{}') } catch (e) { return {} }
  })
  const todayKey = localDateKey()
  const yesterdayKey = localDateKey(new Date(Date.now() - 86400000))

  // 火焰状态：连续天数、最后活跃日期、等级、是否中断、中断天数、今日需记单词数
  const [flameState, setFlameState] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('flame_state') || '{}')
      return {
        streak: saved.streak ?? 12,
        lastActiveDate: saved.lastActiveDate || todayKey,
        level: saved.level ?? 2,
        isBroken: saved.isBroken ?? false,
        brokenDays: saved.brokenDays ?? 0,
        wordsNeededToday: saved.wordsNeededToday ?? 3,
      }
    } catch (e) {
      return { streak: 12, lastActiveDate: todayKey, level: 2, isBroken: false, brokenDays: 0, wordsNeededToday: 3 }
    }
  })

  // 计算今日需记单词数：基础3 + 连续天数/5，中断后×1.5（需要更多单词才能续火）
  const calcWordsNeeded = (streak, isBroken) => {
    const base = 3 + Math.floor(streak / 5)
    return isBroken ? Math.ceil(base * 1.5) : base
  }

  // 应用启动时检查火焰状态：昨天没活跃则中断，连续5天不续则降级
  useEffect(() => {
    setFlameState(prev => {
      const last = prev.lastActiveDate
      const daysDiff = Math.floor((new Date(todayKey) - new Date(last)) / 86400000)
      let next = { ...prev }
      // 昨天及之前都没活跃 → 中断
      if (daysDiff > 1 && !prev.isBroken) {
        next.isBroken = true
        next.brokenDays = daysDiff - 1
      } else if (prev.isBroken) {
        next.brokenDays = prev.brokenDays + (daysDiff > 1 ? 1 : 0)
      }
      // 连续5天不续 → 降级（等级-1，连续天数减半，中断重置）
      if (next.brokenDays >= 5) {
        next.level = Math.max(0, next.level - 1)
        next.streak = Math.floor(next.streak / 2)
        next.brokenDays = 0
        next.isBroken = false
        next.lastActiveDate = todayKey
      }
      // 更新今日需记单词数
      next.wordsNeededToday = calcWordsNeeded(next.streak, next.isBroken)
      return next
    })
  }, [])

  // 火焰状态持久化
  useEffect(() => {
    try { localStorage.setItem('flame_state', JSON.stringify(flameState)) } catch (e) { /* ignore */ }
  }, [flameState])

  // 检查今日是否已达标（新掌握单词数 >= 今日需记单词数）
  const todayWords = dailyStats[todayKey]?.words || 0
  const todayMetThreshold = todayWords >= flameState.wordsNeededToday
  // 顶栏「今日目标」完成度：按今日续火进度计算
  const todayGoalPct = Math.min(100, Math.round((todayWords / Math.max(1, flameState.wordsNeededToday)) * 100))

  // 当今日达标时，续火（连续天数+1，中断清除）
  useEffect(() => {
    if (todayMetThreshold && flameState.lastActiveDate !== todayKey) {
      setFlameState(prev => ({
        ...prev,
        streak: prev.isBroken ? prev.streak : prev.streak + 1,
        lastActiveDate: todayKey,
        isBroken: false,
        brokenDays: 0,
        level: Math.min(5, prev.level + (prev.streak > 0 && prev.streak % 10 === 0 ? 1 : 0)),
        wordsNeededToday: calcWordsNeeded(prev.isBroken ? prev.streak : prev.streak + 1, false),
      }))
    }
  }, [todayMetThreshold])

  // 记录当天新掌握的单词（memoryLevels 达到4时）
  const prevMasteredRef = useRef(Object.keys(memoryLevels).filter(k => memoryLevels[k] >= 4).length)
  useEffect(() => {
    const masteredNow = Object.keys(memoryLevels).filter(k => memoryLevels[k] >= 4).length
    const newMastered = Math.max(0, masteredNow - prevMasteredRef.current)
    if (newMastered > 0) {
      setDailyStats(prev => {
        const today = prev[todayKey] || { words: 0, minutes: 0, xp: 0, saved: 0 }
        return { ...prev, [todayKey]: { ...today, words: today.words + newMastered } }
      })
    }
    prevMasteredRef.current = masteredNow
  }, [memoryLevels, todayKey])

  // 记录当天阅读分钟（每满1分钟更新）
  const prevMinutesRef = useRef(0)
  useEffect(() => {
    const mins = Math.floor(readingSeconds / 60)
    const newMins = Math.max(0, mins - prevMinutesRef.current)
    if (newMins > 0) {
      setDailyStats(prev => {
        const today = prev[todayKey] || { words: 0, minutes: 0, xp: 0, saved: 0 }
        return { ...prev, [todayKey]: { ...today, minutes: today.minutes + newMins } }
      })
    }
    prevMinutesRef.current = mins
  }, [readingSeconds, todayKey])

  // 记录当天收藏单词
  const prevSavedRef = useRef(saved.length)
  useEffect(() => {
    const newSaved = Math.max(0, saved.length - prevSavedRef.current)
    if (newSaved > 0) {
      setDailyStats(prev => {
        const today = prev[todayKey] || { words: 0, minutes: 0, xp: 0, saved: 0 }
        return { ...prev, [todayKey]: { ...today, saved: today.saved + newSaved } }
      })
    }
    prevSavedRef.current = saved.length
  }, [saved, todayKey])

  // 每日数据持久化
  useEffect(() => {
    try { localStorage.setItem('daily_stats', JSON.stringify(dailyStats)) } catch (e) { /* ignore */ }
  }, [dailyStats])

  // 导入词库持久化
  useEffect(() => {
    try { localStorage.setItem('vocab_imported', JSON.stringify(importedVocab)) } catch (e) { /* ignore */ }
  }, [importedVocab])

  // 首次启动预置四六级词库（public/imported_vocab.json，约 2000 词）；用户已导入过则跳过
  useEffect(() => {
    let cancelled = false
    try {
      if (localStorage.getItem('vocab_preloaded') === '1') return
      if (Object.keys(importedVocab).length > 0) { try { localStorage.setItem('vocab_preloaded', '1') } catch (e) {} ; return }
    } catch (e) { /* ignore */ }
    fetch('/imported_vocab.json').then((res) => (res.ok ? res.json() : null)).then((dict) => {
      if (cancelled || !dict || !Object.keys(dict).length) return
      setImportedVocab(dict)
      try { localStorage.setItem('vocab_preloaded', '1') } catch (e) { /* ignore */ }
    }).catch(() => { /* 预置词库加载失败时静默，不影响手动导入 */ })
    return () => { cancelled = true }
  }, [])

  // 阅读难词持久化
  useEffect(() => {
    try { localStorage.setItem('vocab_reading', JSON.stringify(readingVocab)) } catch (e) { /* ignore */ }
  }, [readingVocab])

  // 阅读难词（收藏）持久化：加入词汇库的词刷新不丢失
  useEffect(() => {
    try { localStorage.setItem('vocab_saved', JSON.stringify(saved)) } catch (e) { /* ignore */ }
  }, [saved])

  // 记忆等级持久化
  useEffect(() => {
    try { localStorage.setItem('vocab_memory', JSON.stringify(memoryLevels)) } catch (e) { /* ignore */ }
  }, [memoryLevels])

  // 词根词缀记忆等级持久化
  useEffect(() => {
    try { localStorage.setItem('root_memory', JSON.stringify(rootMemoryLevels)) } catch (e) { /* ignore */ }
  }, [rootMemoryLevels])

  // 记忆历史持久化
  useEffect(() => {
    try { localStorage.setItem('memorize_history', JSON.stringify(memorizeHistory)) } catch (e) { /* ignore */ }
  }, [memorizeHistory])

  // 阅读时长持久化
  useEffect(() => {
    try { localStorage.setItem('reading_seconds', String(readingSeconds)) } catch (e) { /* ignore */ }
  }, [readingSeconds])

  // 已读文章数持久化
  useEffect(() => {
    try { localStorage.setItem('articles_read', String(articlesRead)) } catch (e) { /* ignore */ }
  }, [articlesRead])

  // 阅读计时器：在阅读/融合阅读页面时每秒累计
  useEffect(() => {
    if (active !== 'read' && active !== 'fusion') return
    const timer = setInterval(() => setReadingSeconds(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [active])

  // 标记单词为已记忆（等级 +1，最高 4=已掌握）
  const markMemorized = (key) => {
    if (!requireLogin()) return
    setMemoryLevels(prev => {
      const current = prev[key] || 0
      if (current >= 4) return prev
      const next = current + 1
      setToast(next >= 4 ? '🎉 已掌握！' : `已进入第 ${next} 次记忆`)
      // 记录当天记忆次数（标记为记忆就算一次）
      setDailyStats(prevStats => {
        const today = prevStats[todayKey] || { words: 0, minutes: 0, xp: 0, saved: 0, memorized: 0 }
        return { ...prevStats, [todayKey]: { ...today, memorized: (today.memorized || 0) + 1 } }
      })
      // 首次记住（等级0→1）时，记录到记忆历史
      if (current === 0) {
        setMemorizeHistory(prevHist => {
          const dayList = prevHist[todayKey] || []
          if (dayList.includes(key)) return prevHist
          return { ...prevHist, [todayKey]: [...dayList, key] }
        })
      }
      return { ...prev, [key]: next }
    })
  }

  // 标记词根词缀为已记忆（等级 +1，最高 4=已掌握）
  const markRootMemorized = (form) => {
    if (!requireLogin()) return
    setRootMemoryLevels(prev => {
      const current = prev[form] || 0
      if (current >= 4) return prev
      const next = current + 1
      setToast(next >= 4 ? '🎉 词根已掌握！' : `词根进入第 ${next} 次记忆`)
      setDailyStats(prevStats => {
        const today = prevStats[todayKey] || { words: 0, minutes: 0, xp: 0, saved: 0, memorized: 0, rootsMemorized: 0 }
        return { ...prevStats, [todayKey]: { ...today, rootsMemorized: (today.rootsMemorized || 0) + 1 } }
      })
      return { ...prev, [form]: next }
    })
  }

  const addImported = (dict) => setImportedVocab(prev => ({ ...prev, ...dict }))

  const removeImported = (key) => setImportedVocab(prev => {
    const next = { ...prev }
    delete next[key]
    return next
  })

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  const toggleSave = (key, cardData) => {
    if (!requireLogin()) return
    const exists = saved.includes(key)
    setSaved(exists ? saved.filter((item) => item !== key) : [...saved, key])
    if (exists) {
      setReadingVocab(prev => { const n = { ...prev }; delete n[key]; return n })
    } else if (cardData) {
      setReadingVocab(prev => ({ ...prev, [key]: cardData }))
    }
    setToast(exists ? '已从词汇库移除' : '已加入词汇库，稍后情景复习')
  }

  const renderPage = () => {
    if (active === 'dashboard') return <DashboardPage {...{ saved, memoryLevels, rootMemoryLevels, importedVocab, readingSeconds, articlesRead, dailyStats, todayKey, yesterdayKey, flameState, todayWords, todayMetThreshold, setActive, setToast, isLoggedIn, currentUser, currentUserName, onLogout: handleLogout, onShowLogin: () => setShowLogin(true) }} />
    if (active === 'read') return <ReadingPage {...{ selectedWord, setSelectedWord, saved, toggleSave, setToast, importedVocab, memoryLevels, markMemorized, onArticleStart: () => setArticlesRead(n => n + 1) }} />
    if (active === 'fusion') return <FusionPage {...{ saved, toggleSave, setToast, importedVocab }} />
    if (active === 'words') return <WordsPage {...{ saved, toggleSave, importedVocab, readingVocab, addImported, removeImported, setToast, memoryLevels, markMemorized }} />
    if (active === 'roots') return <RootsPage {...{ setToast, rootMemoryLevels, markRootMemorized }} />
    if (active === 'shows') return <ShowsPage />
    return <TodayPage {...{ setActive, saved, setToast, flameState, dailyStats, todayKey, readingSeconds, memoryLevels, todayWords, todayMetThreshold, memorizeHistory, importedVocab }} />
  }

  if (showWelcome) {
    return <WelcomePage onEnter={() => setShowWelcome(false)} />
  }
  const requireLogin = () => {
    if (!isLoggedIn) { setShowLogin(true); return false }
    return true
  }
  const handleLogout = () => {
    try { localStorage.removeItem('ll_current_user'); localStorage.removeItem('ll_current_user_name') } catch (e) {}
    setIsLoggedIn(false)
    setCurrentUser('')
    setCurrentUserName('')
    setShowLogin(false)
  }
  const handleLoginSuccess = (user, name) => {
    setCurrentUser(user)
    setCurrentUserName(name || user.split('@')[0])
    setIsLoggedIn(true)
    setShowLogin(false)
  }
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><span></span><span></span><span></span></div><div><strong>lingua<span>.</span>lab</strong><small>英语学习实验室</small></div></div>
      <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}><Menu size={20} /></button>
      <div className="nav-label">学习空间</div>
      <nav className={sidebarCollapsed ? 'collapsed' : ''}>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? 'nav-item active' : 'nav-item'} onClick={() => { setActive(id); setMobileNav(false) }}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{id === 'words' && <b>{saved.length}</b>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="streak"><Flame size={getFlameProps(flameState.streak).size} color={getFlameProps(flameState.streak).color} className={getFlameProps(flameState.streak).burnClass} fill={getFlameProps(flameState.streak).color} style={{filter: getFlameProps(flameState.streak).glow !== 'none' ? `drop-shadow(${getFlameProps(flameState.streak).glow})` : 'none'}} /><div><strong>连续 {flameState.streak} 天</strong><small>{flameState.isBroken ? `⚠ 中断中，今日需记 ${flameState.wordsNeededToday} 词续火` : flameState.streak >= 15 ? '燃烧正旺！' : flameState.streak >= 7 ? '火焰跳动中' : '保持你的节奏'}</small></div><Zap size={15} /></div><button className="settings" onClick={() => setShowSettings(true)}><Settings2 size={18} /> 学习设置</button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={21} /></button><div className="breadcrumb">{navItems.find((item) => item.id === active)?.label}<span>/</span><em>{active === 'today' ? '今天，开始一小步' : '把理解变成直觉'}</em></div><div className="top-actions"><button className="icon-button" onClick={() => setShowHelp(true)}><CircleHelp size={18} /></button><button className="qr-open" onClick={() => setShowQr(true)} title="扫码在手机上打开"><QrCode size={18} /></button><div className="daily-chip"><span></span> 今日目标 <strong>{todayGoalPct}%</strong></div></div></header>
      <div className="page-content">{renderPage()}</div>
    </main>
    {toast && <div className="toast"><Check size={16} /> {toast}</div>}
    {showSettings && <SettingsModal flameState={flameState} setFlameState={setFlameState} onClose={() => setShowSettings(false)} />}
    {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    {showQr && <QrModal onClose={() => setShowQr(false)} />}
    {showLogin && <LoginModal onLogin={handleLoginSuccess} onClose={() => setShowLogin(false)} />}
  </div>
}

function SettingsModal({ flameState, setFlameState, onClose }) {
  const [rate, setRate] = useState(() => { try { return parseFloat(localStorage.getItem('tts_rate') || '0.9') } catch (e) { return 0.9 } })
  const [confirmReset, setConfirmReset] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const fileInputRef = useRef(null)
  const wordsNeeded = flameState.wordsNeededToday || 3
  const setWordsNeeded = (delta) => {
    setFlameState(prev => ({ ...prev, wordsNeededToday: Math.max(1, Math.min(20, (prev.wordsNeededToday || 3) + delta)) }))
  }
  const saveRate = (v) => {
    setRate(v)
    try { localStorage.setItem('tts_rate', String(v)) } catch (e) { /* ignore */ }
  }
  const exportData = () => {
    const keys = ['vocab_saved', 'vocab_imported', 'vocab_reading', 'vocab_memory', 'root_memory', 'reading_seconds', 'articles_read', 'daily_stats', 'flame_state', 'reviewed_today', 'review_count', 'review_levels', 'vocab_preloaded']
    const data = {}
    keys.forEach(k => { try { data[k] = JSON.parse(localStorage.getItem(k) || 'null') } catch (e) { data[k] = null } })
    data.exported_at = new Date().toLocaleString()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'lingua-lab-backup-' + localDateKey() + '.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  const handleImportFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        const keys = ['vocab_saved', 'vocab_imported', 'vocab_reading', 'vocab_memory', 'root_memory', 'reading_seconds', 'articles_read', 'daily_stats', 'flame_state', 'reviewed_today', 'review_count', 'review_levels', 'vocab_preloaded', 'tts_rate']
        let count = 0
        keys.forEach(k => {
          if (data[k] !== undefined && data[k] !== null) {
            try { localStorage.setItem(k, typeof data[k] === 'string' ? data[k] : JSON.stringify(data[k])); count++ } catch (err) { /* ignore */ }
          }
        })
        setImportMsg(`✓ 已导入 ${count} 项数据，页面即将刷新…`)
        setTimeout(() => location.reload(), 1200)
      } catch (err) {
        setImportMsg('✗ 文件格式错误，请选择导出的 JSON 备份文件')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }
  const doReset = () => {
    if (!confirmReset) { setConfirmReset(true); return }
    const keys = ['vocab_saved', 'vocab_imported', 'vocab_reading', 'vocab_memory', 'root_memory', 'reading_seconds', 'articles_read', 'daily_stats', 'flame_state', 'reviewed_today', 'review_count', 'review_levels', 'vocab_preloaded', 'tts_rate']
    keys.forEach(k => { try { localStorage.removeItem(k) } catch (e) { /* ignore */ } })
    location.reload()
  }
  return <div className="import-overlay" onClick={onClose}><div className="import-modal settings-modal" onClick={(e) => e.stopPropagation()}>
    <div className="import-modal-head"><span className="type-label orange">SETTINGS · 学习设置</span><button className="close-button" onClick={onClose}><X size={16} /></button></div>
    <div className="settings-section">
      <div className="settings-row"><div><strong>今日目标单词数</strong><small>每天达到这个「新掌握」数即可续火</small></div><div className="stepper"><button onClick={() => setWordsNeeded(-1)}><Minus size={14} /></button><span>{wordsNeeded}</span><button onClick={() => setWordsNeeded(1)}><Plus size={14} /></button></div></div>
      <div className="settings-row"><div><strong>发音语速</strong><small>影响单词发音与文章朗读的速度</small></div><div className="rate-options">{[{ v: 0.7, label: '慢速' }, { v: 0.9, label: '标准' }, { v: 1.0, label: '正常' }, { v: 1.2, label: '稍快' }].map((o) => <button key={o.v} className={Math.abs(rate - o.v) < 0.001 ? 'active' : ''} onClick={() => saveRate(o.v)}>{o.label}</button>)}</div></div>
    </div>
    <div className="settings-section">
      <div className="settings-row"><div><strong>备份学习数据</strong><small>把词库、记忆等级、每日记录导出为 JSON 文件</small></div><button className="ghost-button" onClick={exportData}><Download size={15} /> 导出</button></div>
      <div className="settings-row"><div><strong>恢复学习数据</strong><small>从导出的 JSON 备份文件恢复，覆盖当前数据</small></div><button className="ghost-button" onClick={() => fileInputRef.current?.click()}><Upload size={15} /> 导入</button></div>
      {importMsg && <div className="import-msg">{importMsg}</div>}
      <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleImportFile} style={{ display: 'none' }} />
      <div className="settings-row"><div><strong>重置全部数据</strong><small>清除本地学习记录并恢复初始状态，不可撤销</small></div><button className={confirmReset ? 'danger-btn armed' : 'danger-btn'} onClick={doReset}>{confirmReset ? <><Trash2 size={15} /> 确认重置</> : <><Trash2 size={15} /> 重置</>}</button></div>
    </div>
  </div></div>
}

function HelpModal({ onClose }) {
  const features = [
    { icon: BookOpen, title: '文本阅读', desc: '导入 .txt / .pdf / .epub，点词查词、标记生词，支持全文朗读与原页预览。' },
    { icon: ScanText, ZoomIn, title: '图片翻译', desc: '阅读页「图片翻译」可对扫描 PDF 或图片框选识别，直接输出中文翻译。' },
    { icon: Sparkles, title: '今日学习', desc: '每天一个主任务 + 情境词汇复习 + 英文听力，完成任务即可续火。' },
    { icon: Library, title: '词汇库', desc: '2000+ 四六级词库，导入导出、分级记忆与智能复习。' },
    { icon: Brain, title: '词根实验室', desc: '130 词根、54 前缀、28 后缀总表，按词根批量记单词。' },
    { icon: Merge, title: '融合阅读', desc: '把四六级词汇表与小说正文融合，生词在故事里高亮出现。' },
    { icon: Play, title: '英文剧场', desc: '按难度挑选美剧 / 纪录片，用兴趣驱动听力输入。' },
    { icon: Flame, title: '火焰机制', desc: '每天掌握足量新词续火；中断 5 天会降级，需要更多单词挽回。' },
  ]
  return <div className="import-overlay" onClick={onClose}><div className="import-modal help-modal" onClick={(e) => e.stopPropagation()}>
    <div className="import-modal-head"><span className="type-label orange">LINGUA LAB · 使用指南</span><button className="close-button" onClick={onClose}><X size={16} /></button></div>
    <div className="help-grid">{features.map((f, i) => { const Icon = f.icon; return <div className="help-card" key={i}><Icon size={17} /><div><strong>{f.title}</strong><p>{f.desc}</p></div></div> })}</div>
    <div className="help-tip"><Languages size={16} /><span>任何页面点一下英文单词，都会弹出音标、释义、词根和例句；点喇叭可听发音。</span></div>
  </div></div>
}

function QrModal({ onClose }) {
  const { qrData, shareUrl } = useMemo(() => {
    const url = window.location.hostname.endsWith('.pages.dev') ? window.location.href : 'https://lingua-lab-zll.pages.dev/'
    try {
      const qr = qrcode(0, 'M')
      qr.addData(url)
      qr.make()
      return { qrData: qr.createDataURL(8, 2), shareUrl: url }
    } catch (e) { return { qrData: '', shareUrl: url } }
  }, [])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return <div className="import-overlay" onClick={onClose}><div className="import-modal qr-modal" onClick={(e) => e.stopPropagation()}>
    <div className="import-modal-head"><span className="type-label orange">SCAN · 手机打开</span><button className="close-button" onClick={onClose}><X size={16} /></button></div>
    <div className="qr-frame">{qrData ? <img src={qrData} alt="Lingua Lab 二维码" /> : <span className="qr-error">二维码生成失败</span>}</div>
    <p className="qr-hint">用手机微信扫一扫，在手机上继续学习</p>
    <p className="qr-url">{shareUrl}</p>
  </div></div>
}

function WelcomeQrCard({ variant = 'hero' }) {
  const { qrData, shareUrl } = useMemo(() => {
    const url = window.location.hostname.endsWith('.pages.dev') ? `${window.location.origin}/` : 'https://lingua-lab-zll.pages.dev/'
    try {
      const qr = qrcode(0, 'M')
      qr.addData(url)
      qr.make()
      return { qrData: qr.createDataURL(6, 2), shareUrl: url.replace(/^https?:\/\//, '').replace(/\/$/, '') }
    } catch (e) { return { qrData: '', shareUrl: url } }
  }, [])
  return <div className={`welcome-qr-card${variant === 'dark' ? ' welcome-qr-dark' : ''}`}>
    {qrData ? <img src={qrData} alt="Lingua Lab 二维码" /> : <span className="welcome-qr-error">二维码生成失败</span>}
    <div className="welcome-qr-text">
      <strong>手机扫一扫 · 随时随地学</strong>
      <span>{shareUrl}</span>
    </div>
  </div>
}

function DashboardPage({ saved, memoryLevels, rootMemoryLevels, importedVocab, readingSeconds, articlesRead, dailyStats, todayKey, yesterdayKey, flameState, todayWords, todayMetThreshold, setActive, setToast, isLoggedIn, currentUser, currentUserName, onLogout, onShowLogin }) {
  // 统计数据
  const totalWords = Object.keys(importedVocab).length + 4
  const masteredWords = Object.values(memoryLevels).filter(l => l >= 4).length
  const learningWords = Object.values(memoryLevels).filter(l => l >= 1 && l < 4).length
  const savedCount = saved.length
  const readingHours = (readingSeconds / 3600).toFixed(1)
  const readingMins = Math.floor(readingSeconds / 60)
  const streak = flameState.streak
  const flameProps = getFlameProps(streak)
  const xp = masteredWords * 10 + readingMins * 2 + savedCount * 5
  const trophyProps = getIconProps('trophy', masteredWords)
  const clockProps = getIconProps('clock', parseFloat(readingHours) || 0)
  const zapProps = getIconProps('zap', xp)

  // 词汇掌握进度
  const masteryPct = totalWords > 0 ? Math.min(100, Math.round(masteredWords / totalWords * 100)) : 0
  const learningPct = totalWords > 0 ? Math.round(learningWords / totalWords * 100) : 0

  // 词根词缀掌握进度
  const rootTotal = affixData.length
  const rootMastered = affixData.filter(d => (rootMemoryLevels[d.form] || 0) >= 4).length
  const rootLearning = affixData.filter(d => { const lv = rootMemoryLevels[d.form] || 0; return lv >= 1 && lv < 4 }).length

  // 成就徽章
  const achievements = [
    { icon: Star, name: '初露锋芒', desc: '掌握第一个单词', unlocked: masteredWords >= 1, color: '#f59e0b' },
    { icon: BookMarked, name: '词汇新星', desc: '掌握10个单词', unlocked: masteredWords >= 10, color: '#8b5cf6' },
    { icon: Trophy, name: '词汇达人', desc: '掌握50个单词', unlocked: masteredWords >= 50, color: '#ec4899' },
    { icon: Crown, name: '词汇大师', desc: '掌握200个单词', unlocked: masteredWords >= 200, color: '#f59e0b' },
    { icon: Flame, name: '坚持不懈', desc: '连续学习7天', unlocked: streak >= 7, color: '#ef4444' },
    { icon: Clock3, name: '阅读爱好者', desc: '阅读满1小时', unlocked: readingSeconds >= 3600, color: '#0e7490' },
    { icon: Rocket, name: '突飞猛进', desc: '累计XP达500', unlocked: xp >= 500, color: '#8b5cf6' },
    { icon: Medal, name: '收藏达人', desc: '收藏20个单词', unlocked: savedCount >= 20, color: '#10b981' },
  ]
  const unlockedCount = achievements.filter(a => a.unlocked).length

  // 最近学习的单词
  const recentWords = [...saved].slice(-5).reverse()

  // 经验提升弹窗状态
  const [showXpModal, setShowXpModal] = useState(false)
  const [xpLevelSnapshot, setXpLevelSnapshot] = useState(zapProps.level)
  const [levelUpAnim, setLevelUpAnim] = useState(false)

  const fmtTime = (sec) => {
    if (sec >= 3600) return `${(sec/3600).toFixed(1)}h`
    if (sec >= 60) return `${Math.floor(sec/60)}m`
    return `${sec}s`
  }

  return <div className="dashboard-page fade-in">
    {/* Hero 区域 */}
    <section className="dash-hero">
      <div className="dash-hero-copy">
        <span className="eyebrow orange-text">LEARNING DASHBOARD</span>
        <h1>欢迎回来，<i>{isLoggedIn ? (currentUserName || currentUser.split('@')[0]) : '访客'}。</i></h1>
        <p>你已经连续学习 <strong>{streak}</strong> 天，掌握了 <strong>{masteredWords}</strong> 个单词，阅读了 <strong>{fmtTime(readingSeconds)}</strong>。继续保持，每一步都在积累！</p>
        <div className="dash-hero-actions">
          <button className="primary" onClick={() => setActive('read')}><BookOpen size={16} /> 继续阅读</button>
          <button className="ghost-button" onClick={() => setActive('words')}><Library size={16} /> 复习词汇</button>
          {isLoggedIn ? (
            <button className="ghost-button dash-logout-btn" onClick={onLogout}><LogOut size={16} /> 退出登录</button>
          ) : (
            <button className="primary" onClick={onShowLogin}><User size={16} /> 登录解锁功能</button>
          )}
        </div>
        <div className={`flame-progress ${flameState.isBroken ? 'broken' : ''} ${todayMetThreshold ? 'met' : ''}`}>
          <div className="flame-progress-head">
            <span className="flame-progress-label">
              <Flame size={14} color={flameProps.color} fill={flameProps.color} />
              {flameState.isBroken ? '火焰中断！今日需记更多单词续火' : todayMetThreshold ? '今日已续火！' : '今日续火进度'}
            </span>
            <span className="flame-progress-count"><b>{todayWords}</b> / {flameState.wordsNeededToday} 词</span>
          </div>
          <div className="flame-progress-bar">
            <span style={{width: `${Math.min(100, (todayWords / flameState.wordsNeededToday) * 100)}%`, background: todayMetThreshold ? '#10b981' : flameProps.color}}></span>
          </div>
          {flameState.isBroken && <small className="flame-progress-tip">中断后续火需要比平时多记50%的单词。连续5天不续火将降级！</small>}
          {flameState.brokenDays > 0 && <small className="flame-progress-tip warning">已中断 {flameState.brokenDays} 天，再 {5 - flameState.brokenDays} 天不续火将降级</small>}
        </div>
      </div>
      <div className="dash-hero-stats">
        <div className="hero-mini-stats">
          <div><span>已掌握</span><b>{masteredWords}<em>/{totalWords}</em></b></div>
          <div><span>词根掌握</span><b>{rootMastered}<em>/{rootTotal}</em></b></div>
          <div><span>连续学习</span><b>{streak}<em>天</em></b></div>
          <div><span>已读文章</span><b>{articlesRead}</b></div>
        </div>
      </div>
    </section>

    {/* 核心数据卡片 */}
    <section className="dash-cards">
      <div className="dash-card">
        <div className="dash-card-icon" style={{background: trophyProps.color + '18', boxShadow: trophyProps.glow}}><Trophy size={trophyProps.size} color={trophyProps.color} className={trophyProps.animClass} fill={trophyProps.color} /></div>
        <div className="dash-card-info"><strong>{masteredWords}</strong><span>已掌握单词</span><small>{trophyProps.label} · 共 {totalWords} 词</small></div>
        <div className="dash-card-bar"><span style={{width:`${masteryPct}%`,background: trophyProps.color}}></span></div>
      </div>
      <div className="dash-card">
        <div className="dash-card-icon" style={{background: clockProps.color + '18', boxShadow: clockProps.glow}}><Clock3 size={clockProps.size} color={clockProps.color} className={clockProps.animClass} fill={clockProps.color} /></div>
        <div className="dash-card-info"><strong>{readingHours}</strong><span>阅读时长（小时）</span><small>{clockProps.label} · {readingMins} 分钟</small></div>
        <div className="dash-card-bar"><span style={{width:`${Math.min(100, readingMins/6)}%`,background: clockProps.color}}></span></div>
      </div>
      <div className="dash-card">
        <div className="dash-card-icon" style={{background: flameProps.color + '18', boxShadow: flameProps.glow}}><Flame size={flameProps.size} color={flameProps.color} className={flameProps.burnClass} fill={flameProps.color} /></div>
        <div className="dash-card-info"><strong>{streak}</strong><span>连续学习天数</span><small>{streak >= 30 ? '🔥 火焰狂暴！' : streak >= 15 ? '燃烧正旺！' : streak >= 7 ? '火焰跳动中' : streak >= 4 ? '渐入佳境' : '刚刚点燃'}</small></div>
        <div className="dash-card-bar"><span style={{width:`${Math.min(100, streak*5)}%`,background: flameProps.color}}></span></div>
      </div>
      <div className={`dash-card xp-card ${levelUpAnim ? 'xp-levelup' : ''}`} onClick={() => setShowXpModal(true)}>
        <div className="dash-card-icon" style={{background: zapProps.color + '18', boxShadow: zapProps.glow}}><Zap size={zapProps.size} color={zapProps.color} className={zapProps.animClass} fill={zapProps.color} /></div>
        <div className="dash-card-info"><strong>{xp}</strong><span>累计经验值</span><small>{zapProps.label} · 距下一级 {Math.max(0, 1000 - xp)} XP</small></div>
        <div className="dash-card-bar"><span style={{width:`${Math.min(100, xp/10)}%`,background: zapProps.color}}></span></div>
        <button className="xp-boost-btn" onClick={(e) => { e.stopPropagation(); setShowXpModal(true) }}><Zap size={13} /> 提升经验</button>
      </div>
    </section>

    {/* 词汇掌握详情 */}
    <section className="dash-panel">
      <div className="dash-panel-head"><h3><BarChart3 size={18} /> 词汇掌握详情</h3><span className="type-label orange">{masteredWords + learningWords} 词在学</span></div>
      <div className="mastery-breakdown">
        <div className="breakdown-row">
          <span className="breakdown-dot" style={{background:'#10b981'}}></span>
          <span className="breakdown-label">已掌握</span>
          <span className="breakdown-count">{masteredWords}</span>
          <div className="breakdown-bar"><span style={{width:`${masteryPct}%`,background:'#10b981'}}></span></div>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-dot" style={{background:'#f59e0b'}}></span>
          <span className="breakdown-label">学习中</span>
          <span className="breakdown-count">{learningWords}</span>
          <div className="breakdown-bar"><span style={{width:`${learningPct}%`,background:'#f59e0b'}}></span></div>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-dot" style={{background:'#d1d5db'}}></span>
          <span className="breakdown-label">未学习</span>
          <span className="breakdown-count">{totalWords - masteredWords - learningWords}</span>
          <div className="breakdown-bar"><span style={{width:`${Math.max(0, 100 - masteryPct - learningPct)}%`,background:'#d1d5db'}}></span></div>
        </div>
      </div>
      <div className="dash-divider"></div>
      <div className="root-mastery-section">
        <h4 style={{display:'flex',alignItems:'center',gap:'6px',margin:'0 0 10px',fontSize:'13px',color:'#6b7280'}}><Brain size={14} /> 词根词缀掌握</h4>
        <div className="mastery-breakdown">
          <div className="breakdown-row">
            <span className="breakdown-dot" style={{background:'#3b82f6'}}></span>
            <span className="breakdown-label">已掌握</span>
            <span className="breakdown-count">{rootMastered} / {rootTotal}</span>
            <div className="breakdown-bar"><span style={{width:`${rootTotal ? Math.round(rootMastered/rootTotal*100) : 0}%`,background:'#3b82f6'}}></span></div>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-dot" style={{background:'#a855f7'}}></span>
            <span className="breakdown-label">学习中</span>
            <span className="breakdown-count">{rootLearning}</span>
            <div className="breakdown-bar"><span style={{width:`${rootTotal ? Math.round(rootLearning/rootTotal*100) : 0}%`,background:'#a855f7'}}></span></div>
          </div>
        </div>
        <button className="ghost-button" style={{marginTop:'10px',width:'100%',justifyContent:'center'}} onClick={() => setActive('roots')}><Brain size={14} /> 去词根实验室复习</button>
      </div>
      <div className="dash-divider"></div>
      <div className="recent-words">
        <h4>最近收藏</h4>
        <div className="recent-word-list">
          {recentWords.length ? recentWords.map(k => {
            const entry = importedVocab[k]
            return <span key={k} className="recent-word-tag">{entry?.word || k}<em>{entry?.meaning?.slice(0,12) || ''}</em></span>
          }) : <span className="recent-empty">还没有收藏单词，去阅读页点击单词收藏吧</span>}
        </div>
      </div>
    </section>

    {/* 成就徽章 */}
    <section className="dash-panel">
      <div className="dash-panel-head"><h3><Award size={18} /> 成就徽章</h3><span className="type-label orange">已解锁 {unlockedCount}/{achievements.length}</span></div>
      <div className="achievement-grid">
        {achievements.map((a, i) => {
          const Icon = a.icon
          return (
            <div key={i} className={`achievement ${a.unlocked ? 'unlocked' : 'locked'}`}>
              <div className="ach-icon" style={{background: a.unlocked ? a.color + '20' : '#f3f4f6'}}>
                <Icon size={24} color={a.unlocked ? a.color : '#9ca3af'} />
              </div>
              <strong>{a.name}</strong>
              <span>{a.desc}</span>
              {a.unlocked ? <em className="ach-unlocked">已解锁</em> : <em className="ach-locked">未解锁</em>}
            </div>
          )
        })}
      </div>
    </section>

    {/* 经验提升弹窗 */}
    {showXpModal && <XpBoostModal
      xp={xp}
      zapProps={zapProps}
      masteredWords={masteredWords}
      readingMins={readingMins}
      savedCount={savedCount}
      xpLevelSnapshot={xpLevelSnapshot}
      onClose={() => setShowXpModal(false)}
      onRefresh={(newLevel) => {
        if (newLevel > xpLevelSnapshot) {
          setLevelUpAnim(true)
          setTimeout(() => setLevelUpAnim(false), 2000)
        }
        setXpLevelSnapshot(newLevel)
      }}
      setActive={setActive}
    />}
  </div>
}

// 经验提升弹窗组件
function XpBoostModal({ xp, zapProps, masteredWords, readingMins, savedCount, xpLevelSnapshot, onClose, onRefresh, setActive }) {
  const [refreshing, setRefreshing] = useState(false)
  const [justLeveledUp, setJustLeveledUp] = useState(false)

  // 经验等级阈值（与 getIconProps 一致）
  const xpThresholds = [100, 500, 2000, 5000]
  const xpLabels = ['入门', '初级', '中级', '高级', '大师']
  const currentLevel = zapProps.level
  const nextThreshold = currentLevel < 4 ? xpThresholds[currentLevel] : null
  const prevThreshold = currentLevel > 0 ? xpThresholds[currentLevel - 1] : 0
  const levelProgress = nextThreshold ? Math.min(100, Math.round(((xp - prevThreshold) / (nextThreshold - prevThreshold)) * 100)) : 100

  // 各来源经验值
  const xpFromMastered = masteredWords * 10
  const xpFromReading = readingMins * 2
  const xpFromSaved = savedCount * 5

  // 每日推荐任务
  const dailyTasks = [
    { icon: Trophy, name: '掌握3个新单词', desc: '在词汇库或阅读中标记单词至已掌握', target: 3, current: Math.min(3, masteredWords), reward: 30, action: () => setActive('words'), color: '#f59e0b' },
    { icon: Clock3, name: '阅读15分钟', desc: '在文本阅读页持续阅读积累时长', target: 15, current: Math.min(15, readingMins), reward: 20, action: () => setActive('read'), color: '#06b6d4' },
    { icon: BookMarked, name: '收藏5个单词', desc: '阅读时点击生词加入词汇库', target: 5, current: Math.min(5, savedCount), reward: 15, action: () => setActive('read'), color: '#8b5cf6' },
  ]

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      // 重新计算等级（xp 已经是最新的，这里模拟刷新过程）
      let newLevel = 0
      for (let i = 0; i < xpThresholds.length; i++) {
        if (xp >= xpThresholds[i]) newLevel = i + 1
      }
      if (newLevel > xpLevelSnapshot) {
        setJustLeveledUp(true)
        setTimeout(() => setJustLeveledUp(false), 3000)
      }
      onRefresh(newLevel)
      setRefreshing(false)
    }, 800)
  }

  return createPortal(<div className="import-overlay" onClick={onClose}>
    <div className="import-modal xp-modal" onClick={(e) => e.stopPropagation()}>
      <div className="import-modal-head">
        <span className="type-label orange">XP BOOST · 经验提升</span>
        <button className="close-button" onClick={onClose}><X size={16} /></button>
      </div>

      {/* 当前等级展示 */}
      <div className={`xp-level-display ${justLeveledUp ? 'levelup-glow' : ''}`}>
        <div className="xp-level-icon" style={{background: zapProps.color + '20', boxShadow: `0 0 24px ${zapProps.color}44`}}>
          <Zap size={36} color={zapProps.color} fill={zapProps.color} className={zapProps.animClass} />
        </div>
        <div className="xp-level-info">
          <div className="xp-level-name">Lv.{currentLevel + 1} · {xpLabels[currentLevel]}</div>
          <div className="xp-level-xp"><strong>{xp}</strong> XP 累计</div>
          {nextThreshold ? (
            <div className="xp-level-progress">
              <div className="xp-progress-bar"><span style={{width: `${levelProgress}%`, background: zapProps.color}}></span></div>
              <small>距 Lv.{currentLevel + 2} · {xpLabels[currentLevel + 1]} 还需 {nextThreshold - xp} XP</small>
            </div>
          ) : <small className="xp-max">已达最高等级！</small>}
        </div>
        {justLeveledUp && <div className="xp-levelup-badge"><Rocket size={18} /> 等级提升！</div>}
      </div>

      {/* 经验来源 */}
      <div className="xp-sources">
        <h4>经验来源</h4>
        <div className="xp-source-list">
          <div className="xp-source-row">
            <span className="xp-source-icon" style={{background: '#fef3c7'}}><Trophy size={14} color="#d97706" /></span>
            <div className="xp-source-detail">
              <strong>掌握单词</strong>
              <small>每个已掌握单词 +10 XP</small>
            </div>
            <span className="xp-source-count">{masteredWords} 个</span>
            <span className="xp-source-xp">+{xpFromMastered}</span>
          </div>
          <div className="xp-source-row">
            <span className="xp-source-icon" style={{background: '#cffafe'}}><Clock3 size={14} color="#0891b2" /></span>
            <div className="xp-source-detail">
              <strong>阅读时长</strong>
              <small>每分钟阅读 +2 XP</small>
            </div>
            <span className="xp-source-count">{readingMins} 分</span>
            <span className="xp-source-xp">+{xpFromReading}</span>
          </div>
          <div className="xp-source-row">
            <span className="xp-source-icon" style={{background: '#ede9fe'}}><BookMarked size={14} color="#7c3aed" /></span>
            <div className="xp-source-detail">
              <strong>收藏单词</strong>
              <small>每个收藏单词 +5 XP</small>
            </div>
            <span className="xp-source-count">{savedCount} 个</span>
            <span className="xp-source-xp">+{xpFromSaved}</span>
          </div>
        </div>
      </div>

      {/* 每日任务 */}
      <div className="xp-daily-tasks">
        <h4>每日推荐任务</h4>
        <div className="xp-task-list">
          {dailyTasks.map((task, i) => {
            const Icon = task.icon
            const completed = task.current >= task.target
            const pct = Math.round((task.current / task.target) * 100)
            return (
              <div key={i} className={`xp-task-row ${completed ? 'completed' : ''}`}>
                <span className="xp-task-icon" style={{background: task.color + '18'}}><Icon size={15} color={task.color} /></span>
                <div className="xp-task-detail">
                  <strong>{task.name}</strong>
                  <small>{task.desc}</small>
                  <div className="xp-task-progress"><span style={{width: `${pct}%`, background: task.color}}></span></div>
                </div>
                <div className="xp-task-right">
                  <span className="xp-task-reward">+{task.reward} XP</span>
                  <span className="xp-task-count">{task.current}/{task.target}</span>
                  {completed ? <span className="xp-task-done"><CheckCircle size={14} /> 已完成</span> : <button className="xp-task-go" onClick={task.action}>去完成 <ArrowUpRight size={12} /></button>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 刷新按钮 */}
      <div className="xp-refresh-area">
        <button className={`xp-refresh-btn ${refreshing ? 'refreshing' : ''}`} onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <><RotateCcw size={16} className="spin" /> 计算中…</> : <><Zap size={16} /> 刷新经验等级</>}
        </button>
        <small>完成任务后点击刷新，经验值和等级将自动更新</small>
      </div>
    </div>
  </div>, document.body)
}

function TodayPage({ setActive, saved, setToast, flameState, dailyStats, todayKey, readingSeconds, memoryLevels, todayWords, todayMetThreshold, memorizeHistory, importedVocab }) {
  // 真实数据：星期、今日学习分钟/任务/XP、连续天数
  const weekdayMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  const weekday = weekdayMap[new Date().getDay()]
  const todayStats = dailyStats[todayKey] || { words: 0, minutes: 0, xp: 0, saved: 0, memorized: 0 }
  const todayXp = (todayStats.memorized || 0) * 10 + (todayStats.minutes || 0) * 2 + (todayStats.saved || 0) * 5
  const goalPct = Math.min(100, Math.round((todayWords / Math.max(1, flameState.wordsNeededToday)) * 100))
  const mastered = Object.values(memoryLevels).filter(l => l >= 4).length

  // ===== 经验提升系统 =====
  const readingMins = Math.floor(readingSeconds / 60)
  const savedCount = saved.length
  const xp = mastered * 10 + readingMins * 2 + savedCount * 5
  const zapProps = getIconProps('zap', xp)
  const [showXpModal, setShowXpModal] = useState(false)
  const [xpLevelSnapshot, setXpLevelSnapshot] = useState(zapProps.level)
  const [levelUpAnim, setLevelUpAnim] = useState(false)

  // ===== 记忆反馈：今日/本周/本月记住的单词 =====
  const getWeekStartKey = () => {
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? 6 : day - 1
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff)
    return localDateKey(monday)
  }
  const getMonthStartKey = () => {
    const now = new Date()
    return localDateKey(new Date(now.getFullYear(), now.getMonth(), 1))
  }
  const weekStartKey = getWeekStartKey()
  const monthStartKey = getMonthStartKey()
  const collectWordsInRange = (startKey, endKey) => {
    const result = []
    const seen = new Set()
    const dates = Object.keys(memorizeHistory).sort()
    for (const d of dates) {
      if (d >= startKey && d <= endKey) {
        for (const w of memorizeHistory[d]) {
          if (!seen.has(w)) { seen.add(w); result.push(w) }
        }
      }
    }
    return result
  }
  const todayMemorizedWords = collectWordsInRange(todayKey, todayKey)
  const weekMemorizedWords = collectWordsInRange(weekStartKey, todayKey)
  const monthMemorizedWords = collectWordsInRange(monthStartKey, todayKey)
  const getWordDisplay = (key) => {
    const entry = importedVocab[key]
    return { word: entry?.word || key, meaning: entry?.meaning || '' }
  }

  // ===== 自我超越榜 =====
  const selfLeaderboard = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = localDateKey(d)
    const stat = dailyStats[key] || { words: 0, minutes: 0, xp: 0, saved: 0, memorized: 0 }
    const memorized = stat.memorized || 0
    const label = i === 0 ? '今天的你' : i === 1 ? '昨天的你' : `${d.getMonth()+1}月${d.getDate()}日的你`
    selfLeaderboard.push({ key, label, words: memorized, minutes: stat.minutes, xp: memorized * 10 + stat.minutes * 2 + (stat.saved || 0) * 5, isToday: i === 0 })
  }
  selfLeaderboard.sort((a, b) => b.words - a.words)

  return <div className="today-page fade-in"><section className="study-status"><div><span className="eyebrow">{weekday} / STUDY PLAN</span><strong>今天先完成一件最重要的事。</strong></div><div className="status-metrics"><span><b>{todayStats.minutes || 0}</b> min</span><span><b>3</b> tasks</span><span><b>{goalPct}%</b> done</span></div></section><section className="method-strip"><Lightbulb size={20} /><div><strong>今日方法：词不是孤岛</strong><span>把新词放进一个画面，再放进一句话。语境会替你记住它。</span></div><button onClick={() => setActive('roots')}>去词根实验室 <ArrowUpRight size={15} /></button></section>

    {/* 记忆反馈：今日/本周/本月记住的单词 */}
    <section className="dash-panel memory-feedback today-section">
      <div className="dash-panel-head"><h3><Brain size={18} /> 记忆反馈</h3><span className="type-label orange">记住 = 首次标记记忆</span></div>
      <div className="feedback-cards">
        <div className="feedback-card today">
          <div className="feedback-card-head">
            <span className="feedback-icon"><Clock3 size={16} /></span>
            <div><strong>今日记住</strong><small>{todayKey}</small></div>
            <b className="feedback-count">{todayMemorizedWords.length}</b>
          </div>
          <div className="feedback-word-list">
            {todayMemorizedWords.length ? todayMemorizedWords.map(k => { const w = getWordDisplay(k); return <span key={k} className="feedback-word-tag" title={w.meaning}>{w.word}<em>{w.meaning?.slice(0, 10) || ''}</em></span> }) : <span className="feedback-empty">今天还没有记住新单词，去阅读页标记记忆吧</span>}
          </div>
        </div>
        <div className="feedback-card week">
          <div className="feedback-card-head">
            <span className="feedback-icon"><TrendingUp size={16} /></span>
            <div><strong>本周记住</strong><small>{weekStartKey} ~ {todayKey}</small></div>
            <b className="feedback-count">{weekMemorizedWords.length}</b>
          </div>
          <div className="feedback-word-list">
            {weekMemorizedWords.length ? weekMemorizedWords.map(k => { const w = getWordDisplay(k); return <span key={k} className="feedback-word-tag" title={w.meaning}>{w.word}<em>{w.meaning?.slice(0, 10) || ''}</em></span> }) : <span className="feedback-empty">本周还没有记住新单词</span>}
          </div>
        </div>
        <div className="feedback-card month">
          <div className="feedback-card-head">
            <span className="feedback-icon"><Trophy size={16} /></span>
            <div><strong>本月记住</strong><small>{monthStartKey} ~ {todayKey}</small></div>
            <b className="feedback-count">{monthMemorizedWords.length}</b>
          </div>
          <div className="feedback-word-list">
            {monthMemorizedWords.length ? monthMemorizedWords.map(k => { const w = getWordDisplay(k); return <span key={k} className="feedback-word-tag" title={w.meaning}>{w.word}<em>{w.meaning?.slice(0, 10) || ''}</em></span> }) : <span className="feedback-empty">本月还没有记住新单词</span>}
          </div>
        </div>
      </div>
      <div className="feedback-summary">
        <span><Target size={14} /> 累计记住 <b>{Object.values(memorizeHistory).flat().length}</b> 个单词（含重复日期统计）</span>
        <span className="feedback-tip">首次点击「记住」按钮即计入；继续复习可提升记忆等级，最高 4 级为已掌握。</span>
      </div>
    </section>

    {/* 自我超越榜 */}
    <section className="dash-panel today-section">
      <div className="dash-panel-head"><h3><TrendingUp size={18} /> 自我超越榜</h3><span className="type-label orange">跟过去的自己比</span></div>
      <div className="leaderboard">
        {selfLeaderboard.map((u, i) => (
          <div key={u.key} className={`lb-row ${u.isToday ? 'lb-user' : ''}`}>
            <span className="lb-rank">{i === 0 ? <Crown size={16} color="#f59e0b" /> : i+1}</span>
            <span className="lb-avatar" style={{background: u.isToday ? '#0e7490' : (u.words > 0 ? '#f59e0b' : '#d1d5db')}}>{u.isToday ? '今' : (i+1)}</span>
            <span className="lb-name">{u.label}{u.isToday && <em>（今天）</em>}</span>
            <span className="lb-score"><b>{u.words}</b> 次记忆 · {u.minutes}分</span>
          </div>
        ))}
      </div>
      <div className="dash-divider"></div>
      <div className="lb-tip">
        <Target size={16} color="#0e7490" />
        <span>最近7天的你按记忆次数排名。每标记一次记忆就算一次，超越昨天的自己，就是最大的进步！</span>
      </div>
    </section>

    {/* 经验提升弹窗 */}
    {showXpModal && <XpBoostModal
      xp={xp}
      zapProps={zapProps}
      masteredWords={mastered}
      readingMins={readingMins}
      savedCount={savedCount}
      xpLevelSnapshot={xpLevelSnapshot}
      onClose={() => setShowXpModal(false)}
      onRefresh={(newLevel) => {
        if (newLevel > xpLevelSnapshot) {
          setLevelUpAnim(true)
          setTimeout(() => setLevelUpAnim(false), 2000)
        }
        setXpLevelSnapshot(newLevel)
      }}
      setActive={setActive}
    />}
  </div>
}

function FullscreenImage({ src, alt, onClose }) {
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragRef = useRef(null)
  const clampScale = (s) => Math.max(0.3, Math.min(6, s))
  const handleWheel = (e) => { e.preventDefault(); const d = e.deltaY < 0 ? 0.2 : -0.2; setScale(prev => clampScale(prev + d)) }
  const handleMouseDown = (e) => { if (e.button !== 0) return; dragRef.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y } }
  const handleMouseMove = (e) => { if (!dragRef.current) return; setPos({ x: dragRef.current.px + (e.clientX - dragRef.current.sx), y: dragRef.current.py + (e.clientY - dragRef.current.sy) }) }
  const handleMouseUp = () => { dragRef.current = null }
  const reset = () => { setScale(1); setPos({ x: 0, y: 0 }) }
  const handleDoubleClick = () => { if (scale > 1.2) reset(); else setScale(2.5) }
  return <div className='fullscreen-overlay' onClick={onClose} onWheel={handleWheel}>
    <div className='fullscreen-toolbar' onClick={(e) => e.stopPropagation()}>
      <button onClick={(e) => { e.stopPropagation(); setScale(s => clampScale(s - 0.3)) }}><Minus size={18} /></button>
      <span className='fullscreen-scale'>{Math.round(scale * 100)}%</span>
      <button onClick={(e) => { e.stopPropagation(); setScale(s => clampScale(s + 0.3)) }}><Plus size={18} /></button>
      <button onClick={(e) => { e.stopPropagation(); reset() }}><RotateCcw size={16} /> 重置</button>
    </div>
    <button className='fullscreen-close' onClick={onClose}><X size={20} /></button>
    <div className='fullscreen-viewport' onClick={(e) => e.stopPropagation()} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <img src={src} alt={alt} className='fullscreen-img' draggable={false} style={{ transform: 'translate(' + pos.x + 'px,' + pos.y + 'px) scale(' + scale + ')', cursor: dragRef.current ? 'grabbing' : 'grab', transition: dragRef.current ? 'none' : 'transform .15s ease' }} onDoubleClick={handleDoubleClick} />
    </div>
    <div className='fullscreen-hint'>滚轮缩放 · 双击放大 · 按住拖动</div>
  </div>
}

function ReadingPage({ selectedWord, setSelectedWord, saved, toggleSave, setToast, importedVocab, memoryLevels, markMemorized, onArticleStart }) {
  const articleRef = useRef(null)
  const [marks, setMarks] = useState([])
  const [customText, setCustomText] = useState(() => { try { return localStorage.getItem('reading_custom_text') || '' } catch (e) { return '' } })
  const [customTitle, setCustomTitle] = useState(() => { try { return localStorage.getItem('reading_custom_title') || '' } catch (e) { return '' } })
  const [customArticles, setCustomArticles] = useState(() => { try { return JSON.parse(localStorage.getItem('custom_articles') || '[]') } catch (e) { return [] } })
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [titleInput, setTitleInput] = useState('')
  const [importingPdf, setImportingPdf] = useState(false)
  const [pdfData, setPdfData] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewPage, setPreviewPage] = useState(1)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [lookup, setLookup] = useState({ loading: false, mean: '' })
  const [pdfPages, setPdfPages] = useState(null)
  const [pdfNativeMode, setPdfNativeMode] = useState(false)
  const [imageImport, setImageImport] = useState(null) // 图片翻译：dataURL
  const imageInputRef = useRef(null)
  // 全文朗读
  const [readingAloud, setReadingAloud] = useState(false)
  const readingAloudRef = useRef(false)
  // 阅读设置：字号（小/中/大）
  const [readingFont, setReadingFont] = useState(() => { try { return localStorage.getItem('reading_font') || 'md' } catch (e) { return 'md' } })
  const [showReadMenu, setShowReadMenu] = useState(false)
  // 阅读文库下拉
  const [showLibrary, setShowLibrary] = useState(false)

  // 载入内置文库文章（复用导入文本的渲染链路）
  const loadBuiltin = (article) => {
    setCustomText(article.text)
    setCustomTitle(article.title)
    setMarks([])
    setSelectedWord(null)
    setPdfData(null)
    setPdfPages(null)
    setImageImport(null)
    setPreviewOpen(false)
    readingAloudRef.current = false
    stopSpeak()
    setReadingAloud(false)
    setShowLibrary(false)
    setToast('已载入《' + article.title + '》')
  }

  const loadCustomArticle = (article) => {
    setCustomText(article.text)
    setCustomTitle(article.title)
    setMarks([])
    setSelectedWord(null)
    setPdfData(null)
    setPdfPages(null)
    setImageImport(null)
    setPreviewOpen(false)
    readingAloudRef.current = false
    stopSpeak()
    setReadingAloud(false)
    setShowLibrary(false)
    setToast('已载入《' + article.title + '》')
  }

  const deleteCustomArticle = (articleId) => {
    const updated = customArticles.filter(a => a.id !== articleId)
    setCustomArticles(updated)
    try { localStorage.setItem('custom_articles', JSON.stringify(updated)) } catch (e) { /* ignore */ }
    setToast('已从文库删除')
  }

  // 组件卸载时停止朗读
  useEffect(() => () => { readingAloudRef.current = false; if ('speechSynthesis' in window) window.speechSynthesis.cancel() }, [])

  // 字号持久化
  useEffect(() => {
    try { localStorage.setItem('reading_font', readingFont) } catch (e) { /* ignore */ }
  }, [readingFont])

  // 全文朗读 / 停止
  const readArticle = () => {
    if (readingAloudRef.current) {
      readingAloudRef.current = false
      stopSpeak()
      setReadingAloud(false)
      return
    }
    let text = customText ? customText : (pdfPages ? pdfPages.map((p) => p.text).join('\n') : defaultArticleText)
    if (!text || !text.trim()) { setToast('没有可朗读的文本'); return }
    const clean = text.replace(/\s+/g, ' ').trim()
    const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [clean]
    readingAloudRef.current = true
    setReadingAloud(true)
    let i = 0
    const speakNext = () => {
      if (!readingAloudRef.current) return
      if (i >= sentences.length) { readingAloudRef.current = false; setReadingAloud(false); return }
      const u = new SpeechSynthesisUtterance(sentences[i])
      try {
        const rate = parseFloat(localStorage.getItem('tts_rate') || '0.9')
        if (!isNaN(rate) && rate > 0) u.rate = rate
      } catch (e) { /* ignore */ }
      u.onend = () => { i++; speakNext() }
      u.onerror = () => { i++; speakNext() }
      window.speechSynthesis.speak(u)
    }
    speakNext()
  }

  // 导入文本持久化
  useEffect(() => {
    try {
      localStorage.setItem('reading_custom_text', customText)
      localStorage.setItem('reading_custom_title', customTitle)
    } catch (e) { /* ignore */ }
  }, [customText, customTitle])

  // 词卡数据：优先查导入词库，其次内置词条
  const data = selectedWord ? (importedVocab[selectedWord] ? buildEntryData(selectedWord, importedVocab[selectedWord]) : buildWordData(selectedWord)) : null

  // 本地词库没有释义时，用有道词典在线查中文释义
  useEffect(() => {
    if (!selectedWord) { setLookup({ loading: false, mean: '' }); return }
    const local = (wordData[selectedWord] && wordData[selectedWord].meaning) || (importedVocab[selectedWord] && importedVocab[selectedWord].meaning) || basicMeanings[selectedWord] || ''
    if (local) { setLookup({ loading: false, mean: '' }); return }
    let cancelled = false
    setLookup({ loading: true, mean: '' })
    fetchYoudao(selectedWord).then((m) => {
      if (!cancelled) setLookup({ loading: false, mean: m || '' })
    })
    return () => { cancelled = true }
  }, [selectedWord])

  const paragraphs = customText ? customText.split(/\n+/).map(p => p.trim()).filter(Boolean) : []

  // 标记/取消标记一个单词（高亮 + 括号中文释义）；四六级词用固定色，其他词随机选色
  const toggleMark = (key) => {
    setMarks(prev => {
      if (prev.some(m => m.key === key)) return prev.filter(m => m.key !== key)
      const tag = wordData[key] && wordData[key].tag
      const level = importedVocab[key] && importedVocab[key].level
      let color
      if ((tag && tag.includes('四级')) || level === 4) color = 'level-blue'
      else if ((tag && tag.includes('六级')) || level === 6) color = 'level-pink'
      else color = 'rand-' + Math.floor(Math.random() * 6)
      return [...prev, { key, color }]
    })
  }

  // 单击=立即标记/取消标记，双击=弹出词卡（撤销单击的标记切换）
  const clickTimer = useRef(null)
  const clickKey = useRef(null)
  const handleWordClick = (key) => {
    if (clickTimer.current && clickKey.current === key) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      clickKey.current = null
      toggleMark(key)
      setSelectedWord(key)
    } else {
      if (clickTimer.current) clearTimeout(clickTimer.current)
      toggleMark(key)
      clickKey.current = key
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null
        clickKey.current = null
      }, 220)
    }
  }

      const readImportFile = async (event) => {
    const file = event.target.files && event.target.files[0]
    if (!file) return
    setImageImport(null)
    if (/\.pdf$/i.test(file.name)) {
      setImportingPdf(true)
      try {
        const result = await extractPdfFile(file)
        setImportText(result.text)
        setPdfData({ buffer: result.buffer, numPages: result.numPages })
        setPdfPages(result.pages)
        setPreviewUrl('')
        setPreviewPage(1)
        setToast(result.imageCount > 0 ? 'PDF 已解析（含 ' + result.imageCount + ' 张图，可点「查看原页」）' : 'PDF 已解析，可预览后开始阅读')
      } catch (err) {
        setToast('PDF 解析失败：' + ((err && err.message) || '文件可能已加密或损坏'))
      } finally {
        setImportingPdf(false)
      }
    } else if (/\.epub$/i.test(file.name)) {
      setImportingPdf(true)
      try {
        const result = await extractEpubFile(file)
        setImportText(result.text)
        setPdfData(null)
        setPdfPages(null)
        setPreviewUrl('')
        setPreviewPage(1)
        setToast(`EPUB 已解析（共 ${result.chapterCount} 章），可预览后开始阅读`)
      } catch (err) {
        setToast('EPUB 解析失败：' + ((err && err.message) || '文件可能已加密或损坏'))
      } finally {
        setImportingPdf(false)
      }
    } else {
      setPdfData(null)
      setPdfPages(null)
      const reader = new FileReader()
      reader.onload = () => setImportText(String(reader.result || ''))
      reader.readAsText(file)
    }
    event.target.value = ''
  }

  // 图片翻译：选择一张图片（截图/扫描图），可直接框选或整页识别翻译
  const handleImageImport = (event) => {
    const file = event.target.files && event.target.files[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImageImport(reader.result)
      setCustomText('')
      setCustomTitle('')
      setPdfData(null)
      setPdfPages(null)
      setMarks([])
      setPreviewOpen(false)
      setToast('图片已导入，可框选或整页翻译')
    }
    reader.onerror = () => setToast('图片读取失败')
    reader.readAsDataURL(file)
  }

  const openPreview = () => {
    if (!pdfData) return
    setPreviewOpen(true)
    setPreviewPage(1)
    setPreviewUrl('')
    setPreviewError('')
    renderPage(1)
  }

  const renderPage = async (pageNum) => {
    if (!pdfData) return
    setPreviewLoading(true)
    setPreviewError('')
    try {
      const url = await renderPdfPageImage(pdfData.buffer, pageNum, 1800)
      if (!url) throw new Error('渲染返回空')
      setPreviewUrl(url)
    } catch (err) {
      const msg = '原页渲染失败：' + ((err && err.message) || '未知错误')
      setPreviewError(msg)
      setToast(msg)
    } finally {
      setPreviewLoading(false)
    }
  }

  const changePreviewPage = (next) => {
    if (next < 1 || next > pdfData.numPages) return
    setPreviewPage(next)
    setPreviewUrl('')
    renderPage(next)
  }

    const openPagePreview = (pageNum) => {
    setPreviewPage(pageNum)
    setPreviewOpen(true)
    setPreviewUrl('')
    renderPage(pageNum)
  }

  const confirmImport = () => {

    if (!importText.trim()) { setToast('请粘贴或上传文本'); return }
    const title = titleInput.trim() || '导入的英文读物'
    const newArticle = { id: 'custom_' + Date.now(), title, level: '导入 · 自定义', minutes: Math.max(1, Math.round(importText.split(/\s+/).length / 200)) + ' min', text: importText, custom: true }
    const updated = [newArticle, ...customArticles.filter(a => a.title !== title)].slice(0, 50)
    setCustomArticles(updated)
    try { localStorage.setItem('custom_articles', JSON.stringify(updated)) } catch (e) { /* ignore */ }
    setImageImport(null)
    setCustomTitle(title)
    setCustomText(importText)
    setMarks([])
    setSelectedWord(null)
    setShowImport(false)
    setImportText('')
    setTitleInput('')
    if (onArticleStart) onArticleStart()
    setToast('已存入阅读文库，开始阅读')
  }

  const clearCustom = () => {
    setCustomText('')
    setCustomTitle('')
    setMarks([])
    setSelectedWord(null)
    setPdfData(null)
    setPdfPages(null)
    setImageImport(null)
    setPreviewOpen(false)
    setPreviewUrl('')
    setToast('已返回默认文章')
  }

  useEffect(() => {
    const article = document.querySelector('.reading-page .article')
    if (!article) return undefined
    const handleArticleClick = (event) => {
      if (event.target.closest('button, a')) return
      const getRange = document.caretRangeFromPoint || document.caretPositionFromPoint
      if (!getRange) return
      const range = document.caretRangeFromPoint
        ? document.caretRangeFromPoint(event.clientX, event.clientY)
        : (() => {
            const position = document.caretPositionFromPoint(event.clientX, event.clientY)
            if (!position) return null
            const nextRange = document.createRange()
            nextRange.setStart(position.offsetNode, position.offset)
            nextRange.setEnd(position.offsetNode, position.offset)
            return nextRange
          })()
      const node = range?.startContainer
      if (!node || node.nodeType !== Node.TEXT_NODE) return
      const source = node.textContent || ''
      const offset = range.startOffset
      const before = source.slice(0, offset).match(/[A-Za-z][A-Za-z’'-]*$/)?.[0] || ''
      const after = source.slice(offset).match(/^[A-Za-z][A-Za-z’'-]*/)?.[0] || ''
      const clickedWord = before + after
      if (clickedWord) handleWordClick(wordKey(clickedWord))
    }
    article.addEventListener('click', handleArticleClick)
    return () => { article.removeEventListener('click', handleArticleClick); if (clickTimer.current) clearTimeout(clickTimer.current) }
  }, [setSelectedWord])
  return <div className="reading-page fade-in"><div className="reading-toolbar"><div><span className="type-label">ARTICLE 01 · CET-6</span><h1>{customText ? (customTitle || '导入的英文读物') : 'The quiet force of curiosity'}</h1><p>{customText ? '你导入的英文文本，点一下单词就能看释义和发音。' : '为什么我们会提问，以及问题如何改变我们看世界的方式。'}</p></div><div className="article-tools"><span><Clock3 size={15} /> {customText ? `${paragraphs.length} 段` : '6 min read'}</span><span className="mark-count-badge"><Highlighter size={13} /> 已标记 <b>{marks.length}</b> 个词</span><button className="import-text-btn" onClick={() => setShowImport(true)}><Upload size={15} /> 导入文本</button><span className="read-menu-wrap"><button className={`import-text-btn ${showLibrary ? 'active' : ''}`} onClick={() => setShowLibrary(!showLibrary)}><Library size={15} /> 阅读文库</button>{showLibrary && <><div className="read-menu-overlay" onClick={() => setShowLibrary(false)} /><div className="read-menu library-menu"><div className="read-menu-title">阅读文库</div>{customArticles.length > 0 && <><div className="library-section-title">我的导入</div>{customArticles.map((a) => <div key={a.id} className="library-item-wrap"><button className="library-item" onClick={() => loadCustomArticle(a)}><span><strong>{a.title}</strong><small>{a.level} · {a.minutes}</small></span><ArrowUpRight size={14} /></button><button className="library-delete" onClick={(e) => { e.stopPropagation(); deleteCustomArticle(a.id) }}><X size={12} /></button></div>)}</>}{customArticles.length > 0 && <div className="library-section-title">内置文章</div>}{builtinArticles.map((a) => <button key={a.id} className="library-item" onClick={() => loadBuiltin(a)}><span><strong>{a.title}</strong><small>{a.level} · {a.minutes}</small></span><ArrowUpRight size={14} /></button>)}{customText && <button className="library-item" onClick={clearCustom}><span><strong>返回默认文章</strong><small>The quiet force of curiosity</small></span><ArrowUpRight size={14} /></button>}</div></>}</span><button className="import-text-btn" onClick={() => imageInputRef.current && imageInputRef.current.click()}><ScanText size={15} /> 图片翻译</button><input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageImport} style={{ display: 'none' }} />{pdfData && <button className="import-text-btn" onClick={openPreview}><FileImage size={15} /> 查看原页</button>}{pdfData && <button className={`import-text-btn ${pdfNativeMode ? 'primary' : ''}`} onClick={() => setPdfNativeMode(!pdfNativeMode)}>{pdfNativeMode ? '纯文本模式' : '原生PDF'}</button>}{customText && <button className="import-text-btn ghost" onClick={clearCustom}>默认文章</button>}<button className={`icon-button ${readingAloud ? 'active' : ''}`} onClick={readArticle}>{readingAloud ? <Volume2 size={17} /> : <Headphones size={17} />}</button><span className="read-menu-wrap"><button className={`icon-button ${showReadMenu ? 'active' : ''}`} onClick={() => setShowReadMenu(!showReadMenu)}><Settings2 size={17} /></button>{showReadMenu && <><div className="read-menu-overlay" onClick={() => setShowReadMenu(false)} /><div className="read-menu"><div className="read-menu-title">阅读设置</div><div className="read-menu-row"><span>正文字号</span><div className="rate-options">{[{ v: 'sm', l: '小' }, { v: 'md', l: '中' }, { v: 'lg', l: '大' }].map((o) => <button key={o.v} className={readingFont === o.v ? 'active' : ''} onClick={() => setReadingFont(o.v)}>{o.l}</button>)}</div></div></div></>}</span></div></div><div className="reading-layout"><article className={`article reading-font-${readingFont}`} ref={articleRef}><div className="article-meta">{customText ? <><span>导入阅读</span><span>·</span><span>{customTitle || '未命名文本'}</span><span>·</span><span>{paragraphs.length} 段</span></> : <><span>Reading Lab</span><span>·</span><span>难度：六级进阶</span><span>·</span><span>已读 42%</span></>}</div>{imageImport ? <div style={{padding: '16px 0'}}><ImageTranslator src={imageImport} /></div> : (pdfNativeMode && pdfData ? <div style={{padding: '16px 0'}}><PdfViewer buffer={pdfData.buffer} onWordClick={(w) => setSelectedWord(w)} /></div> : (customText ? (pdfPages ? pdfPages.map((pg, i) => <div key={i} className="pdf-page-block">{pg.text.split(/\n+/).map((para) => para.trim()).filter(Boolean).map((para, j) => <p key={j} className={i === 0 && j === 0 ? 'dropcap' : ''}><ArticleText text={para} marks={marks} setSelectedWord={setSelectedWord} extraDict={importedVocab} /></p>)}{pg.thumb ? <figure className="inline-page-fig" onClick={() => openPagePreview(i + 1)}><img src={pg.thumb} alt={'第 ' + (i + 1) + ' 页'} /><figcaption>第 {i + 1} 页 · 点击查看原图</figcaption></figure> : null}</div>) : paragraphs.map((p, i) => <p key={i} className={i === 0 ? 'dropcap' : ''}><ArticleText text={p} marks={marks} setSelectedWord={setSelectedWord} extraDict={importedVocab} /></p>)) : <><p className="dropcap">{articleWords.map((item, index) => {
    if (!item.key) return <React.Fragment key={index}>{item.text} </React.Fragment>
    const mark = marks.find(m => m.key === item.key)
    const marked = !!mark
    const meaning = marked ? ((wordData[item.key] && wordData[item.key].meaning) || basicMeanings[item.key] || '') : ''
    return <button key={index} className={`word-mark ${marked ? mark.color : ''} ${saved.includes(item.key) ? 'saved' : ''}`} onClick={() => setSelectedWord(item.key)}>{item.text}{marked && meaning ? <span className="hl-cn">（{meaning}）</span> : null}</button>
  })}</p><p><ArticleText text="In a world filled with instant answers, the act of asking a question can feel surprisingly powerful. A question slows us down. It creates a small opening through which a new idea can enter." marks={marks} setSelectedWord={setSelectedWord} extraDict={importedVocab} /></p><blockquote>“The important thing is not to stop questioning.”<cite>Albert Einstein</cite></blockquote><h2>A question is a direction</h2><p><ArticleText text="When we ask why, we are not simply looking for information. We are choosing a direction for our attention. That choice is often the beginning of learning." marks={marks} setSelectedWord={setSelectedWord} extraDict={importedVocab} /></p><div className="next-line"><span>下一段还有 4 个六级词汇</span><button className="outline">继续阅读 <ChevronRight size={15} /></button></div></>))}</article></div>{selectedWord && data && createPortal(<><div className="word-popup-overlay" onClick={() => setSelectedWord(null)} /><div className="word-popup" onClick={(event) => event.stopPropagation()}><WordDetail data={data} saved={saved} toggleSave={toggleSave} marks={marks} toggleMark={toggleMark} close={() => setSelectedWord(null)} onlineMeaning={lookup.mean} meaningLoading={lookup.loading} memoryLevels={memoryLevels} markMemorized={markMemorized} /></div></>, document.body)}{showImport && createPortal(<div className="import-overlay" onClick={() => setShowImport(false)}><div className="import-modal" onClick={(event) => event.stopPropagation()}><div className="import-modal-head"><span className="type-label orange">导入英文文本</span><button className="close-button" onClick={() => setShowImport(false)}><X size={16} /></button></div><label className={importingPdf ? 'file-label loading' : 'file-label'} htmlFor="reading-file-input"><Upload size={14} /> {importingPdf ? '解析中…' : '选择 .txt / .pdf / .epub 文件'}</label><input id="reading-file-input" type="file" accept=".txt,.md,.pdf,.epub" onChange={readImportFile} style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden', pointerEvents: 'none' }} /><div className="import-sep">或直接粘贴</div><input className="novel-title" value={titleInput} onChange={(event) => setTitleInput(event.target.value)} placeholder="文章标题（可选）" /><textarea value={importText} onChange={(event) => setImportText(event.target.value)} rows={10} placeholder="把论文 / 英文读物正文粘贴到这里，自动分段。" /><div className="import-modal-actions"><span className="import-tip">支持上传 .txt / .pdf / .epub（自动提取文字），或直接粘贴；导入后点词查词、可标记</span><button className="primary" onClick={confirmImport}>开始阅读</button></div></div></div>, document.body)}{previewOpen && pdfData && createPortal(<div className="import-overlay" onClick={() => setPreviewOpen(false)}><div className="pdf-preview" onClick={(event) => event.stopPropagation()}><div className="pdf-preview-head"><span className="type-label orange">原文预览 · 第 {previewPage} / {pdfData.numPages} 页</span><button className="close-button" onClick={() => setPreviewOpen(false)}><X size={16} /></button></div><div className="pdf-preview-body">{previewLoading ? <div className="pdf-preview-loading">正在渲染这一页…</div> : previewError ? <div className="pdf-preview-error">{previewError}</div> : previewUrl ? <div className="pdf-preview-img-wrap" onClick={() => setFullscreenOpen(true)}><ImageTranslator src={previewUrl} alt={'第 ' + previewPage + ' 页'} /><div className="pdf-preview-zoom-tip"><ZoomIn size={14} /> 点击全屏查看</div></div> : <div className="pdf-preview-loading">请选择页码</div>}</div><div className="pdf-preview-nav"><button className="ghost-button" disabled={previewPage <= 1} onClick={() => changePreviewPage(previewPage - 1)}><ChevronLeft size={15} /> 上一页</button><span>{previewPage} / {pdfData.numPages}</span><button className="ghost-button" disabled={previewPage >= pdfData.numPages} onClick={() => changePreviewPage(previewPage + 1)}>下一页 <ChevronRight size={15} /></button></div></div></div>, document.body)}
{fullscreenOpen && previewUrl && createPortal(<FullscreenImage src={previewUrl} alt={'第 ' + previewPage + ' 页'} onClose={() => setFullscreenOpen(false)} />, document.body)}
</div>
}

// 词性缩写 → 中文全称
function posToCN(pos) {
  if (!pos) return ''
  const map = {
    n: 'n. 名词', v: 'v. 动词', adj: 'adj. 形容词', adv: 'adv. 副词',
    prep: 'prep. 介词', conj: 'conj. 连词', pron: 'pron. 代词',
    interj: 'interj. 感叹词', int: 'interj. 感叹词', num: 'num. 数词',
    art: 'art. 冠词', det: 'det. 限定词', aux: 'aux. 助动词',
    modal: 'modal. 情态动词', vi: 'vi. 不及物动词', vt: 'vt. 及物动词',
  }
  const lower = pos.toLowerCase().trim()
  return map[lower] || (pos + '.')
}

function WordDetail({ data, saved, toggleSave, marks, toggleMark, close, onDelete, onlineMeaning, meaningLoading, detailLoading, memoryLevels, markMemorized, inVocab }) {
  const marked = marks.some(m => m.key === data.word)
  const phoneticText = data.phonetic || (detailLoading ? '查询音标中…' : '点击 🔊 播放发音')
  const exampleText = data.example || (detailLoading ? '查询例句中…' : '暂无例句，在阅读中遇见它时可加入情景复习。')
  const memLevel = memoryLevels ? (memoryLevels[data.word] || 0) : 0
  const memLabel = memLevel >= 4 ? '已掌握 ✓✓✓✓' : memLevel > 0 ? `第${memLevel}次记忆 ${'✓'.repeat(memLevel)} · 再记一次` : '标记为已记忆'
  return <div className="word-detail"><div className="detail-header"><span className="type-label orange">{data.tag}</span><button className="close-button" onClick={close}><X size={16} /></button></div><div className="word-title-row"><h2>{data.word}</h2>{!inVocab && <button className={marked ? 'mark-word-button active' : 'mark-word-button'} onClick={() => toggleMark(data.word)}>{marked ? <><X size={15} /> 取消标记</> : <><Highlighter size={15} /> 标记这个词</>}</button>}</div><div className="pronounce">{data.partOfSpeech && <span className="pos-tag">{posToCN(data.partOfSpeech)}</span>}<span className={detailLoading && !data.phonetic ? 'lookup-loading' : ''}>{phoneticText}</span><button onClick={() => speak(data.word)}><Volume2 size={17} /></button></div>{meaningLoading ? <p className="meaning"><span className="lookup-loading">正在查询释义…</span></p> : <p className="meaning">{onlineMeaning || data.meaning}</p>}<div className="stress"><span>重音</span><b>{data.stress}</b></div>{data.breakdown && <div className="breakdown-box"><span>词根词缀 / MORPHEMES</span><p>{data.breakdown}</p></div>}<div className="root-box"><span>词根 / ROOT</span><strong>{data.root}</strong><small>{data.rootMeaning}</small></div><div className="scene-box"><span>情景记忆 / SCENE</span><p>{data.scene}</p></div><div className="example"><span>EXAMPLE</span><p className={detailLoading && !data.example ? 'lookup-loading' : ''}>{exampleText}</p></div><button className={`memorize-button mem-level-${memLevel}${memLevel >= 4 ? ' mastered' : ''}`} onClick={() => { if (markMemorized && memLevel < 4) { markMemorized(data.word); close(); } }} disabled={memLevel >= 4}><span className="mem-dots">{'●'.repeat(memLevel)}{'○'.repeat(4 - memLevel)}</span>{memLabel}</button>{!inVocab && <button className={saved.includes(data.word) ? 'save-button saved-button' : 'save-button'} onClick={() => toggleSave(data.word, data)}>{saved.includes(data.word) ? <><Check size={16} /> 已在词汇库</> : <><Plus size={16} /> 加入词汇库</>}</button>}{onDelete && <button className="delete-button" onClick={() => onDelete(data.word)}><Trash2 size={15} /> 删除这个词</button>}</div>
}

// ===== 融合阅读：导入四六级词汇 + 小说，自动标注融合 =====

// 解析用户导入的词汇文本，支持多种行格式：word / word 释义 / word,释义 / 四级 word 释义 / word,六级,释义
function parseVocab(text) {
  const dict = {}
  text.split('\n').forEach((rawLine) => {
    const line = rawLine.trim()
    if (!line) return
    let level = 0
    if (/六级|CET6|cet6/.test(line)) level = 6
    else if (/四级|CET4|cet4/.test(line)) level = 4
    const clean = line.replace(/[（(]?[四六]级[)）]?|[（(]?CET[46][)）]?/gi, ' ').trim()
    const wordMatch = clean.match(/[A-Za-z][A-Za-z’'\-]*/)
    if (!wordMatch) return
    const word = wordMatch[0]
    let rest = clean.slice(wordMatch.index + wordMatch[0].length).replace(/^[\s,，:：、.。;；|]+/, '').trim()
    // 提取音标（/.../ 格式，例如 /ˈækses/）
    let phonetic = ''
    const phoneticMatch = rest.match(/\/([^\/\n]+)\//)
    if (phoneticMatch) {
      phonetic = '/' + phoneticMatch[1].trim() + '/'
      rest = rest.replace(phoneticMatch[0], '').replace(/^[\s,，:：、.。;；|]+/, '').trim()
    }
    let meaning = rest.replace(/^(n\.|v\.|adj\.|adv\.|vt\.|vi\.|prep\.|conj\.|pron\.|num\.|art\.|int\.|abbr\.|n|v|adj|adv|vt|vi|prep|conj|pron|num|art|int|abbr)[.、]?\s*/i, '').trim()
    const key = word.toLowerCase().replace(/[^a-z]/g, '')
    if (!key || dict[key]) return
    dict[key] = { word, meaning, level, key, phonetic }
  })
  return dict
}

// 变形匹配：支持 -s/-es/-ed/-ing/-d/-ies/-ied 等常见变形
function matchVocab(base, dict) {
  if (dict[base]) return dict[base]
  const stems = [base.replace(/ies$/, 'y'), base.replace(/ied$/, 'y'), base.replace(/ves$/, 'f'),
    base.replace(/es$/, ''), base.replace(/s$/, ''), base.replace(/ing$/, ''), base.replace(/ed$/, 'e'),
    base.replace(/ed$/, ''), base.replace(/d$/, '')]
  for (const s of stems) if (s && dict[s]) return dict[s]
  return null
}

// ===== 中英混排：中文词 → 英文词映射 =====
const DIFFICULTY_LEVELS = [
  { id: 1, label: '入门', ratio: 0.15 },
  { id: 2, label: '初级', ratio: 0.30 },
  { id: 3, label: '中级', ratio: 0.50 },
  { id: 4, label: '高级', ratio: 0.70 },
  { id: 5, label: '挑战', ratio: 1.00 },
]
function extractCNWords(meaning) {
  if (!meaning) return []
  let clean = String(meaning).replace(/^(n|v|adj|adv|vt|vi|prep|conj|pron|num|art|int|abbr|a|ad|aux)[.\s、]*/gi, '').replace(/[（(][^）)]*[）)]/g, '')
  const parts = clean.split(/[；;，,、\/]/).map(s => s.trim()).filter(Boolean)
  return parts.filter(p => /^[\u4e00-\u9fa5]{2,6}$/.test(p))
}
function buildCN2ENMap(vocabDict, levelFilter) {
  const map = {}
  Object.entries(vocabDict || {}).forEach(([key, entry]) => {
    if (!entry || !entry.meaning) return
    if (levelFilter && entry.level !== levelFilter) return
    extractCNWords(entry.meaning).forEach(cn => {
      if (!map[cn]) map[cn] = { en: entry.word, key: entry.key || key, level: entry.level || 0, meaning: entry.meaning, phonetic: entry.phonetic || '', cn }
    })
  })
  return map
}
function findCNMatches(text, cn2enMap) {
  const matches = []
  const keys = Object.keys(cn2enMap)
  if (!keys.length) return matches
  const maxLen = Math.max(...keys.map(k => k.length))
  let i = 0
  while (i < text.length) {
    let found = null
    for (let len = Math.min(maxLen, text.length - i); len >= 2; len--) {
      const slice = text.slice(i, i + len)
      if (cn2enMap[slice]) { found = cn2enMap[slice]; break }
    }
    if (found) { matches.push({ start: i, end: i + found.cn.length, ...found }); i += found.cn.length } else { i++ }
  }
  return matches
}
function strHash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0 }
  return Math.abs(h)
}

function FusionPage({ saved, toggleSave, setToast, importedVocab }) {
  const [mode, setMode] = useState('cn')
  const [vocabLevel, setVocabLevel] = useState('all')
  const [novelInput, setNovelInput] = useState('')
  const [title, setTitle] = useState('')
  const [showMeaning, setShowMeaning] = useState(false)
  const [difficulty, setDifficulty] = useState(3)
  const [fused, setFused] = useState(null)
  const [selected, setSelected] = useState(null)
  const [marks, setMarks] = useState([])
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [revealedIds, setRevealedIds] = useState(() => new Set())
  const [vocabInput, setVocabInput] = useState('')

  useEffect(() => {
    try {
      const m = localStorage.getItem('fusion_mode'); if (m) setMode(m)
      const lv = localStorage.getItem('fusion_cn_level'); if (lv) setVocabLevel(lv)
      const n = localStorage.getItem('fusion_novel'); if (n) setNovelInput(n)
      const t = localStorage.getItem('fusion_title'); if (t) setTitle(t)
      const d = localStorage.getItem('fusion_diff'); if (d) setDifficulty(parseInt(d, 10))
      const v = localStorage.getItem('fusion_vocab'); if (v) setVocabInput(v)
    } catch (e) { /* ignore */ }
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem('fusion_mode', mode)
      localStorage.setItem('fusion_cn_level', vocabLevel)
      localStorage.setItem('fusion_novel', novelInput)
      localStorage.setItem('fusion_title', title)
      localStorage.setItem('fusion_diff', String(difficulty))
      localStorage.setItem('fusion_vocab', vocabInput)
    } catch (e) { /* ignore */ }
  }, [mode, vocabLevel, novelInput, title, difficulty, vocabInput])

  const toggleMark = (key) => {
    setMarks(prev => prev.some(m => m.key === key) ? prev.filter(m => m.key !== key) : [...prev, { key, color: 'level-blue' }])
  }

  const readFile = (event, setter, titleSetter) => {
    const file = event.target.files && event.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setToast('文件过大，请选择 10MB 以内的文件'); event.target.value = ''; return }
    const ext = file.name.split('.').pop().toLowerCase()
    const textExts = ['txt', 'csv', 'md', 'json', 'srt', 'lrc', 'text']
    const baseName = file.name.replace(/\.[^.]+$/, '')

    if (ext === 'pdf') {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          if (!GlobalWorkerOptions.workerSrc) GlobalWorkerOptions.workerSrc = pdfWorker
          const pdf = await getDocument({ data: reader.result }).promise
          let text = ''
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const content = await page.getTextContent()
            text += content.items.map(it => it.str).join(' ') + '\n\n'
          }
          setter(text.trim())
          if (titleSetter) titleSetter(baseName)
          setToast(`已导入 PDF：${file.name}（${pdf.numPages} 页，${text.trim().length} 字）`)
        } catch (e) { setToast('PDF 读取失败，请尝试文本文件'); console.error(e) }
      }
      reader.readAsArrayBuffer(file)
    } else if (textExts.includes(ext)) {
      const reader = new FileReader()
      reader.onload = () => {
        const buffer = reader.result
        let text = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
        const badCount = (text.match(/\uFFFD/g) || []).length
        if (badCount > Math.max(3, text.length * 0.005)) {
          try { text = new TextDecoder('gbk').decode(buffer) } catch (e) { /* keep utf-8 */ }
        }
        setter(text)
        if (titleSetter) titleSetter(baseName)
        setToast(`已导入：${file.name}（${text.length} 字）`)
      }
      reader.readAsArrayBuffer(file)
    } else {
      setToast('不支持的格式，请上传 .txt / .csv / .md / .pdf 文件')
    }
    event.target.value = ''
  }

  // ===== 中文替换模式 =====
  const runCNFusion = () => {
    if (!novelInput.trim()) { setToast('请先粘贴或上传中文文本'); return }
    const levelFilter = vocabLevel === '4' ? 4 : vocabLevel === '6' ? 6 : null
    const cn2en = buildCN2ENMap(importedVocab, levelFilter)
    if (!Object.keys(cn2en).length) { setToast('词库为空，请先在「词汇库」导入四六级词库'); return }
    const paragraphs = novelInput.split(/\n+/).map(p => p.trim()).filter(Boolean)
    if (!paragraphs.length) { setToast('文本为空'); return }
    const paraMatches = paragraphs.map(p => findCNMatches(p, cn2en))
    const totalMatches = paraMatches.reduce((s, m) => s + m.length, 0)
    const uniqueWords = new Set(paraMatches.flat().map(m => m.key)).size
    if (!totalMatches) { setToast('这段文本中没有找到可替换的四六级词汇，试试换一段文本'); return }
    const seed = strHash(novelInput.slice(0, 500)) + shuffleSeed
    setFused({ mode: 'cn', paragraphs, paraMatches, cn2en, title: title.trim() || '导入文本', totalMatches, uniqueWords, seed })
    setRevealedIds(new Set())
    setSelected(null)
    const pct = Math.round(DIFFICULTY_LEVELS[difficulty - 1].ratio * 100)
    setToast(`融合完成：找到 ${totalMatches} 处可替换词（${uniqueWords} 个不同单词），当前替换 ${pct}%`)
  }

  const replacedSets = useMemo(() => {
    if (!fused || fused.mode !== 'cn') return []
    const ratio = DIFFICULTY_LEVELS[difficulty - 1].ratio
    return fused.paraMatches.map((matches, paraIdx) => {
      const count = ratio >= 1 ? matches.length : Math.ceil(matches.length * ratio)
      const indexed = matches.map((m, i) => ({ i, sort: (strHash(fused.seed + '_' + paraIdx + '_' + i) % 10000) / 10000 }))
      indexed.sort((a, b) => a.sort - b.sort)
      return new Set(indexed.slice(0, count).map(x => x.i))
    })
  }, [fused, difficulty])
  const markKeys = useMemo(() => new Set(marks.map(m => m.key)), [marks])

  const reshuffle = () => {
    const newSeed = shuffleSeed + 1
    setShuffleSeed(newSeed)
    if (fused && fused.mode === 'cn') {
      setFused(prev => ({ ...prev, seed: strHash(novelInput.slice(0, 500)) + newSeed }))
    }
    setToast('已重新洗牌，换了一批词替换')
  }

  const toggleReveal = (id, entry, sentence, paraIdx) => {
    setRevealedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setSelected(buildCNWordData(entry, sentence, paraIdx))
  }

  const buildCNWordData = (entry, sentence, paraIdx) => ({
    word: entry.en,
    phonetic: entry.phonetic || '点击 🔊 播放发音',
    stress: '按音节自然重读',
    meaning: entry.meaning,
    root: 'imported',
    rootMeaning: entry.level === 6 ? '六级词汇' : entry.level === 4 ? '四级词汇' : '四六级词汇',
    scene: `在《${fused.title}》第 ${paraIdx + 1} 段出现：原文"${entry.cn}"`,
    example: sentence,
    tag: entry.level === 6 ? '六级词汇' : entry.level === 4 ? '四级词汇' : '四六级词汇',
  })

  const renderCNPara = (text, paraIdx) => {
    const matches = fused.paraMatches[paraIdx] || []
    const replacedSet = replacedSets[paraIdx] || new Set()
    const nodes = []
    let lastEnd = 0
    matches.forEach((m, idx) => {
      if (m.start > lastEnd) nodes.push(<span key={`t${idx}`}>{text.slice(lastEnd, m.start)}</span>)
      const isReplaced = replacedSet.has(idx)
      const color = m.level === 4 ? 'level-blue' : m.level === 6 ? 'level-pink' : 'rand-' + (m.en.length % 6)
      const marked = markKeys.has(m.key)
      if (isReplaced) {
        const wordId = paraIdx + '_' + idx
        const isRevealed = revealedIds.has(wordId)
        nodes.push(
          <button key={`w${idx}`} className={`hl-mark ${color} ${marked ? 'fusion-marked' : ''} ${isRevealed ? 'cn-revealed' : ''}`} onClick={() => toggleReveal(wordId, m, text, paraIdx)}>
            <span className="hl-word">{m.en}</span>
            {(showMeaning || isRevealed) && <span className="hl-cn">（{m.cn}）</span>}
          </button>
        )
      } else {
        nodes.push(<span key={`c${idx}`}>{m.cn}</span>)
      }
      lastEnd = m.end
    })
    if (lastEnd < text.length) nodes.push(<span key="tail">{text.slice(lastEnd)}</span>)
    return nodes
  }

  // ===== 英文高亮模式 =====
  const runENFusion = () => {
    if (!vocabInput.trim() || !novelInput.trim()) { setToast('请先粘贴或上传四六级词汇和小说正文'); return }
    const dict = parseVocab(vocabInput)
    if (!Object.keys(dict).length) { setToast('没有识别到有效词汇，请检查格式（每行一个词）'); return }
    const paragraphs = novelInput.split(/\n+/).map(p => p.trim()).filter(Boolean)
    if (!paragraphs.length) { setToast('小说正文为空'); return }
    let totalHits = 0
    const hitWords = new Set()
    paragraphs.forEach(p => {
      p.split(/(\b[A-Za-z][A-Za-z\u2019'-]*\b)/g).forEach(t => {
        if (!/[A-Za-z]/.test(t)) return
        const entry = matchVocab(t.toLowerCase().replace(/[^a-z]/g, ''), dict)
        if (entry) { totalHits++; hitWords.add(entry.key) }
      })
    })
    setFused({ mode: 'en', dict, paragraphs, title: title.trim() || '导入小说', totalHits, hitCount: hitWords.size })
    setSelected(null)
    setToast(`融合完成：识别到 ${hitWords.size} 个四六级词汇，共出现 ${totalHits} 次`)
  }

  const buildENWordData = (entry, sentence, paragraphIndex) => ({
    word: entry.key, phonetic: '在小说中听发音', stress: '按音节自然重读',
    meaning: entry.meaning || '根据小说语境理解', root: 'imported',
    rootMeaning: '四六级词汇 · 已导入',
    scene: `在《${fused.title}》第 ${paragraphIndex + 1} 段出现：${sentence.slice(0, 50)}${sentence.length > 50 ? '\u2026' : ''}`,
    example: sentence, tag: entry.level === 6 ? '六级词汇' : entry.level === 4 ? '四级词汇' : '四六级词汇',
  })

  const tokenizeENPara = (text, paragraphIndex) => {
    const tokens = text.split(/(\b[A-Za-z][A-Za-z\u2019'-]*\b)/g)
    return tokens.map((token, i) => {
      if (!/[A-Za-z]/.test(token)) return <React.Fragment key={i}>{token}</React.Fragment>
      const base = token.toLowerCase().replace(/[^a-z]/g, '')
      const entry = matchVocab(base, fused.dict)
      if (!entry) return <React.Fragment key={i}>{token}</React.Fragment>
      const color = entry.level === 4 ? 'level-blue' : entry.level === 6 ? 'level-pink' : 'rand-' + (base.length % 6)
      const marked = marks.some(m => m.key === entry.key)
      return (
        <button key={i} className={`hl-mark ${color} ${marked ? 'fusion-marked' : ''}`} onClick={() => setSelected(buildENWordData(entry, text, paragraphIndex))}>
          <span className="hl-word">{token}</span>
          {showMeaning && entry.meaning ? <span className="hl-cn">（{entry.meaning}）</span> : null}
        </button>
      )
    })
  }

  const cn4Count = Object.values(importedVocab || {}).filter(e => e.level === 4).length
  const cn6Count = Object.values(importedVocab || {}).filter(e => e.level === 6).length

  const currentReplacedCount = useMemo(() => {
    if (!replacedSets.length) return 0
    return replacedSets.reduce((s, set) => s + set.size, 0)
  }, [replacedSets])

  return (
    <div className="fusion-page fade-in">
      <div className="reading-toolbar">
        <div>
          <span className="type-label">FUSION READING · 中英混排阅读</span>
          <h1>在中文里，<i>遇见英文单词。</i></h1>
          <p>选择四六级词汇表，导入中文文本，自动把部分中文词替换成英文，在阅读中自然记单词。</p>
        </div>
        <div className="article-tools">
          <span className="mark-count-badge"><Highlighter size={13} /> 已标记 <b>{marks.length}</b> 个词</span>
        </div>
      </div>

      <div className="fusion-mode-switch">
        <button className={mode === 'cn' ? 'active' : ''} onClick={() => { setMode('cn'); setFused(null) }}>
          <Languages size={15} /> 中文替换模式
        </button>
        <button className={mode === 'en' ? 'active' : ''} onClick={() => { setMode('en'); setFused(null) }}>
          <BookOpen size={15} /> 英文高亮模式
        </button>
      </div>

      {!fused ? (
        mode === 'cn' ? (
          <div className="fusion-import cn-import">
            <div className="import-card">
              <div className="import-head"><span className="type-label orange">STEP 1 · 选择词汇表</span></div>
              <div className="vocab-level-picker">
                <button className={vocabLevel === '4' ? 'active' : ''} onClick={() => setVocabLevel('4')}>四级词汇<small>{cn4Count} 词</small></button>
                <button className={vocabLevel === '6' ? 'active' : ''} onClick={() => setVocabLevel('6')}>六级词汇<small>{cn6Count} 词</small></button>
                <button className={vocabLevel === 'all' ? 'active' : ''} onClick={() => setVocabLevel('all')}>全部四六级<small>{cn4Count + cn6Count} 词</small></button>
              </div>
              <small>从已导入的词库中选择，释义会被自动提取用于在中文文本中匹配。</small>
            </div>

            <div className="import-card">
              <div className="import-head">
                <span className="type-label orange">STEP 2 · 中文文本</span>
                <div className="import-head-actions">
                  <label className="file-label"><Upload size={14} /> 上传文件
                    <input type="file" accept=".txt,.csv,.md,.pdf" style={{ display: 'none' }} onChange={(e) => readFile(e, setNovelInput, setTitle)} />
                  </label>
                  {novelInput && <button type="button" className="clear-text-btn" onClick={() => { setNovelInput(''); setTitle('') }}><X size={12} /> 清空</button>}
                </div>
              </div>
              <input className="novel-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="文本标题（可选）" />
              <textarea value={novelInput} onChange={(e) => setNovelInput(e.target.value)} rows={10} placeholder="把中文小说、文章或任何中文文本粘贴到这里，或点击上方上传 .txt / .csv / .md / .pdf 文件。系统会自动识别其中的四六级词汇并替换成英文。" />
              <small>支持 .txt / .csv / .md / .pdf 上传，自动识别 UTF-8 / GBK 编码；每次换行视为一个段落{novelInput.trim() ? ` · ${novelInput.trim().length} 字 · ${novelInput.trim().split(/\n+/).filter(Boolean).length} 段` : ''}{novelInput.trim().length > 50000 ? ' · 文本较长，建议分章导入以获得最佳体验' : ''}</small>
            </div>

            <div className="import-card difficulty-card">
              <div className="import-head"><span className="type-label orange">STEP 3 · 难度挡位</span></div>
              <div className="difficulty-picker">
                {DIFFICULTY_LEVELS.map(d => (
                  <button key={d.id} className={difficulty === d.id ? 'active' : ''} onClick={() => setDifficulty(d.id)}>
                    <strong>{d.label}</strong><small>{Math.round(d.ratio * 100)}%</small>
                  </button>
                ))}
              </div>
              <small>控制中文词被替换成英文的比例。入门 15% 适合刚开始，挑战 100% 全部替换。</small>
            </div>

            <button className="primary fusion-run" onClick={runCNFusion}><Merge size={17} /> 开始融合阅读</button>
          </div>
        ) : (
          <div className="fusion-import">
            <div className="import-card">
              <div className="import-head">
                <span className="type-label orange">STEP 1 · 四六级词汇</span>
                <div className="import-head-actions">
                  <label className="file-label"><Upload size={14} /> 上传文件
                    <input type="file" accept=".txt,.csv,.md" style={{ display: 'none' }} onChange={(e) => readFile(e, setVocabInput)} />
                  </label>
                  {vocabInput && <button type="button" className="clear-text-btn" onClick={() => setVocabInput('')}><X size={12} /> 清空</button>}
                </div>
              </div>
              <textarea value={vocabInput} onChange={(e) => setVocabInput(e.target.value)} rows={8} placeholder={'每行一个词，例如：\nabandon 放弃\n四级 vanish 消失\n六级 anticipate 预期\n或上传 .txt / .csv 词汇表文件'} />
              <small>格式：单词 + 释义（空格 / 逗号 / Tab 分隔均可）；行内写"四级"或"六级"会按级别标色；支持 .txt / .csv / .md 上传</small>
            </div>
            <div className="import-card">
              <div className="import-head">
                <span className="type-label orange">STEP 2 · 英文小说正文</span>
                <div className="import-head-actions">
                  <label className="file-label"><Upload size={14} /> 上传文件
                    <input type="file" accept=".txt,.csv,.md,.pdf" style={{ display: 'none' }} onChange={(e) => readFile(e, setNovelInput, setTitle)} />
                  </label>
                  {novelInput && <button type="button" className="clear-text-btn" onClick={() => { setNovelInput(''); setTitle('') }}><X size={12} /> 清空</button>}
                </div>
              </div>
              <input className="novel-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="小说标题（可选，上传文件后自动填充）" />
              <textarea value={novelInput} onChange={(e) => setNovelInput(e.target.value)} rows={12} placeholder="把英文小说正文粘贴到这里，或上传 .txt / .csv / .md / .pdf 文件，会自动分段并高亮四六级词汇。" />
              <small>支持 .txt / .csv / .md / .pdf 上传，自动识别编码；每次换行视为一个段落{novelInput.trim() ? ` · ${novelInput.trim().length} 词` : ''}</small>
            </div>
            <button className="primary fusion-run" onClick={runENFusion}><Merge size={17} /> 开始融合</button>
          </div>
        )
      ) : (
        <div className="reading-layout fusion-layout">
          <article className="article fusion-article">
            <div className="article-meta">
              <span>{fused.title}</span><span>·</span>
              {fused.mode === 'cn' ? (
                <><span>找到 {fused.totalMatches} 处可替换</span><span>·</span><span>{fused.uniqueWords} 个不同单词</span><span>·</span><span>已替换 {currentReplacedCount} 处</span></>
              ) : (
                <><span>识别 {fused.hitCount} 个四六级词</span><span>·</span><span>{fused.totalHits} 处出现</span></>
              )}
            </div>
            <div className="fusion-controls">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {fused.mode === 'cn' && (
                  <div className="difficulty-inline">
                    {DIFFICULTY_LEVELS.map(d => (
                      <button key={d.id} className={difficulty === d.id ? 'active' : ''} onClick={() => setDifficulty(d.id)}>
                        {d.label} {Math.round(d.ratio * 100)}%
                      </button>
                    ))}
                    <button className="reshuffle-btn" onClick={reshuffle}><RotateCcw size={13} /> 换一批</button>
                  </div>
                )}
                <label className="toggle"><input type="checkbox" checked={showMeaning} onChange={(e) => setShowMeaning(e.target.checked)} /> 显示中文释义</label>
              </div>
              <button className="text-button" onClick={() => setFused(null)}>
                {fused.mode === 'cn' ? '换一篇文本' : '换一部小说'} <ArrowUpRight size={14} />
              </button>
            </div>
            {fused.paragraphs.map((p, pi) => (
              <p key={pi}>{fused.mode === 'cn' ? renderCNPara(p, pi) : tokenizeENPara(p, pi)}</p>
            ))}
          </article>
          <aside className="context-panel">
            {selected ? (
              <WordDetail data={selected} saved={saved} toggleSave={toggleSave} marks={marks} toggleMark={toggleMark} close={() => setSelected(null)} />
            ) : (
              <>
                <div className="panel-intro">
                  <Sparkles size={18} />
                  <strong>点一下文本里的<br />高亮词汇。</strong>
                  <p>{fused.mode === 'cn' ? '四级词标蓝、六级词标粉。英文词替换了原文中的中文释义，点击查看完整词卡。' : '四级词标蓝、六级词标粉。释义和语境例句都来自这部小说。'}</p>
                </div>
                <div className="context-note">
                  <span>HOW IT WORKS</span>
                  <p>{fused.mode === 'cn' ? '系统从四六级词库提取中文释义，在你的中文文本中匹配并替换成英文。调节难度挡位控制替换比例，在阅读中自然记忆单词。' : '你的词汇表会被自动匹配到小说原文里：生词不再孤立，而是在故事里遇见。'}</p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}


function WordsPage({ saved, toggleSave, importedVocab, readingVocab, addImported, removeImported, setToast, memoryLevels, markMemorized }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [marks, setMarks] = useState([])
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [category, setCategory] = useState('all')
  const [memFilter, setMemFilter] = useState('all')
  const [detailCache, setDetailCache] = useState({})
  const [detailLoading, setDetailLoading] = useState(false)

  // ===== 今日复习计划 =====
  const todayKey = localDateKey()
  const [reviewedToday, setReviewedToday] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('reviewed_today') || '{}')
      return saved.date === todayKey ? (saved.words || []) : []
    } catch (e) { return [] }
  })
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [reviewSessionList, setReviewSessionList] = useState([])  // 当前复习会话的固定单词列表，避免索引跳词
  const [reviewCount, setReviewCount] = useState(() => {
    try { return parseInt(localStorage.getItem('review_count') || '10', 10) } catch (e) { return 10 }
  })
  const [reviewLevels, setReviewLevels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('review_levels') || '[1]') } catch (e) { return [1] }
  })

  // 持久化复习设置
  useEffect(() => {
    try { localStorage.setItem('review_count', String(reviewCount)) } catch (e) { /* ignore */ }
  }, [reviewCount])
  useEffect(() => {
    try { localStorage.setItem('review_levels', JSON.stringify(reviewLevels)) } catch (e) { /* ignore */ }
  }, [reviewLevels])

  const toggleReviewLevel = (lv) => {
    setReviewLevels(prev => prev.includes(lv) ? prev.filter(l => l !== lv) : [...prev, lv])
  }

  // 智能选词：从用户选中的记忆等级中选，随机打乱，取前 reviewCount 个
  const reviewWords = useMemo(() => {
    if (!reviewLevels.length) return []
    const candidates = Object.entries(memoryLevels).filter(([_, v]) => reviewLevels.includes(v)).map(([k]) => k)
    const shuffled = [...candidates].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(reviewCount, shuffled.length))
  }, [memoryLevels, reviewCount, reviewLevels])

  const reviewRemaining = reviewWords.filter(w => !reviewedToday.includes(w))
  const reviewEstMins = Math.max(1, Math.ceil(reviewRemaining.length * 1.2))

  // 持久化今日已复习
  useEffect(() => {
    try { localStorage.setItem('reviewed_today', JSON.stringify({ date: todayKey, words: reviewedToday })) } catch (e) { /* ignore */ }
  }, [reviewedToday, todayKey])

  const startReview = () => {
    if (!reviewRemaining.length) { setToast('今日复习已全部完成！'); return }
    setReviewSessionList([...reviewRemaining])
    setReviewIndex(0)
    setReviewMode(true)
  }
  const markReviewed = (word, known) => {
    if (!reviewedToday.includes(word)) {
      setReviewedToday(prev => [...prev, word])
    }
    if (known) {
      const cur = memoryLevels[word] || 0
      if (cur < 4) markMemorized(word, Math.min(4, cur + 1))
    }
    const nextIdx = reviewIndex + 1
    if (nextIdx >= reviewSessionList.length) {
      setReviewMode(false)
      setToast(`今日复习完成！共复习 ${reviewSessionList.length} 个词`)
    } else {
      setReviewIndex(nextIdx)
    }
  }
  const currentReviewWord = reviewSessionList[reviewIndex]

  const toggleMark = (key) => {
    setMarks(prev => prev.some(m => m.key === key) ? prev.filter(m => m.key !== key) : [...prev, { key, color: 'level-blue' }])
  }

  // 词库 = 内置词条 + 用户导入的四六级词汇
  const allData = {}
  // 先放导入词汇（调用 buildEntryData 自动分析词根词缀/生成情境），内置词汇后写入——内置词汇信息更完整
  Object.entries(importedVocab).forEach(([key, entry]) => {
    allData[key] = buildEntryData(key, entry)
  })
  Object.entries(wordData).forEach(([key, d]) => { allData[key] = d })
  // 阅读难词：加入词汇库时保存的词卡（含从阅读弹窗加入的词）
  Object.entries(readingVocab).forEach(([key, entry]) => {
    if (!allData[key]) allData[key] = { ...entry, word: entry.word || key, tag: entry.tag || '阅读难词' }
  })
  // 兜底：收藏列表里没有词卡数据的词，也生成基础词卡，保证阅读难词表可见
  saved.forEach((key) => {
    if (!allData[key]) allData[key] = buildWordData(key)
  })
  const words = Object.keys(allData).filter((key) => !search || key.includes(search.toLowerCase()))
  const currentReviewData = currentReviewWord ? allData[currentReviewWord] : null

  // 词汇分类：高频（旧2000词）/ 核心（新5000词），重叠词同时属于两类
  const isHigh = (e) => e && (e.category === 'high' || e.category === 'both')
  const isCore = (e) => e && (e.category === 'core' || e.category === 'both')
  const cet4HighCount = Object.values(importedVocab).filter(e => e.level === 4 && isHigh(e)).length
  const cet6HighCount = Object.values(importedVocab).filter(e => e.level === 6 && isHigh(e)).length
  const cet4CoreCount = Object.values(importedVocab).filter(e => e.level === 4 && isCore(e)).length
  const cet6CoreCount = Object.values(importedVocab).filter(e => e.level === 6 && isCore(e)).length
  const readingCount = saved.filter(k => allData[k]).length

  // 各分类掌握进度（高频/核心/阅读）
  const cet4HighWords = Object.keys(importedVocab).filter(k => importedVocab[k].level === 4 && isHigh(importedVocab[k]))
  const cet6HighWords = Object.keys(importedVocab).filter(k => importedVocab[k].level === 6 && isHigh(importedVocab[k]))
  const cet4CoreWords = Object.keys(importedVocab).filter(k => importedVocab[k].level === 4 && isCore(importedVocab[k]))
  const cet6CoreWords = Object.keys(importedVocab).filter(k => importedVocab[k].level === 6 && isCore(importedVocab[k]))
  const readingWords = saved.filter(k => allData[k])
  const calcMastery = (list) => {
    const total = list.length
    const mastered = list.filter(k => (memoryLevels[k] || 0) >= 4).length
    return { total, mastered, pct: total ? Math.round(mastered / total * 100) : 0 }
  }
  const cet4HighMastery = calcMastery(cet4HighWords)
  const cet6HighMastery = calcMastery(cet6HighWords)
  const cet4CoreMastery = calcMastery(cet4CoreWords)
  const cet6CoreMastery = calcMastery(cet6CoreWords)
  const readingMastery = calcMastery(readingWords)
  const categoryTabs = [
    { id: 'all', label: '全部', count: words.length },
    { id: 'cet4-high', label: '四级高频词汇', count: cet4HighCount },
    { id: 'cet6-high', label: '六级高频词汇', count: cet6HighCount },
    { id: 'cet4-core', label: '四级核心词汇', count: cet4CoreCount },
    { id: 'cet6-core', label: '六级核心词汇', count: cet6CoreCount },
    { id: 'reading', label: '阅读难词表', count: readingCount },
  ]

  // 记忆等级统计：0=未记忆, 1/2/3=第N次记忆, 4=已掌握
  const memCounts = [0, 0, 0, 0, 0]
  words.forEach(key => {
    const lv = memoryLevels[key] || 0
    memCounts[Math.min(lv, 4)]++
  })
  const masteredCount = memCounts[4]
  const memoryProgress = words.length ? Math.round((memCounts[1] + memCounts[2] * 2 + memCounts[3] * 3 + memCounts[4] * 4) / (words.length * 4) * 100) : 0
  const memTabs = [
    { id: 'all', label: '全部', count: words.length },
    { id: '0', label: '未记忆', count: memCounts[0] },
    { id: '1', label: '第1次记忆', count: memCounts[1] },
    { id: '2', label: '第2次记忆', count: memCounts[2] },
    { id: '3', label: '第3次记忆', count: memCounts[3] },
    { id: '4', label: '已掌握', count: memCounts[4] },
  ]

  const visibleWords = words.filter((key) => {
    const e = importedVocab[key]
    if (category === 'cet4-high') return e && e.level === 4 && isHigh(e)
    if (category === 'cet6-high') return e && e.level === 6 && isHigh(e)
    if (category === 'cet4-core') return e && e.level === 4 && isCore(e)
    if (category === 'cet6-core') return e && e.level === 6 && isCore(e)
    if (category === 'reading') return saved.includes(key)
    return true
  }).filter((key) => {
    const lv = memoryLevels[key] || 0
    if (memFilter === '0') return lv === 0
    if (memFilter === '1') return lv === 1
    if (memFilter === '2') return lv === 2
    if (memFilter === '3') return lv === 3
    if (memFilter === '4') return lv >= 4
    return true
  })
  const currentCategory = categoryTabs.find(t => t.id === category) || categoryTabs[0]

  const readImportFile = (event) => {
    const file = event.target.files && event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImportText(String(reader.result || ''))
    reader.readAsText(file)
    event.target.value = ''
  }

  const doImport = () => {
    if (!importText.trim()) { setToast('请先选择文件或粘贴词汇内容'); return }
    const dict = parseVocab(importText)
    const keys = Object.keys(dict)
    if (!keys.length) { setToast('未识别到有效词汇，请检查格式'); return }
    addImported(dict)
    setToast(`已导入 ${keys.length} 个词汇`)
    setShowImport(false)
    setImportText('')
  }

  const doExport = (mode) => {
    let source = allData
    if (mode === 'imported') {
      source = {}
      Object.entries(importedVocab).forEach(([key, entry]) => {
        source[key] = { ...entry, word: entry.word || key, meaning: entry.meaning || '', level: entry.level }
      })
    }
    const lines = Object.values(source).map((d) => {
      const tag = d.tag || ''
      let level = d.level
      if (!level) { if (tag.includes('六级')) level = 6; else if (tag.includes('四级')) level = 4 }
      const lv = level === 6 ? '六级 ' : level === 4 ? '四级 ' : ''
      const ph = d.phonetic ? `${d.phonetic} ` : ''
      return `${lv}${d.word} ${ph}${(d.meaning || '').replace(/[（(].*?[)）]/g, '').trim()}`.trim()
    }).filter(Boolean)
    if (!lines.length) { setToast('没有可导出的词汇'); setExportOpen(false); return }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = mode === 'imported' ? '导入的四六级词汇.txt' : '四六级词汇库.txt'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
    setExportOpen(false)
    setToast(`已导出 ${lines.length} 个词`)
  }

  const handleDelete = (key) => {
    removeImported(key)
    setSelected(null)
    setToast('已删除该词')
  }

  // 点击单词时按需联网查询音标和例句（Free Dictionary API，带 localStorage 缓存）
  useEffect(() => {
    if (!selected) { setDetailLoading(false); return }
    const base = allData[selected]
    if (!base) return
    // 已有完整音标和例句则不查
    if (base.phonetic && base.example) { setDetailLoading(false); return }
    if (detailCache[selected]) { setDetailLoading(false); return }

    setDetailLoading(true)
    fetchWordDetail(base.word).then(detail => {
      setDetailCache(prev => ({ ...prev, [selected]: detail }))
      setDetailLoading(false)
    }).catch(() => setDetailLoading(false))
  }, [selected])

  const selectedData = selected ? {
    ...allData[selected],
    ...(detailCache[selected] ? {
      phonetic: detailCache[selected].phonetic || allData[selected].phonetic,
      example: detailCache[selected].example || allData[selected].example,
      enMeaning: detailCache[selected].enMeaning,
      partOfSpeech: detailCache[selected].partOfSpeech,
    } : {})
  } : null

  return <div className="words-page fade-in"><div className="page-title-row"><div><div className="eyebrow orange-text">VOCABULARY LAB</div><h1>你的词汇，<i>有场景。</i></h1><p>{currentCategory.label === '全部' ? `${words.length} 个词` : `${currentCategory.label} · ${visibleWords.length} 个词`}正在通过情景、声音和重复变成长期记忆。</p></div><div className="vocab-actions"><button className="ghost-button" onClick={() => setShowImport(true)}><Upload size={16} /> 导入</button><div className="export-wrap"><button className="ghost-button" onClick={() => setExportOpen(o => !o)}><Download size={16} /> 导出 <ChevronDown size={14} /></button>{exportOpen && <div className="export-menu"><button onClick={() => doExport('all')}>导出全部（内置 + 导入）</button>{Object.keys(importedVocab).length > 0 && <button onClick={() => doExport('imported')}>仅导出导入词汇</button>}</div>}</div></div></div><div className="vocab-stats"><div><span>待复习</span><strong>{saved.length}</strong><small>个单词</small></div><div><span>词库总量</span><strong>{words.length}</strong><small>个单词</small></div><div><span>记忆进度</span><strong>{memoryProgress}%</strong><small>{masteredCount} 已掌握</small></div><div className="review-cta">
  <div className="review-cta-head">
    <strong>今日复习计划</strong>
    <span className="review-count">{reviewRemaining.length} 个词待复习 · 约 {reviewEstMins} 分钟</span>
  </div>
  <div className="review-progress-row">
    <div className="review-progress-bar"><span style={{width: `${reviewWords.length ? (reviewedToday.filter(w => reviewWords.includes(w)).length / reviewWords.length * 100) : 0}%`}}></span></div>
    <span className="review-progress-text">{reviewedToday.filter(w => reviewWords.includes(w)).length}/{reviewWords.length}</span>
  </div>
  <div className="review-settings-row">
    <span className="review-settings-label">复习等级</span>
    <div className="review-level-buttons">
      {[0,1,2,3,4].map(lv => {
        const cnt = Object.values(memoryLevels).filter(v => v === lv).length
        const active = reviewLevels.includes(lv)
        return <button key={lv} className={`level-btn ${active ? 'active' : ''} lv-${lv}`} onClick={() => toggleReviewLevel(lv)}>{['未记','L1','L2','L3','已掌握'][lv]}<em>{cnt}</em></button>
      })}
    </div>
  </div>
  <div className="review-settings-row">
    <span className="review-settings-label">每次复习</span>
    <div className="review-count-adjuster">
      <button className="count-btn" onClick={() => setReviewCount(c => Math.max(1, c - 1))} disabled={reviewCount <= 1}>−</button>
      <span className="count-value"><b>{reviewCount}</b> 词</span>
      <button className="count-btn" onClick={() => setReviewCount(c => c + 1)}>+</button>
    </div>
    <span className="review-l1-total">可选 {Object.entries(memoryLevels).filter(([_,v]) => reviewLevels.includes(v)).length} 个</span>
  </div>
  <button className={reviewRemaining.length ? 'primary review-start' : 'review-start done'} onClick={startReview} disabled={!reviewRemaining.length}>
    {reviewRemaining.length ? <>开始复习 <ArrowUpRight size={15} /></> : '✓ 今日已完成'}
  </button>
</div></div><div className="category-mastery"><h3>分类掌握进度</h3><div className="mastery-cards">
  {[
    { label: '四级高频', data: cet4HighMastery, color: '#3b82f6', cls: 'cet4-high' },
    { label: '六级高频', data: cet6HighMastery, color: '#ec4899', cls: 'cet6-high' },
    { label: '四级核心', data: cet4CoreMastery, color: '#6366f1', cls: 'cet4-core' },
    { label: '六级核心', data: cet6CoreMastery, color: '#a855f7', cls: 'cet6-core' },
    { label: '阅读难词', data: readingMastery, color: '#14b8a6', cls: 'reading' },
  ].map(c => (
    <div key={c.cls} className={`mastery-card ${c.cls}`}><div className="mastery-card-head"><span className="mastery-label">{c.label}</span><strong>{c.data.pct}%</strong></div><div className="mastery-bar"><span style={{width:`${c.data.pct}%`,background:c.color}}></span></div><small>{c.data.mastered} / {c.data.total} 已掌握</small></div>
  ))}
</div></div><div className="memory-progress"><div className="memory-progress-bar">{memCounts.map((c, i) => c > 0 ? <span key={i} className={`mem-level-${i}`} style={{ width: `${(c / words.length) * 100}%` }} title={`${['未记忆','第1次记忆','第2次记忆','第3次记忆','已掌握'][i]}: ${c}`} /> : null)}</div><div className="memory-progress-labels">{memCounts.map((c, i) => <span key={i} className={`mem-label-${i}`}>{['未记忆','第1次','第2次','第3次','已掌握'][i]} <b>{c}</b></span>)}</div></div><div className="library-toolbar"><div className="vocab-tabs">{categoryTabs.map(t => <button key={t.id} className={category === t.id ? 'active' : ''} onClick={() => setCategory(t.id)}>{t.label}<em>{t.count}</em></button>)}</div><div className="mem-tabs">{memTabs.map(t => <button key={t.id} className={memFilter === t.id ? 'active' : ''} onClick={() => setMemFilter(t.id)}>{t.label}<em>{t.count}</em></button>)}</div><label><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索词汇..." /></label></div><div className="words-layout"><div className="word-grid">{visibleWords.map((key) => { const data = allData[key]; const memLevel = memoryLevels[key] || 0; return <button className={`word-card mem-card-${memLevel}`} key={key} onClick={() => setSelected(key)}><div className="word-card-top"><span className="type-label">{data.tag}</span>{memLevel > 0 && <span className={`mem-badge mem-${memLevel}`}>{memLevel >= 4 ? '✓' : `L${memLevel}`}</span>}<Volume2 size={16} onClick={(event) => { event.stopPropagation(); speak(data.word) }} /></div><strong>{data.word}</strong><span>{data.phonetic}</span><p>{data.meaning}</p><div className="word-card-bottom"><span>{data.root}</span><em>{data.rootMeaning.split(' · ')[0]}</em></div></button> })}</div></div>{selectedData && createPortal(<><div className="word-popup-overlay" onClick={() => setSelected(null)} /><div className="word-popup" onClick={(event) => event.stopPropagation()}><WordDetail data={selectedData} saved={saved} toggleSave={toggleSave} marks={marks} toggleMark={toggleMark} close={() => setSelected(null)} onDelete={importedVocab[selected] ? handleDelete : undefined} detailLoading={detailLoading} memoryLevels={memoryLevels} markMemorized={markMemorized} inVocab={!!importedVocab[selected]} /></div></>, document.body)}
    {showImport && <div className="import-overlay" onClick={() => setShowImport(false)}><div className="import-modal" onClick={(event) => event.stopPropagation()}><div className="import-modal-head"><span className="type-label orange">导入四六级词汇库</span><button className="close-button" onClick={() => setShowImport(false)}><X size={16} /></button></div><label className="file-label" htmlFor="vocab-file-input"><Upload size={14} /> 选择 .txt / .csv 文件</label><input id="vocab-file-input" type="file" accept=".txt,.csv" style={{ display: 'none' }} onChange={readImportFile} /><div className="import-sep">或直接粘贴</div><textarea value={importText} onChange={(event) => setImportText(event.target.value)} rows={8} placeholder={'每行一个词，例如：\nabandon /əˈbændən/ 放弃\n四级 vanish /ˈvænɪʃ/ 消失\n六级 anticipate /ænˈtɪsɪpeɪt/ 预期'} /><div className="import-modal-actions"><span className="import-tip">格式：单词 + 音标（可选，/.../ 包裹）+ 释义；行内写"四级/六级"会按级别标色</span><button className="primary" onClick={doImport}>确认导入</button></div></div></div>}
    {reviewMode && currentReviewData && createPortal(<><div className="review-overlay" onClick={() => setReviewMode(false)} /><div className="review-modal" onClick={(event) => event.stopPropagation()}>
      <div className="review-modal-head">
        <span className="type-label orange">今日复习 · {reviewIndex + 1} / {reviewSessionList.length}</span>
        <button className="close-button" onClick={() => setReviewMode(false)}><X size={16} /></button>
      </div>
      <div className="review-progress-line"><span style={{width: `${((reviewIndex) / reviewSessionList.length) * 100}%`}}></span></div>
      <div className="review-word-card">
        <div className="review-word-top">
          <span className="type-label">{currentReviewData.tag}</span>
          <span className={`mem-badge mem-${memoryLevels[currentReviewWord]||0}`}>{(memoryLevels[currentReviewWord]||0) >= 4 ? '✓ 已掌握' : `L${memoryLevels[currentReviewWord]||0}`}</span>
          <button className="review-speak" onClick={() => speak(currentReviewData.word)}><Volume2 size={18} /></button>
        </div>
        <h2 className="review-word">{currentReviewData.word}</h2>
        <p className="review-phonetic">{currentReviewData.phonetic}</p>
        <p className="review-meaning">{currentReviewData.meaning}</p>
        {currentReviewData.example && <p className="review-example">"{currentReviewData.example}"</p>}
      </div>
      <div className="review-actions">
        <button className="review-btn unknown" onClick={() => markReviewed(currentReviewWord, false)}><XCircle size={20} /> 不认识</button>
        <button className="review-btn known" onClick={() => markReviewed(currentReviewWord, true)}><CheckCircle size={20} /> 认识</button>
      </div>
      <p className="review-tip">点击"认识"会提升记忆等级，"不认识"仅标记为已复习</p>
    </div></>, document.body)}
  </div>
}

function RootsPage({ setToast, rootMemoryLevels, markRootMemorized }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(new Set(['port']))
  const [selectedRoot, setSelectedRoot] = useState(null)

  // ===== 词根词缀复习模式 =====
  const todayKey = localDateKey()
  const [rootReviewedToday, setRootReviewedToday] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('root_reviewed_today') || '{}')
      return saved.date === todayKey ? (saved.forms || []) : []
    } catch (e) { return [] }
  })
  const [rootReviewMode, setRootReviewMode] = useState(false)
  const [rootReviewIndex, setRootReviewIndex] = useState(0)
  const [rootReviewSessionList, setRootReviewSessionList] = useState([])
  const [rootReviewShowAnswer, setRootReviewShowAnswer] = useState(false)
  const [rootReviewCount, setRootReviewCount] = useState(() => {
    try { return parseInt(localStorage.getItem('root_review_count') || '8', 10) } catch (e) { return 8 }
  })
  const [rootReviewLevels, setRootReviewLevels] = useState(() => {
    try { return JSON.parse(localStorage.getItem('root_review_levels') || '[0,1]') } catch (e) { return [0, 1] }
  })

  useEffect(() => {
    try { localStorage.setItem('root_review_count', String(rootReviewCount)) } catch (e) { /* ignore */ }
  }, [rootReviewCount])
  useEffect(() => {
    try { localStorage.setItem('root_review_levels', JSON.stringify(rootReviewLevels)) } catch (e) { /* ignore */ }
  }, [rootReviewLevels])
  useEffect(() => {
    try { localStorage.setItem('root_reviewed_today', JSON.stringify({ date: todayKey, forms: rootReviewedToday })) } catch (e) { /* ignore */ }
  }, [rootReviewedToday, todayKey])

  const toggleRootReviewLevel = (lv) => {
    setRootReviewLevels(prev => prev.includes(lv) ? prev.filter(l => l !== lv) : [...prev, lv])
  }

  // 词根记忆等级统计
  const rootMemCounts = [0, 0, 0, 0, 0]
  affixData.forEach(d => {
    const lv = rootMemoryLevels[d.form] || 0
    rootMemCounts[Math.min(lv, 4)]++
  })
  const rootMasteredCount = rootMemCounts[4]
  const rootTotal = affixData.length
  const rootMemoryProgress = rootTotal ? Math.round((rootMemCounts[1] + rootMemCounts[2] * 2 + rootMemCounts[3] * 3 + rootMemCounts[4] * 4) / (rootTotal * 4) * 100) : 0

  // 按类型统计掌握进度
  const rootTypeMastery = (type) => {
    const list = affixData.filter(d => d.type === type)
    const mastered = list.filter(d => (rootMemoryLevels[d.form] || 0) >= 4).length
    return { total: list.length, mastered, pct: list.length ? Math.round(mastered / list.length * 100) : 0 }
  }
  const prefixMastery = rootTypeMastery('prefix')
  const rootTypeM = rootTypeMastery('root')
  const suffixMastery = rootTypeMastery('suffix')

  // 智能选词：从选中的记忆等级中选，随机打乱
  const rootReviewWords = useMemo(() => {
    if (!rootReviewLevels.length) return []
    const candidates = affixData.filter(d => rootReviewLevels.includes(rootMemoryLevels[d.form] || 0)).map(d => d.form)
    const shuffled = [...candidates].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(rootReviewCount, shuffled.length))
  }, [rootMemoryLevels, rootReviewCount, rootReviewLevels])

  const rootReviewRemaining = rootReviewWords.filter(f => !rootReviewedToday.includes(f))
  const rootReviewEstMins = Math.max(1, Math.ceil(rootReviewRemaining.length * 1.5))

  const startRootReview = () => {
    if (!rootReviewRemaining.length) { setToast('今日词根复习已全部完成！'); return }
    setRootReviewSessionList([...rootReviewRemaining])
    setRootReviewIndex(0)
    setRootReviewShowAnswer(false)
    setRootReviewMode(true)
  }
  const markRootReviewed = (form, known) => {
    if (!rootReviewedToday.includes(form)) {
      setRootReviewedToday(prev => [...prev, form])
    }
    if (known) {
      markRootMemorized(form)
    }
    setRootReviewShowAnswer(false)
    const nextIdx = rootReviewIndex + 1
    if (nextIdx >= rootReviewSessionList.length) {
      setRootReviewMode(false)
      setToast(`词根复习完成！共复习 ${rootReviewSessionList.length} 个`)
    } else {
      setRootReviewIndex(nextIdx)
    }
  }
  const currentReviewRoot = rootReviewSessionList[rootReviewIndex] ? affixData.find(d => d.form === rootReviewSessionList[rootReviewIndex]) : null

  const counts = {
    prefix: affixData.filter(d => d.type === 'prefix').length,
    root: affixData.filter(d => d.type === 'root').length,
    suffix: affixData.filter(d => d.type === 'suffix').length,
  }
  const totalWords = affixData.reduce((sum, d) => sum + d.words.length, 0)

  const filtered = affixData.filter(d => {
    if (filter !== 'all' && d.type !== filter) return false
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      const hay = (d.form + ' ' + d.meaning + ' ' + d.en + ' ' + d.words.map(w => w[0] + ' ' + w[1] + ' ' + w[2]).join(' ')).toLowerCase()
      return hay.includes(q)
    }
    return true
  })

  const toggle = (form) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(form)) next.delete(form)
      else next.add(form)
      return next
    })
  }

  const rootOfDay = affixData.find(d => d.form === 'port')

  const buildRootDesc = (d) => {
    if (d.type === 'prefix') return `前缀 ${d.form} 表示「${d.meaning}」（${d.en}）。记住这个含义，下面这些词的构成就一目了然了。`
    if (d.type === 'suffix') return `后缀 ${d.form} 表示「${d.meaning}」（${d.en}）。加上它，词的词性和含义都会带上这层意思。`
    return `词根 ${d.form} 表示「${d.meaning}」（${d.en}）。这个核心画面藏在一整组高频词里，拆开看就都明白了。`
  }

  const tabs = [{ id: 'all', label: '全部' }, { id: 'prefix', label: '前缀' }, { id: 'root', label: '词根' }, { id: 'suffix', label: '后缀' }]

  return <div className="roots-page fade-in"><div className="page-title-row"><div><div className="eyebrow">HIGH-FREQUENCY ROOTS &amp; AFFIXES</div><h1>高频词根词缀，<br /><i>一张总表。</i></h1><p>汇总 {counts.root} 个常用词根、{counts.prefix} 个前缀、{counts.suffix} 个后缀，附 {totalWords}+ 个示例单词与拆解，让陌生词有迹可循。</p></div><div className="root-orbit"><span>port</span><b>carry</b><i>携带</i></div></div>

    {/* 词根记忆进度 + 复习计划 */}
    <div className="vocab-stats root-stats-section">
      <div><span>词缀总量</span><strong>{rootTotal}</strong><small>个词根词缀</small></div>
      <div><span>记忆进度</span><strong>{rootMemoryProgress}%</strong><small>{rootMasteredCount} 已掌握</small></div>
      <div><span>今日已复习</span><strong>{rootReviewedToday.length}</strong><small>个词根词缀</small></div>
      <div className="review-cta root-review-cta">
        <div className="review-cta-head">
          <strong>词根词缀复习</strong>
          <span className="review-count">{rootReviewRemaining.length} 个待复习 · 约 {rootReviewEstMins} 分钟</span>
        </div>
        <div className="review-progress-row">
          <div className="review-progress-bar"><span style={{width: `${rootReviewWords.length ? (rootReviewedToday.filter(f => rootReviewWords.includes(f)).length / rootReviewWords.length * 100) : 0}%`}}></span></div>
          <span className="review-progress-text">{rootReviewedToday.filter(f => rootReviewWords.includes(f)).length}/{rootReviewWords.length}</span>
        </div>
        <div className="review-settings-row">
          <span className="review-settings-label">复习等级</span>
          <div className="review-level-buttons">
            {[0,1,2,3,4].map(lv => {
              const cnt = rootMemCounts[lv]
              const active = rootReviewLevels.includes(lv)
              return <button key={lv} className={`level-btn ${active ? 'active' : ''} lv-${lv}`} onClick={() => toggleRootReviewLevel(lv)}>{['未记','L1','L2','L3','已掌握'][lv]}<em>{cnt}</em></button>
            })}
          </div>
        </div>
        <div className="review-settings-row">
          <span className="review-settings-label">每次复习</span>
          <div className="review-count-adjuster">
            <button className="count-btn" onClick={() => setRootReviewCount(c => Math.max(1, c - 1))} disabled={rootReviewCount <= 1}>−</button>
            <span className="count-value"><b>{rootReviewCount}</b> 个</span>
            <button className="count-btn" onClick={() => setRootReviewCount(c => c + 1)}>+</button>
          </div>
          <span className="review-l1-total">可选 {rootReviewWords.length > 0 ? affixData.filter(d => rootReviewLevels.includes(rootMemoryLevels[d.form] || 0)).length : 0} 个</span>
        </div>
        <button className={rootReviewRemaining.length ? 'primary review-start' : 'review-start done'} onClick={startRootReview} disabled={!rootReviewRemaining.length}>
          {rootReviewRemaining.length ? <>开始复习 <ArrowUpRight size={15} /></> : '✓ 今日已完成'}
        </button>
      </div>
    </div>

    {/* 分类掌握进度 */}
    <div className="category-mastery"><h3>词根词缀分类掌握</h3><div className="mastery-cards">
      {[
        { label: '前缀', data: prefixMastery, color: '#3b82f6', cls: 'prefix' },
        { label: '词根', data: rootTypeM, color: '#ec4899', cls: 'root-type' },
        { label: '后缀', data: suffixMastery, color: '#a855f7', cls: 'suffix' },
      ].map(c => (
        <div key={c.cls} className={`mastery-card ${c.cls}`}><div className="mastery-card-head"><span className="mastery-label">{c.label}</span><strong>{c.data.pct}%</strong></div><div className="mastery-bar"><span style={{width:`${c.data.pct}%`,background:c.color}}></span></div><small>{c.data.mastered} / {c.data.total} 已掌握</small></div>
      ))}
    </div></div>

    <div className="root-stats"><div><span>前缀</span><strong>{counts.prefix}</strong></div><div><span>词根</span><strong>{counts.root}</strong></div><div><span>后缀</span><strong>{counts.suffix}</strong></div><div><span>示例单词</span><strong>{totalWords}+</strong></div></div>{rootOfDay && <div className="root-feature"><div className="root-feature-copy"><span className="type-label orange">ROOT OF THE DAY</span><h2>{rootOfDay.form}</h2><p className="root-definition">{rootOfDay.en} · {rootOfDay.meaning}</p><p>把东西从一个地方带到另一个地方。这个画面藏在一整组高频词里。</p><button className="primary" onClick={() => setToast('词根卡片已加入今天的学习计划')}>学习这一组 <ArrowUpRight size={16} /></button></div><div className="root-family"><div className="family-line"></div>{rootOfDay.words.map((wd, index) => <div className="family-word" key={wd[0]}><span>0{index + 1}</span><strong>{wd[0]}</strong><small>{wd[2]}</small><em>{wd[1]}</em></div>)}</div></div>}<div className="roots-library"><div className="roots-toolbar"><div className="root-tabs">{tabs.map(t => <button key={t.id} className={filter === t.id ? 'active' : ''} onClick={() => setFilter(t.id)}>{t.label}</button>)}</div><label className="root-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索词根 / 词缀 / 单词..." /></label></div><div className="affix-grid">{filtered.map((d) => { const typeInfo = AFFIX_TYPES[d.type]; const isOpen = expanded.has(d.form); const showWords = isOpen ? d.words : d.words.slice(0, 2); const memLevel = rootMemoryLevels[d.form] || 0; return <div key={d.form} className={`affix-card ${d.type}${isOpen ? ' open' : ''}`}><button className="affix-card-head" onClick={() => setSelectedRoot(d)}><span className={`affix-badge ${d.type}`}>{typeInfo.label}</span><strong className="affix-form">{d.form}</strong>{memLevel > 0 && <span className={`mem-badge mem-${memLevel}`} style={{marginLeft:'auto'}}>{memLevel >= 4 ? '✓' : `L${memLevel}`}</span>}<span className="affix-en">{d.en}</span><span className="affix-cn">{d.meaning}</span><ChevronDown size={16} className="affix-chevron" /></button><div className="affix-words">{showWords.map((wd) => <span key={wd[0]} className="affix-word"><b>{wd[0]}</b><i>{wd[1]}</i>{isOpen && <em>{wd[2]}</em>}</span>)}{!isOpen && d.words.length > 2 && <button className="affix-more" onClick={() => toggle(d.form)}>+{d.words.length - 2} 更多</button>}</div></div>})}{filtered.length === 0 && <div className="affix-empty">没有找到匹配的词根词缀，换个关键词试试。</div>}</div></div>{selectedRoot && createPortal(<><div className="word-popup-overlay" onClick={() => setSelectedRoot(null)} /><div className="word-popup root-popup" onClick={(event) => event.stopPropagation()}><div className="root-popup-head"><span className={`affix-badge ${selectedRoot.type}`}>{AFFIX_TYPES[selectedRoot.type].label}</span>{(rootMemoryLevels[selectedRoot.form] || 0) > 0 && <span className={`mem-badge mem-${rootMemoryLevels[selectedRoot.form] || 0}`}>{(rootMemoryLevels[selectedRoot.form] || 0) >= 4 ? '✓ 已掌握' : `L${rootMemoryLevels[selectedRoot.form] || 0}`}</span>}<button className="close-button" onClick={() => setSelectedRoot(null)}><X size={16} /></button></div><div className="root-feature"><div className="root-feature-copy"><span className="type-label orange">{AFFIX_TYPES[selectedRoot.type].label === '前缀' ? 'PREFIX' : AFFIX_TYPES[selectedRoot.type].label === '后缀' ? 'SUFFIX' : 'ROOT'}</span><h2>{selectedRoot.form}</h2><p className="root-definition">{selectedRoot.en} · {selectedRoot.meaning}</p><p>{buildRootDesc(selectedRoot)}</p><button className="primary" onClick={() => { markRootMemorized(selectedRoot.form); }}><Brain size={15} /> 标记记忆（当前 L{rootMemoryLevels[selectedRoot.form] || 0}）</button></div><div className="root-family"><div className="family-line"></div>{selectedRoot.words.map((wd, index) => <div className="family-word" key={wd[0]}><span>0{index + 1}</span><strong>{wd[0]}</strong><small>{wd[2]}</small><em>{wd[1]}</em></div>)}</div></div></div></>, document.body)}

    {/* 词根复习弹窗 */}
    {rootReviewMode && currentReviewRoot && createPortal(<><div className="review-overlay" onClick={() => setRootReviewMode(false)} /><div className="review-modal root-review-modal" onClick={(event) => event.stopPropagation()}>
      <div className="review-modal-head">
        <span className="type-label orange">词根词缀复习 · {rootReviewIndex + 1} / {rootReviewSessionList.length}</span>
        <button className="close-button" onClick={() => setRootReviewMode(false)}><X size={16} /></button>
      </div>
      <div className="review-progress-line"><span style={{width: `${((rootReviewIndex) / rootReviewSessionList.length) * 100}%`}}></span></div>
      <div className="review-word-card root-review-card">
        <div className="review-word-top">
          <span className={`affix-badge ${currentReviewRoot.type}`}>{AFFIX_TYPES[currentReviewRoot.type].label}</span>
          <span className={`mem-badge mem-${rootMemoryLevels[currentReviewRoot.form]||0}`}>{(rootMemoryLevels[currentReviewRoot.form]||0) >= 4 ? '✓ 已掌握' : `L${rootMemoryLevels[currentReviewRoot.form]||0}`}</span>
        </div>
        <h2 className="review-word root-review-word">{currentReviewRoot.form}</h2>
        {rootReviewShowAnswer ? (
          <>
            <p className="review-phonetic">{currentReviewRoot.en}</p>
            <p className="review-meaning">{currentReviewRoot.meaning}</p>
            <div className="root-review-words">
              {currentReviewRoot.words.slice(0, 4).map((wd) => (
                <div key={wd[0]} className="root-review-word-item">
                  <strong>{wd[0]}</strong><em>{wd[1]}</em><small>{wd[2]}</small>
                </div>
              ))}
            </div>
          </>
        ) : (
          <button className="root-review-show-btn" onClick={() => setRootReviewShowAnswer(true)}>
            <Lightbulb size={18} /> 点击显示含义和例词
          </button>
        )}
      </div>
      <div className="review-actions">
        <button className="review-btn unknown" onClick={() => markRootReviewed(currentReviewRoot.form, false)}><XCircle size={20} /> 不认识</button>
        <button className="review-btn known" onClick={() => markRootReviewed(currentReviewRoot.form, true)}><CheckCircle size={20} /> 认识</button>
      </div>
      <p className="review-tip">先回忆含义，再点击显示答案。"认识"会提升记忆等级，"不认识"仅标记为已复习</p>
    </div></>, document.body)}
  </div>
}

function ShowsPage() {
  const [filter, setFilter] = useState('all') // all=适合现在, talk=口语优先
  const shows = [
    { title: 'The Good Place', note: '轻松入门 · 日常表达', detail: '哲学问题，喜剧节奏，适合建立语感。', color: 'mint', level: 'A2–B1', tags: ['口语', '入门'], link: 'https://www.netflix.com/title/70143836' },
    { title: 'Modern Family', note: '家庭日常 · 高频口语', detail: '三个家庭的日常对话，生活场景词汇最密集的喜剧之一。', color: 'blue', level: 'B1–B2', tags: ['口语'], link: 'https://www.hulu.com/series/modern-family-883c414c-34a3-4fcc-b50a-0ad5a184c977' },
    { title: 'Brooklyn Nine-Nine', note: '职场喜剧 · 自然语速', detail: '办公室快语速对白，训练你跟上真实交流的节奏。', color: 'orange', level: 'B1–B2', tags: ['口语'], link: 'https://www.peacocktv.com/stream-tv/brooklyn-nine-nine' },
    { title: 'Abstract: The Art of Design', note: '视觉输入 · 设计词汇', detail: '用设计师的故事，理解复杂观点如何被表达。', color: 'orange', level: 'B1–B2', tags: ['进阶'], link: 'https://www.netflix.com/title/80057883' },
    { title: 'The Crown', note: '英音 · 正式语体', detail: '慢而清晰的英式发音与正式表达，适合备考与学术语境。', color: 'mint', level: 'B2–C1', tags: ['进阶'], link: 'https://www.netflix.com/title/80025678' },
    { title: 'The Office', note: '高频口语 · 真实交流', detail: '办公室里的闲聊、玩笑和表达分寸。', color: 'blue', level: 'B1–B2', tags: ['口语'], link: 'https://www.peacocktv.com/stream-tv/the-office' },
  ]
  const list = filter === 'talk' ? shows.filter((s) => s.tags.includes('口语')) : shows
  return <div className="shows-page fade-in"><div className="page-title-row"><div><div className="eyebrow orange-text">WATCH IN ENGLISH</div><h1>让耳朵去<br /><i>旅行。</i></h1><p>挑一部你真的想看的剧。兴趣，是最好的重复机制。</p></div><div className="show-filter"><span className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>适合现在</span><span className={filter === 'talk' ? 'active' : ''} onClick={() => setFilter('talk')}>口语优先</span></div></div><div className="show-list">{list.map((show) => <article className={`show-card ${show.color}`} key={show.title}><div className="show-number">0{shows.indexOf(show) + 1}</div><div className="show-visual"><div className="visual-shape"></div><Play size={25} fill="currentColor" /></div><div className="show-copy"><span>{show.note}</span><h2>{show.title}</h2><p>{show.detail}</p><a href={show.link} target="_blank" rel="noreferrer">打开观看链接 <Link2 size={14} /></a></div><div className="show-level">{show.level}<small>建议等级</small></div></article>)}</div><div className="watch-tip"><Headphones size={21} /><div><strong>看剧小方法</strong><span>第一遍开英文字幕，第二遍关字幕。不要追求每句都懂，追踪你能持续理解的主线。</span></div></div></div>
}

createRoot(document.getElementById('root')).render(<App />)
