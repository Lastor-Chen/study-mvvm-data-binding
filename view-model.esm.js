// @ts-check

class VM {
  /** @type {{[id: string]: Array<() => void>}} */
  #subscription = {}

  /** @param {object} data */
  constructor(data) {
    this.data = this.#initData(data)
  }

  /** @param {string} selector */
  mount(selector) {
    this.#compile(selector)
    return this
  }

  /**
   * @param {object} data 
   * @param {string} [previousKey] 將 data key 累加作為訂閱的 id, 例: "obj.key.key"
   */
  #initData(data, previousKey = '') {
    if (typeof data !== 'object') return data

    // 遍歷單層所有 object prop
    for (const key in data) {
      const accumulateKey = previousKey ? `${previousKey}.${key}` : key
      data[key] = this.#initData(data[key], accumulateKey)
    }
    return this.#setProxy(data, previousKey)
  }

  /**
   * @param {object} obj 
   * @param {string} [key] 訂閱用 id
   */
  #setProxy(obj, key) {
    return new Proxy(obj, {
      set: (target, prop, newValue) => {
        const isSuccess = Reflect.set(target, prop, newValue)
        // 觸發更新 html
        const subscriptionKey = key ? `${key}.${String(prop)}` : prop
        if (isSuccess) {this.#trigger(subscriptionKey)}
        return isSuccess
      }
    })
  }

  /** @param {string} selector */
  #compile(selector) {
    /** @type {HTMLElement | null} */
    const elem = document.querySelector(selector)
    if (!elem) throw new Error(`Cannot found Element ${selector}`)

    // 建立虛擬 DOM 片段
    const frag = document.createDocumentFragment()
    frag.append(elem)

    // 掃描 DOM 替換 data
    this.#bindDataToHtml(frag)

    // 塞回 body
    document.body.prepend(frag)
  }

  /** @param {DocumentFragment | ChildNode} frag */
  #bindDataToHtml(frag) {
    frag.childNodes.forEach((node) => {
      // 處理 text node
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent
        const reg = new RegExp(/\{\{(.*?)\}\}/, 'g')
        if (!text || !reg.test(text)) return void 0
        // 生成, 更新 template 之依賴 func
        const dep = this.#replace(node, text, reg)
        // 首次渲染
        dep()

        // 訂閱, 追加 flag
        const expString = reg.exec(text)?.[1]
        expString && this.#subscribe(expString.trim(), dep)
      }

      // 繼續往子層遞迴
      if (node.hasChildNodes()) {
        this.#bindDataToHtml(node)
      }
    })
  }

  /**
   * @param {Node} node 
   * @param {string} text 
   * @param {RegExp} reg 
   */
  #replace(node, text, reg) {
    // 閉包, 返回一個新函式
    return () => {
      // 替換 {{ exp }} 為 data
      node.textContent = text.replace(reg, (matched, exp) => {
        return exp.split('.').reduce((data, key) => data[key.trim()], this.data)
      })
    }
  }

  /**
   * @param {string} key 
   * @param {() => void} fn 
   */
  #subscribe(key, fn) {
    this.#subscription[key] ||= []
    this.#subscription[key].push(fn)
  }

  #trigger(key) {
    this.#subscription[key].forEach((dep) => dep())
  }
}

/** @param {object} [data] */
function createVM(data = {}) {
  return new VM(data)
}

export { createVM }
