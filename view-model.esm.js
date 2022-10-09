// @ts-check

class VM {
  data = {}
  /** @type {{[id: string]: Array<() => void>}} */
  #subscription = {}

  /**
   * @param {object} options
   * @param {string} options.el
   * @param {object} options.data
   */
  constructor(options) {
    this.data = this.#initData(options.data)
    this.#compile(options.el)
  }

  /**
   * @param {object} data 
   * @param {string} [previousKey] 將 data key 累加作為訂閱的 id, 例: "obj.prop.prop"
   */
  #initData(data, previousKey) {
    if (typeof data !== 'object') return data
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
      get(target, prop) {
        return Reflect.get(target, prop)
      },
      set: (target, prop, newValue) => {
        // 觸發更新 html
        const isSuccess = Reflect.set(target, prop, newValue)
        const subscriptionKey = key ? `${key}.${prop}` : prop
        if (isSuccess) {this.#trigger(subscriptionKey)}
        return isSuccess
      }
    })
  }

  /** @param {string} selector */
  #compile(selector) {
    /** @type {HTMLElement | null} */
    const elem = document.querySelector(selector)
    if (!elem) throw new Error('Cannot found target el')

    // 建立片段
    const frag = document.createDocumentFragment()
    frag.append(elem)

    // 掃描 DOM 替換 data
    this.#bindDataToHtml(frag)

    // 塞回去
    document.body.prepend(frag)
  }

  /** @param {DocumentFragment | ChildNode} frag */
  #bindDataToHtml(frag) {
    frag.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent
        const reg = new RegExp(/\{\{(.*?)\}\}/, 'g')
        if (!text || !reg.test(text)) return void 0
        // 更新
        const callback = this.#replace(node, text, reg)
        callback()

        // 訂閱
        const expString = reg.exec(text)?.[1]
        this.#subscribe(expString?.trim(), callback)
      }

      if (node.hasChildNodes()) {
        this.#bindDataToHtml(node)
      }
    })
  }

  #subscribe(prop, fn) {
    this.#subscription[prop] ||= []
    this.#subscription[prop].push(fn)
  }

  #trigger(prop) {
    this.#subscription[prop].forEach((render) => render())
  }

  #replace(node, text, reg) {
    return () => {
      node.textContent = text.replace(reg, (matched, exp) => {
        const val = exp.split('.').reduce((data, key) => data[key.trim()], this.data)
        return val
      })
    }
  }
}

/** @param {object} data */
function createVM(data = {}) {
  return {
    /** @param {string} selector */
    mount(selector) {
      return new VM({ el: selector, data })
    }
  }
}

export { createVM }
