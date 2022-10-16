### Study MVVM and Data Binding

詳細說明 - [Blog 連結](https://link.medium.com/Dh5EXF7vaub)

#### 研究、紀錄、實作

- 前端如何做到數據綁定
- 訂閱/發佈模式
- MVVM
- Proxy vs defineProperty
- 響應式, 數據驅動畫面。

<br/>

```html
<div>{{ text }}</div>

<script>
const data = { text: 'init' }

// expect auto re-render UI on update
data.text = 'Hello'
</script>
```

#### 檔案目錄

- `./study/` 跟著網路文章實作的內容
- `index.html` 與 `view-model.esm.js` 為個人消化, 精簡後的實作

#### 參考

- [Vue-like proxy-mvvm](https://github.com/naihe138/proxy-mvvm)
- [ES6 系列之 defineProperty 与 proxy](https://juejin.cn/post/6844903710410162183)
- [原生js实现MVVM核心框架](https://juejin.cn/post/7007683714654142472)
- [原生js實現響應式，數據驅動](https://www.twblogs.net/a/5ee7cc31484decb087a73838)
- [簡單聊一下 one-way data flow、two-way data binding 與前端框架](https://devs.tw/post/40)
- [Create One-way Data Binding with Vanilla JS](https://blog.bitsrc.io/demystifying-react-create-one-way-data-binding-with-vanilla-js-cd49b70ec75)
