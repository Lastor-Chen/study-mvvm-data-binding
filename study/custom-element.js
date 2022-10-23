// refer to https://blog.bitsrc.io/demystifying-react-create-one-way-data-binding-with-vanilla-js-cd49b70ec75

class CustomComponent extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.mainComp = document.createElement('span')
    this.mainComp.setAttribute('class', 'custom-comp')

    this.customStyle = ''
    this._style = document.createElement('style')
    this._style.textContent = ''

    this.shadowRoot.append(this._style)
    this.shadowRoot.append(this.mainComp)
  }

  connectedCallback() {
    this.setUpAccessors()
    this.display()
  }

  attributeChangedCallback(name, old, newName) {
    this.display()
  }

  render() {}

  display() {
    this._style.textContent = this.customStyle
    while(this.mainComp.children.length > 0) {
      this.mainComp.removeChild(this.mainComp.childNodes[0])
    }
    this.mainComp.appendChild(this.render())
  }

  /** @param {string} name */
  sanitizeName(name) {
    let parts = name.split('-')
    return [
      parts.shift(),
      ...parts.map((part) => part[0].toUpperCase() + part.slice(1))
    ].join('')
  }

  setUpAccessors() {
    this.getAttributeNames().forEach((name) => {
      Object.defineProperty(this, this.sanitizeName(name), {
        set: (value) => this.setAttribute(name, value),
        get: () => this.getAttribute(name),
      })
    })
  }
}

class CounterComponent extends CustomComponent {
  static observedAttributes = ['current-counter']
  constructor() {
    super()

    this.customStyle = `
      .custom-comp {
        padding: 10px;
        display: block;
        color: red;
      }
      .legend {
        display: block;
      }
      button {
        margin: 5px;
      }
    `
  }

  handleUpClick() {
    this.currentCounter++
  }
  handleDownClick() {
    this.currentCounter--
  }

  render() {
    // the wrapper element
    const wrapper = document.createElement('div')

    // the span where the text goes
    const textElem = document.createElement('span')
    textElem.setAttribute('class', 'legend')
    const text = this.getAttribute('data-text')
    textElem.textContent = text.replace('$$', this.currentCounter)
    wrapper.appendChild(textElem)

    //the up button
    const buttonUp = document.createElement('button')
    buttonUp.textContent = 'Up'
    buttonUp.addEventListener('click', this.handleUpClick.bind(this))
    wrapper.appendChild(buttonUp)

    //the down button
    const buttonDown = document.createElement('button')
    buttonDown.textContent = 'Down'
    buttonDown.addEventListener('click', this.handleDownClick.bind(this))
    wrapper.appendChild(buttonDown)

    return wrapper
  }
}

window.customElements.define('counter-component', CounterComponent)
