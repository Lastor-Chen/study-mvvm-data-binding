// @ts-check

class ReactiveData {
  data
  /** @type {null | ((newValue) => void)} */
  #subscriber = null

  /**
   * @param {any} data 
   * @param {(newValue) => void} onUpdate 
   */
  constructor(data, onUpdate) {
    this.data = data
    this.#subscribe(onUpdate)
  }

  #subscribe(fn) {
    if (this.#subscriber === fn) return void 0
    this.#subscriber = fn
  }

  set(newValue) {
    if (this.data === newValue) return void 0
    this.data = newValue
    
    if (!this.#subscriber) return void 0
    this.#subscriber(newValue)
  }
}

const userName = new ReactiveData('Tom', (val) => {
  /** @type {HTMLElement | null} */
  const target = document.querySelector('.box-1')
  if (!target) return void 0

  target.innerText = val
})
userName.set('John')

const isShow = new ReactiveData(true, (val) => {
  /** @type {HTMLElement | null} */
  const box1 = document.querySelector('.box-1')
  if (box1) {
    box1.classList.toggle('hidden', !val)
  }

  /** @type {HTMLElement | null} */
  const showBtn = document.querySelector('#showBtn')
  if (showBtn) {
    showBtn.innerText = val ? 'Hide' : 'Show'
  }
})

const showBtn = document.querySelector('#showBtn')
showBtn?.addEventListener('click', () => {
  console.log('click')
  isShow.set(!isShow.data)
})

// 類 React
// ==============
// const data = {
//   name: 'Tom',
// }

// function bindData(data, prop, fn) {
//   if (!data[prop]) throw new Error('Cannot found prop in data')
//   return function(val) {
//     data[prop] = val
//     fn(val)
//   }
// }

// const setData = bindData(data, 'name', (val) => {
//   document.querySelector('.box-1').innerText = val
// })

// setData('Tom')
