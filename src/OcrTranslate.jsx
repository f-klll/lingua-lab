// 图片 / PDF 页面图 直接翻译组件
// 支持两种方式：
//  1. 框选翻译：在图上按住拖动，框选一块区域 → OCR 识别英文 → 自动翻译
//  2. 整页翻译：整张图 OCR → 翻译
// 附带识别进度提示、原文/译文展示、复制、关闭。
import { useRef, useState, useCallback } from 'react'
import { Languages, X, Copy, Check, ScanText, Loader } from 'lucide-react'
import { ocrImage, translateText, cropElement } from './ocr'

export default function ImageTranslator({ src, alt = '', onTranslated }) {
  const imgRef = useRef(null)
  const boxRef = useRef(null)

  const [selectMode, setSelectMode] = useState(false)
  const [drag, setDrag] = useState(null) // {x0,y0,x1,y1} 相对图容器左上角
  const [busy, setBusy] = useState(null) // {status, progress}
  const [result, setResult] = useState(null) // {source, translation}
  const [copied, setCopied] = useState(false)

  const resetResult = () => { setResult(null); setCopied(false) }

  // 把一次 OCR + 翻译流程跑完
  const runOcrTranslate = useCallback(async (region) => {
    const el = imgRef.current
    if (!el || busy) return
    resetResult()
    setBusy({ status: '正在准备…', progress: 0 })
    try {
      const crop = region ? cropElement(el, region) : el
      const text = await ocrImage(crop, (progress, status) => setBusy({ status, progress }))
      if (!text) {
        setBusy(null)
        setResult({ source: '', translation: '未能识别到文字，请放大后重试或调整框选区域。', error: true })
        return
      }
      setBusy({ status: '正在翻译…', progress: 0.9 })
      const translation = await translateText(text)
      setBusy(null)
      setResult({ source: text, translation: translation || '翻译失败，请稍后重试。', error: !translation })
      if (onTranslated) onTranslated(text, translation)
    } catch (err) {
      console.error('OCR/Translate error:', err)
      setBusy(null)
      setResult({ source: '', translation: '处理失败：' + (err && err.message ? err.message : '未知错误'), error: true })
    }
  }, [busy, onTranslated])

  // 鼠标按下：进入框选
  const handleMouseDown = (e) => {
    if (!selectMode || !boxRef.current) return
    const rect = boxRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setDrag({ x0: x, y0: y, x1: x, y1: y })
  }

  const handleMouseMove = (e) => {
    if (!selectMode || !drag || !boxRef.current) return
    const rect = boxRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    setDrag((d) => ({ ...d, x1: x, y1: y }))
  }

  const handleMouseUp = (e) => {
    if (!selectMode || !drag || !boxRef.current) return
    const rect = boxRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    const finalDrag = { ...drag, x1: x, y1: y }
    setDrag(null)
    const left = Math.min(finalDrag.x0, finalDrag.x1)
    const top = Math.min(finalDrag.y0, finalDrag.y1)
    const width = Math.abs(finalDrag.x1 - finalDrag.x0)
    const height = Math.abs(finalDrag.y1 - finalDrag.y0)
    if (width < 8 || height < 8) { setSelectMode(false); return }
    setSelectMode(false)
    runOcrTranslate({ left, top, width, height })
  }

  const rectStyle = drag
    ? {
        left: Math.min(drag.x0, drag.x1),
        top: Math.min(drag.y0, drag.y1),
        width: Math.abs(drag.x1 - drag.x0),
        height: Math.abs(drag.y1 - drag.y0),
      }
    : null

  const handleCopy = () => {
    if (!result || !result.translation) return
    navigator.clipboard.writeText(result.translation).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="img-translator" ref={boxRef}
      style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', userSelect: selectMode ? 'none' : 'auto' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { if (drag) setDrag(null) }}
    >
      <img ref={imgRef} src={src} alt={alt} draggable={false}
        style={{ maxWidth: '100%', display: 'block', borderRadius: 6, boxShadow: '0 6px 20px rgba(60,40,50,.18)', cursor: selectMode ? 'crosshair' : 'default' }} />

      {/* 翻译工具栏 */}
      <div className="img-translator-bar" style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, zIndex: 20 }}>
        {!selectMode ? (
          <>
            <button className="img-tr-btn primary" onClick={() => { resetResult(); setSelectMode(true) }}>
              <ScanText size={14} /> 框选翻译
            </button>
            <button className="img-tr-btn" onClick={() => runOcrTranslate(null)}>
              <Languages size={14} /> 整页翻译
            </button>
          </>
        ) : (
          <>
            <span className="img-tr-hint">按住拖动，框选要翻译的区域</span>
            <button className="img-tr-btn ghost" onClick={() => setSelectMode(false)}><X size={14} /> 取消</button>
          </>
        )}
      </div>

      {/* 框选遮罩 */}
      {drag && <div style={{
        position: 'absolute', border: '2px solid #0e7490', background: 'rgba(14,116,144,.18)',
        borderRadius: 2, pointerEvents: 'none', zIndex: 15, ...rectStyle,
      }} />}

      {/* 识别进度遮罩 */}
      {busy && (
        <div className="img-tr-busy" style={{ position: 'absolute', inset: 0, zIndex: 25, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.82)', borderRadius: 6, gap: 8 }}>
          <Loader size={22} className="spin" />
          <span style={{ fontSize: 12, color: '#37828b', fontWeight: 700 }}>{busy.status || '处理中…'}</span>
          <div style={{ width: 140, height: 4, background: '#e6eef0', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(6, Math.min(100, (busy.progress || 0) * 100))}%`, height: '100%', background: '#0e7490', transition: 'width .2s' }} />
          </div>
        </div>
      )}

      {/* 翻译结果弹窗 */}
      {result && (
        <div className="img-tr-result" style={{ position: 'absolute', left: 0, top: '100%', marginTop: 10, zIndex: 30, background: '#fffdfd', border: '1px solid rgba(190,110,125,.25)', borderRadius: 12, boxShadow: '0 18px 44px rgba(60,40,50,.22)', padding: '14px 16px', minWidth: 300, maxWidth: 'min(560px, 90vw)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: '#7a6a70', fontWeight: 800, letterSpacing: '.06em' }}>识别 + 翻译</span>
            <button onClick={() => resetResult()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}>
              <X size={14} />
            </button>
          </div>
          {result.source ? (
            <>
              <div style={{ fontSize: 13, color: '#3f5960', lineHeight: 1.6, marginBottom: 8, background: '#f6fafb', padding: '8px 10px', borderRadius: 8, maxHeight: 160, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{result.source}</div>
              <div style={{ fontSize: 15, color: '#16262b', lineHeight: 1.7, fontWeight: 500 }}>{result.translation}</div>
              {!result.error && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#374151' }}>
                    {copied ? <><Check size={12} /> 已复制</> : <><Copy size={12} /> 复制译文</>}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: result.error ? '#b24f52' : '#3f5960', lineHeight: 1.6 }}>{result.translation}</div>
          )}
        </div>
      )}
    </div>
  )
}
