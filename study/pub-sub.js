// Reactive Programming via Publish/Subscribe pattern
// refer to https://www.twblogs.net/a/5ee7cc31484decb087a73838

// @ts-check

const Dep = {
  /** @type {{ [key: string]: Array<() => void> }} */
  clientList: {},
  listen(key, fn) {
    this.clientList[key] ||= []
    this.clientList[key].push(fn)
  },
  trigger() {
    const key = Array.prototype.shift.call(arguments)
    const fns = this.clientList[key]
    if (!fns || !fns.length) return void 0

    fns.forEach((fn) => {
      fn.apply(this, arguments)
    })
  }
}

function dataHijack({ data, tag, dataKey, selector }) {
  let value = ''
  /** @type {HTMLElement} */
  const el = document.querySelector(selector)
  // 劫持數據
  Object.defineProperty(data, dataKey, {
    get() {
      console.log('got data')
      return value
    },
    set(newValue) {
      console.log('set data')
      value = newValue
      Dep.trigger(tag, newValue)
    }
  })

  Dep.listen(tag, (text) => {
    el.innerHTML = text
  })
}

export default dataHijack
