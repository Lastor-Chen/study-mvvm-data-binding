// refer to https://github.com/naihe138/proxy-mvvm
// @ts-check

class MVVM {
  /**
   * @typedef {() => void} Hook
   * @this MVVM['_vm']
   */

  /**
   * @param {object} options
   * @param {string} [options.el]
   * @param {object} [options.data]
   * @param {{ [key in string | symbol]: () => any }} [options.computed]
   * @param {Hook} [options.mounted]
   */
  constructor(options = {}) {
    if (!options.el) throw new Error(`el prop is required`)
    this.$options = options
    // 代理 data
    this._data = observe(options.data)
    // 建立一個空的, 不從 options 拿, 避免共用到同個 reference
    this._computed = {}
    // 代理整個 instance
    this._vm = this.#initVm()
    this.#initComputed()
    new Compile(options.el, this._vm)
    this.#mounted()
    return this._vm
  }

  #initVm() {
    return new Proxy(this, {
      get(target, prop) {
        return target[prop] || target._data[prop] || target._computed[prop]
      },
      set(target, prop, newValue) {
        console.log('setter')
        return Reflect.set(target._data, prop, newValue)
      }
    })
  }

  #initComputed() {
    const computed = this.$options.computed
    if (!computed) return void 0

    Object.keys(computed).forEach((key) => {
      this._computed[key] = computed[key].call(this._vm)
      new Watcher(this._vm, key, () => {
        this._computed[key] = computed[key].call(this._vm)
      })
    })
  }

  #mounted() {
    this.$options.mounted?.call(this._vm)
  }
}

class Observe {
  constructor(data) {
    // 依賴
    this.dep = new Dep()
    for (let key in data) {
      data[key] = observe(data[key])
    }
    return this.#proxy(data)
  }

  #proxy(data) {
    let dep = this.dep
    return new Proxy(data, {
      get(target, prop) {
        // 防重複
        if (Dep.target && !dep.subscriptions.includes(Dep.exp)) {
          dep.addSub(Dep.exp, Dep.target)
        }
        return Reflect.get(target, prop)
      },
      set(target, prop, newValue) {
        const isSuccess = Reflect.set(target, prop, observe(newValue))
        if (isSuccess) { dep.notify() }
        return isSuccess
      },
    })
  }
}

class Compile {
  /**
   * @param {string} el 
   * @param {MVVM['_vm']} vm 
   */
  constructor(el, vm) {
    this.vm = vm
    const elem = document.querySelector(el)
    if (!elem) throw new Error('Cannot found target el')
    const frag = document.createDocumentFragment()
    frag.append(elem)
    this.replace(frag)
    document.body.prepend(frag)
  }

  /** @param {DocumentFragment | ChildNode} frag */
  replace(frag) {
    const vm = this.vm
    frag.childNodes.forEach(node => {
      const txt = /** @type {string} */ (node.textContent)
      const reg = /\{\{(.*?)\}\}/g

      // check ELEMENT_NODE
      if (node.nodeType === Node.ELEMENT_NODE) {
        const elem = /** @type {HTMLElement} */ (node)
        for (const attr of elem.attributes) {
          const name = attr.name
          const exp = attr.value
          // input 雙綁
          if (name.includes('v-model')) {
            const inputElem = /** @type {HTMLInputElement} */ (node)
            inputElem.value = this.getValueOfVM(exp)
            inputElem.addEventListener('input', () => {
              this.setValueOfVM(exp, inputElem.value)
            })
          }
        }
      }

      // check TEXT_NODE
      const self = this;
      if (node.nodeType === Node.TEXT_NODE && reg.test(txt)) {
        // 被訂閱的 dep fn
        (function replaceTxt() {
          node.textContent = txt.replace(reg, (matched, placeholder) => {
            new Watcher(vm, placeholder, replaceTxt)
            return self.getValueOfVM(placeholder)
          })
        })()
      }

      if (node.childNodes && node.childNodes.length) {
        this.replace(node)
      }
    })
  }

  /**
   * @param {string} exp
   * @return {any}
   */
  getValueOfVM(exp) {
    // {{ obj.key }} 需要去前後空白
    return exp.split('.').reduce((obj, key) => obj[key.trim()], this.vm) || ''
  }

  /**
   * @param {string} exp
   * @param {any} val
   */
  setValueOfVM(exp, val) {
    exp.split('.').reduce((obj, key, idx, self) => {
      if (idx === self.length - 1) {
        obj[key.trim()] = val
      }
      return obj[key.trim()]
    }, this.vm)
  }
}

// 訂閱發佈, 依賴
class Dep {
  // 給 Watch 添加訂閱, 臨時屬性
  static exp = ''
  /** @type {Watcher | null} */
  static target = null

  /** @type {Array<string | Watcher>} */
  subscriptions = []

  addSub(...subs) {
    this.subscriptions.push(...subs)
  }

  notify() {
    this.subscriptions.forEach(item => {
      if (typeof item !== 'string') {
        item.update()
      }
    })
  }
}

class Watcher {
  /** @param {() => void} fn */
  constructor(vm, exp, fn) {
    this.vm = vm
    this.fn = fn
    // 提供給 Observe.#proxy getter
    Dep.exp = exp
    Dep.target = this
    this.#triggerGetter(exp)
    // getter 觸發後清除
    Dep.exp = ''
    Dep.target = null
  }

  /** @param {string} exp */
  #triggerGetter(exp) {
    exp.split('.').reduce((obj, key) => obj[key.trim()], this.vm)
  }

  /** proxy.set 觸發 notify, 再觸發 update 調用 callback fn */
  update() {
    this.fn()
  }
}

function observe(data) {
  if (!data || typeof data !== 'object') return data
  return new Observe(data)
}

export default MVVM
