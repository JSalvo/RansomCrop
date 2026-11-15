import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["name", "color", "regions", "stage", "image", "json", "zoom"]
  static values = { defaultJson: String }


connect() {
  this.regions = []
  if (this.hasDefaultJsonValue) this.jsonTarget.value = this.defaultJsonValue

  this.lastWidth = 0
  this.observer = new ResizeObserver(() => this.syncRegions())
  this.observer.observe(this.imageTarget)
}

disconnect() {
  this.observer?.disconnect()
}

syncRegions() {
  const width = this.imageTarget.clientWidth
  if (!width) return

  if (this.lastWidth) {
    const ratio = width / this.lastWidth
    this.regions.forEach(({ el }) => {
      el.style.left = `${el.offsetLeft * ratio}px`
      el.style.top = `${el.offsetTop * ratio}px`
      el.style.width = `${el.offsetWidth * ratio}px`
      el.style.height = `${el.offsetHeight * ratio}px`
    })
  }
  this.lastWidth = width
}
    createRegion({ name, color, left, top, width, height })
  {
    const el = document.createElement("div")
    el.style.cssText = `
      position:absolute; left:${left}px; top:${top}px; width:${width}px; height:${height}px;
      box-sizing:border-box; cursor:move; touch-action:none;
      border:2px solid ${color};
      background:color-mix(in srgb, ${color} 30%, transparent);
    `

    const label = document.createElement("span")
    label.textContent = name
    label.style.cssText = `
      position:absolute; top:0; left:0; padding:1px 4px; font:12px sans-serif;
      color:#fff; background:${color}; pointer-events:none;
    `

    const handle = document.createElement("div")
    handle.style.cssText = `
      position:absolute; right:0; bottom:0; width:14px; height:14px;
      background:${color}; cursor:nwse-resize; touch-action:none;
    `

    const remove = document.createElement("button")
    remove.type = "button"
    remove.textContent = "×"
    remove.style.cssText = `
      position:absolute; top:0; right:0; width:18px; height:18px; padding:0;
      line-height:16px; font:14px sans-serif; color:#fff; background:#000;
      border:0; cursor:pointer;
    `
    remove.addEventListener("pointerdown", (e) => e.stopPropagation())
    remove.addEventListener("click", () => this.removeRegion(el))

    el.append(label, handle, remove)
    this.stageTarget.appendChild(el)

    this.regions.push({ el, name, color })

    el.addEventListener("pointerdown", (e) => {
      if (e.target === handle) return
      this.startInteraction(e, el, "move")
    })
    handle.addEventListener("pointerdown", (e) => this.startInteraction(e, el, "resize"))
  }

  

  addRegion() 
  {
    const name = this.nameTarget.value.trim() || `porzione ${this.regions.length + 1}`
    const color = this.colorTarget.value
    this.createRegion({ name, color, left: 10, top: 10, width: 120, height: 80 })
    this.nameTarget.value = ""
  }

    // Rimuove la regione di estrazione
    removeRegion(el) 
    {
      this.regions = this.regions.filter((r) => r.el !== el)
      el.remove()
    }
    
    loadJson() 
    {
      let data
      try {
        data = JSON.parse(this.jsonTarget.value)
      } catch (e) {
        alert("JSON non valido")
        return
      }
      if (!Array.isArray(data)) return

      const img = this.imageTarget
      const scaleX = img.clientWidth / img.naturalWidth
      const scaleY = img.clientHeight / img.naturalHeight

      data.forEach((r) => {
        this.createRegion({
          name: String(r.name ?? ""),
          color: /^#[0-9a-f]{6}$/i.test(r.color) ? r.color : "#ff0000",
          left: Math.round(r.x * scaleX),
          top: Math.round(r.y * scaleY),
          width: Math.round(r.width * scaleX),
          height: Math.round(r.height * scaleY)
        })
      })
  }

applyZoom() {
  const percent = Math.min(Math.max(parseFloat(this.zoomTarget.value) || 100, 10), 400)
  const img = this.imageTarget

  img.style.maxWidth = "none"
  img.style.width = `${Math.round(img.naturalWidth * percent / 100)}px`
}

  startInteraction(e, el, mode) {
    e.preventDefault()
    e.stopPropagation()

    const stage = this.stageTarget.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const start = {
      left: el.offsetLeft, top: el.offsetTop,
      width: el.offsetWidth, height: el.offsetHeight
    }

    const onMove = (ev) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY

      if (mode === "move") {
        const left = Math.min(Math.max(0, start.left + dx), stage.width - start.width)
        const top = Math.min(Math.max(0, start.top + dy), stage.height - start.height)
        el.style.left = `${left}px`
        el.style.top = `${top}px`
      } else {
        const width = Math.min(Math.max(20, start.width + dx), stage.width - start.left)
        const height = Math.min(Math.max(20, start.height + dy), stage.height - start.top)
        el.style.width = `${width}px`
        el.style.height = `${height}px`
      }
    }

    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  prepare(event) 
  {
    if (this.regions.length === 0) {
      event.preventDefault()
      return
    }

    const img = this.imageTarget
    const scaleX = img.naturalWidth / img.clientWidth
    const scaleY = img.naturalHeight / img.clientHeight

    const data = this.regions.map(({ el, name, color }) => ({
      name,
      color,
      x: Math.round(el.offsetLeft * scaleX),
      y: Math.round(el.offsetTop * scaleY),
      width: Math.round(el.offsetWidth * scaleX),
      height: Math.round(el.offsetHeight * scaleY)
    }))

    this.regionsTarget.value = JSON.stringify(data)
  }
}