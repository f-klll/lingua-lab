// OCR + 翻译工具模块
// - ocrImage: 用 tesseract.js 在浏览器本地识别图片里的英文（无需后端）
// - translateText: 用 MyMemory 免费翻译 API（与 PdfViewer 原有翻译一致）
// - cropElement: 从 <img> 或 <canvas> 上按区域裁出高清小图用于 OCR
import { createWorker } from 'tesseract.js'

let workerPromise = null

// 全局复用同一个 OCR worker（首次会加载 wasm 核心 + 英文模型，之后秒级复用）
function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract/',
      langPath: '/tesseract/',
      gzip: true,
      logger: () => {},
      errorHandler: (err) => console.error('OCR worker error:', err),
    })
  }
  return workerPromise
}

/**
 * 识别图片中的英文文本
 * @param {*} source - canvas / ImageData / Blob / dataURL / <img>
 * @param {(progress:number, status:string)=>void} [onProgress]
 * @returns {Promise<string>}
 */
export async function ocrImage(source, onProgress) {
  const worker = await getWorker()
  if (onProgress) onProgress(0, '正在加载 OCR 引擎…')
  const { data } = await worker.recognize(source, {}, { text: true })
  if (onProgress) onProgress(1, '识别完成')
  return (data.text || '').replace(/\s{2,}/g, ' ').trim()
}

/**
 * 调用 MyMemory 免费翻译（支持 CORS，无需密钥）
 */
export async function translateText(text, from = 'en', to = 'zh-CN') {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${from}|${to}`
    const resp = await fetch(url)
    const data = await resp.json()
    if (data && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText
    }
    return null
  } catch (e) {
    console.error('Translate error:', e)
    return null
  }
}

/**
 * 把元素上某一块区域按原始分辨率裁成独立 canvas
 * @param {HTMLImageElement|HTMLCanvasElement} el
 * @param {{left:number,top:number,width:number,height:number}} rect - 相对元素左上角的 CSS 像素坐标
 * @returns {HTMLCanvasElement}
 */
export function cropElement(el, rect) {
  const bcr = el.getBoundingClientRect()
  const scaleX = (el.naturalWidth || el.width) / bcr.width
  const scaleY = (el.naturalHeight || el.height) / bcr.height
  const sx = rect.left * scaleX
  const sy = rect.top * scaleY
  const sw = rect.width * scaleX
  const sh = rect.height * scaleY
  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(sw))
  out.height = Math.max(1, Math.round(sh))
  const ctx = out.getContext('2d')
  ctx.drawImage(el, sx, sy, sw, sh, 0, 0, out.width, out.height)
  return out
}
