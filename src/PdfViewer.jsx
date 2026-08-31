import { useEffect, useRef, useState } from 'react'
import { getDocument, GlobalWorkerOptions, TextLayer } from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { Languages, X, Copy, Check, ScanText, Loader } from 'lucide-react'
import { translateText, ocrImage, cropElement } from './ocr'

GlobalWorkerOptions.workerSrc = pdfWorker

/**
 * PDF 原生渲染组件
 * - 用 PDF.js 渲染 canvas（保留图表、公式、排版）
 * - 叠加 textLayer（可选择/单击文本）
 * - 单击英文单词触发 onWordClick 回调
 * - 选中文字后显示翻译按钮，支持中英互译
 * - 「图片翻译」：框选页面区域 → OCR 识别英文 → 翻译（扫描件/无文字层 PDF 也能用）
 */
export default function PdfViewer({ buffer, onWordClick, scale = 1.6 }) {
  const containerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 翻译相关状态
  const [selectedText, setSelectedText] = useState('')
  const [translateBtnPos, setTranslateBtnPos] = useState(null)
  const [translateResult, setTranslateResult] = useState(null)
  const [translating, setTranslating] = useState(false)
  const [copied, setCopied] = useState(false)

  // 图片翻译（OCR）相关状态
  const [ocrMode, setOcrMode] = useState(false)
  const [ocrSel, setOcrSel] = useState(null) // {cx,cy,x0,y0,x1,y1} cx/cy=canvas相对容器, x/y=相对canvas
  const [ocrBusy, setOcrBusy] = useState(null) // {status, progress}
  const [ocrResult, setOcrResult] = useState(null) // {source, translation}
  const [ocrCopied, setOcrCopied] = useState(false)
  const ocrCanvasRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const textLayers = []

    async function renderPdf() {
      setLoading(true)
      setError(null)
      try {
        const data = buffer.slice(0)
        const pdf = await getDocument({ data, standardFontDataUrl: '/pdfjs_fonts/' }).promise

        const container = containerRef.current
        if (!container) return
        container.innerHTML = ''

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) break
          const page = await pdf.getPage(pageNum)
          const viewport = page.getViewport({ scale })

          // 页面包装器
          const pageWrapper = document.createElement('div')
          pageWrapper.className = 'pdf-native-page'
          pageWrapper.style.width = viewport.width + 'px'
          pageWrapper.style.height = viewport.height + 'px'
          pageWrapper.style.position = 'relative'
          pageWrapper.style.margin = '0 auto 24px'
          pageWrapper.style.background = '#fff'
          pageWrapper.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)'
          pageWrapper.style.borderRadius = '4px'
          pageWrapper.style.overflow = 'hidden'

          // Canvas 层（渲染 PDF 内容）
          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          canvas.style.display = 'block'
          const ctx = canvas.getContext('2d')
          await page.render({ canvasContext: ctx, viewport }).promise
          pageWrapper.appendChild(canvas)

          // 文本层（叠加在 canvas 上，用于选择/单击）
          const textLayerDiv = document.createElement('div')
          textLayerDiv.className = 'textLayer'
          textLayerDiv.style.position = 'absolute'
          textLayerDiv.style.left = '0'
          textLayerDiv.style.top = '0'
          textLayerDiv.style.width = viewport.width + 'px'
          textLayerDiv.style.height = viewport.height + 'px'
          textLayerDiv.style.pointerEvents = 'auto'
          textLayerDiv.style.color = 'transparent'
          textLayerDiv.style.background = 'transparent'
          textLayerDiv.style.cursor = 'text'

          const textContent = await page.getTextContent()
          const textLayer = new TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: viewport,
          })
          await textLayer.render()
          textLayers.push(textLayer)

          pageWrapper.appendChild(textLayerDiv)
          container.appendChild(pageWrapper)
        }

        await pdf.destroy()
        if (!cancelled) setLoading(false)
      } catch (err) {
        console.error('PDF render error:', err)
        if (!cancelled) {
          setError(err.message || 'PDF 渲染失败')
          setLoading(false)
        }
      }
    }

    renderPdf()

    return () => {
      cancelled = true
      textLayers.forEach(tl => { try { tl.cancel() } catch (e) {} })
    }
  }, [buffer, scale])

  // 单击单词处理：用 caretRangeFromPoint 获取单击位置的单词
  const handleClick = (e) => {
    if (ocrMode || ocrSel) return
    // 如果点击的是翻译按钮或翻译弹窗，不处理单词单击
    if (e.target.closest('.pdf-translate-btn, .pdf-translate-popup, .pdf-ocr-btn, .pdf-ocr-result')) return

    if (!onWordClick) return
    const range = document.caretRangeFromPoint(e.clientX, e.clientY)
    if (!range || !range.startContainer) return

    const text = range.startContainer.textContent
    if (!text) return

    let start = range.startOffset
    let end = range.endOffset

    // 向左扩展到单词边界（英文字母）
    while (start > 0 && /[a-zA-Z]/.test(text[start - 1])) start--
    // 向右扩展到单词边界
    while (end < text.length && /[a-zA-Z]/.test(text[end])) end++

    const word = text.slice(start, end).trim()
    if (word && /[a-zA-Z]/.test(word) && word.length > 1) {
      onWordClick(word.toLowerCase())
    }
  }

  // 鼠标抬起：检测文字选择
  const handleMouseUp = (e) => {
    if (ocrMode || ocrSel) return
    // 延迟获取选择，确保浏览器已更新 selection
    setTimeout(() => {
      const selection = window.getSelection()
      const text = selection ? selection.toString().trim() : ''

      if (text && text.length > 1 && containerRef.current && containerRef.current.contains(selection.anchorNode)) {
        // 有选中文字，显示翻译按钮
        setSelectedText(text)
        // 获取选中区域的位置
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setTranslateBtnPos({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        })
        setTranslateResult(null)
      } else {
        // 没有选中文字，隐藏翻译按钮和弹窗
        setTranslateBtnPos(null)
        setTranslateResult(null)
        setSelectedText('')
      }
    }, 10)
  }

  // 点击翻译按钮
  const handleTranslate = async () => {
    if (!selectedText || translating) return
    setTranslating(true)
    setTranslateResult(null)
    // 自动检测语言：包含中文字符则中译英，否则英译中
    const hasChinese = /[\u4e00-\u9fa5]/.test(selectedText)
    const from = hasChinese ? 'zh-CN' : 'en'
    const to = hasChinese ? 'en' : 'zh-CN'
    const result = await translateText(selectedText, from, to)
    setTranslateResult(result || '翻译失败，请稍后重试')
    setTranslating(false)
  }

  // 复制翻译结果
  const handleCopy = () => {
    if (!translateResult) return
    navigator.clipboard.writeText(translateResult).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // 关闭翻译弹窗
  const closeTranslate = () => {
    setTranslateBtnPos(null)
    setTranslateResult(null)
    setSelectedText('')
    window.getSelection()?.removeAllRanges()
  }

  // ===== 图片翻译（OCR）=====
  const handleOcrDown = (e) => {
    if (!ocrMode) return
    // 文字层(textLayer)会盖在 canvas 上拦截事件，需要从页面包装器里找到 canvas
    const pageWrap = e.target.closest('.pdf-native-page')
    const canvas = e.target.closest('canvas') || (pageWrap && pageWrap.querySelector('canvas'))
    if (!canvas || !containerRef.current) return
    e.preventDefault()
    const crect = canvas.getBoundingClientRect()
    const ccrect = containerRef.current.getBoundingClientRect()
    ocrCanvasRef.current = canvas
    const x = e.clientX - crect.left
    const y = e.clientY - crect.top
    setOcrSel({ cx: crect.left - ccrect.left, cy: crect.top - ccrect.top, x0: x, y0: y, x1: x, y1: y })
  }

  const handleOcrMove = (e) => {
    if (!ocrSel || !ocrCanvasRef.current || !containerRef.current) return
    const crect = ocrCanvasRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - crect.left, crect.width))
    const y = Math.max(0, Math.min(e.clientY - crect.top, crect.height))
    setOcrSel((s) => ({ ...s, x1: x, y1: y }))
  }

  const handleOcrUp = async (e) => {
    if (!ocrSel || !ocrCanvasRef.current) return
    const canvas = ocrCanvasRef.current
    const crect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - crect.left, crect.width))
    const y = Math.max(0, Math.min(e.clientY - crect.top, crect.height))
    const s = { ...ocrSel, x1: x, y1: y }
    setOcrSel(null)
    const left = Math.min(s.x0, s.x1)
    const top = Math.min(s.y0, s.y1)
    const width = Math.abs(s.x1 - s.x0)
    const height = Math.abs(s.y1 - s.y0)
    if (width < 8 || height < 8) { setOcrMode(false); return }
    setOcrMode(false)
    setOcrBusy({ status: '正在准备…', progress: 0 })
    try {
      const crop = cropElement(canvas, { left, top, width, height })
      const text = await ocrImage(crop, (p, st) => setOcrBusy({ status: st, progress: p }))
      if (!text) {
        setOcrBusy(null)
        setOcrResult({ source: '', translation: '未能识别到文字，请放大后重试或调整框选区域。', error: true })
        return
      }
      setOcrBusy({ status: '正在翻译…', progress: 0.9 })
      const translation = await translateText(text)
      setOcrBusy(null)
      setOcrResult({ source: text, translation: translation || '翻译失败，请稍后重试。', error: !translation })
    } catch (err) {
      console.error('OCR/Translate error:', err)
      setOcrBusy(null)
      setOcrResult({ source: '', translation: '处理失败：' + ((err && err.message) || '未知错误'), error: true })
    }
  }

  const closeOcrResult = () => { setOcrResult(null); setOcrCopied(false) }

  const handleOcrCopy = () => {
    if (!ocrResult || !ocrResult.translation) return
    navigator.clipboard.writeText(ocrResult.translation).then(() => {
      setOcrCopied(true)
      setTimeout(() => setOcrCopied(false), 2000)
    })
  }

  // 合并 mouseup：OCR 框选模式走 OCR 流程，否则走文字选择
  const handleContainerMouseUp = (e) => {
    if (ocrMode || ocrSel) { handleOcrUp(e); return }
    handleMouseUp(e)
  }

  const ocrRectStyle = ocrSel
    ? {
        left: ocrSel.cx + Math.min(ocrSel.x0, ocrSel.x1),
        top: ocrSel.cy + Math.min(ocrSel.y0, ocrSel.y1),
        width: Math.abs(ocrSel.x1 - ocrSel.x0),
        height: Math.abs(ocrSel.y1 - ocrSel.y0),
      }
    : null

  if (error) {
    return <div className="pdf-viewer-error" style={{ padding: 20, color: '#ef4444' }}>PDF 渲染失败：{error}</div>
  }

  return (
    <div className="pdf-native-viewer" style={{ width: '100%', position: 'relative' }}>
      {/* 图片翻译工具栏 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 10, minHeight: 30 }}>
        {!ocrMode ? (
          <button
            className="pdf-ocr-btn"
            onClick={() => { setOcrResult(null); setOcrMode(true) }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999, border: '1px solid rgba(190,110,125,.3)', background: 'rgba(255,255,255,.85)', color: '#37828b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            <ScanText size={14} /> 图片翻译
          </button>
        ) : (
          <>
            <span style={{ fontSize: 12, color: '#37828b', fontWeight: 700 }}>在页面上按住拖动，框选要翻译的区域</span>
            <button
              className="pdf-ocr-btn"
              onClick={() => setOcrMode(false)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999, border: '1px solid rgba(190,110,125,.3)', background: 'rgba(255,255,255,.85)', color: '#7a6a70', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              <X size={14} /> 取消
            </button>
          </>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
          正在渲染 PDF…
        </div>
      )}
      <div
        ref={containerRef}
        className="pdf-native-container"
        onClick={handleClick}
        onMouseUp={handleContainerMouseUp}
        onMouseDown={handleOcrDown}
        onMouseMove={handleOcrMove}
        style={{
          position: 'relative',
          opacity: loading ? 0.3 : 1,
          transition: 'opacity 0.3s',
          cursor: ocrMode ? 'crosshair' : 'default',
          userSelect: ocrMode ? 'none' : 'auto',
        }}
      >
        {/* 框选遮罩 */}
        {ocrSel && ocrRectStyle && (
          <div style={{ position: 'absolute', zIndex: 12, border: '2px solid #0e7490', background: 'rgba(14,116,144,.18)', borderRadius: 2, pointerEvents: 'none', ...ocrRectStyle }} />
        )}
      </div>

      {/* 翻译按钮 */}
      {translateBtnPos && !translateResult && (
        <button
          className="pdf-translate-btn"
          onClick={handleTranslate}
          disabled={translating}
          style={{
            position: 'fixed',
            left: translateBtnPos.x,
            top: translateBtnPos.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 10000,
            background: '#0e7490',
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 16px',
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'auto'
          }}
        >
          <Languages size={14} />
          {translating ? '翻译中…' : '翻译'}
        </button>
      )}

      {/* 翻译结果弹窗 */}
      {translateResult && translateBtnPos && (
        <div
          className="pdf-translate-popup"
          style={{
            position: 'fixed',
            left: translateBtnPos.x,
            top: translateBtnPos.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 10000,
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            padding: '16px',
            maxWidth: '420px',
            minWidth: '280px',
            pointerEvents: 'auto'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>翻译结果</span>
            <button onClick={closeTranslate} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, marginBottom: '10px', background: '#f9fafb', padding: '10px 12px', borderRadius: '8px' }}>
            {selectedText}
          </div>
          <div style={{ fontSize: '15px', color: '#111827', lineHeight: 1.7, fontWeight: 500 }}>
            {translateResult}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f3f4f6', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', color: '#374151' }}>
              {copied ? <><Check size={12} /> 已复制</> : <><Copy size={12} /> 复制</>}
            </button>
          </div>
        </div>
      )}

      {/* OCR 进度遮罩 */}
      {ocrBusy && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.82)', gap: 8 }}>
          <Loader size={22} className="spin" />
          <span style={{ fontSize: 12, color: '#37828b', fontWeight: 700 }}>{ocrBusy.status || '处理中…'}</span>
          <div style={{ width: 160, height: 4, background: '#e6eef0', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(6, Math.min(100, (ocrBusy.progress || 0) * 100))}%`, height: '100%', background: '#0e7490', transition: 'width .2s' }} />
          </div>
        </div>
      )}

      {/* OCR 翻译结果弹窗 */}
      {ocrResult && (
        <div
          className="pdf-ocr-result"
          style={{ position: 'absolute', top: 44, left: 0, right: 0, margin: '0 auto', maxWidth: 600, zIndex: 50, background: '#fffdfd', border: '1px solid rgba(190,110,125,.28)', borderRadius: 14, boxShadow: '0 18px 44px rgba(60,40,50,.24)', padding: '14px 16px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: '#7a6a70', fontWeight: 800, letterSpacing: '.06em' }}>图片识别 + 翻译</span>
            <button onClick={closeOcrResult} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}>
              <X size={14} />
            </button>
          </div>
          {ocrResult.source ? (
            <>
              <div style={{ fontSize: 13, color: '#3f5960', lineHeight: 1.6, marginBottom: 8, background: '#f6fafb', padding: '8px 10px', borderRadius: 8, maxHeight: 150, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{ocrResult.source}</div>
              <div style={{ fontSize: 15, color: '#16262b', lineHeight: 1.7, fontWeight: 500 }}>{ocrResult.translation}</div>
              {!ocrResult.error && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button onClick={handleOcrCopy} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#374151' }}>
                    {ocrCopied ? <><Check size={12} /> 已复制</> : <><Copy size={12} /> 复制译文</>}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: ocrResult.error ? '#b24f52' : '#3f5960', lineHeight: 1.6 }}>{ocrResult.translation}</div>
          )}
        </div>
      )}
    </div>
  )
}
