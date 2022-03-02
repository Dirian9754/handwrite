# 手写源码系列（一）：var、let、const

## 前言

我们都知道在 ES6 标准中提出了两个定义变量的新关键字 let 和 const， 那么如果需要将 ES6 的代码转化为 ES5，如何解决 let 和 const 的语法问题，当然你可以选择用 babel 的 polyfill，但是用过 babel 的同学可能都发现了，babel 只是简单的将 let 和 const 转化成了 var，那么如果我们想要保留一些 let 和 const 的特性又该如何做呢？如何在 ES5 环境下模拟实现 ES6 的 let、const 关键字呢？让我们来尝试着解决下

## 首先来看下关于 let、const 的定义标准

- let 声明一个块级作用域的局部变量，const 声明一个块级作用域的只读常量
- let 和 const 声明的标识符必须是一个合法的 javascript 标识符
- let 和 const 声明的标识符不允许被重新声明
- let 和 const 声明的标识符未初始化前存在暂时性死区
- const 声明的标识符不允许被重新赋值

以上就是 let 和 const 的定义标准，可以看出相比于使用 var 来声明变量，let 和 const 增加了更严谨的约束，这也是为了解决使用 var 来声明变量留下的各种问题，同时也可以看出 javascript 有正在慢慢从弱类型向强类似语言靠近的趋势

## 接下来我们看看如何实现这个需求

首先我们知道 javascript 中声明的变量都是保存在作用域中，那么我们可以创建一个对象来模拟 javascript 中的作用域，把声明的变量看作是对象的属性

```js
var __scope__ = {};
```

第一个问题，let 和 const 声明的标识符必须是一个合法的 javascript 标识符，由于对象的属性名都是字符串类型，因此所有的变量名都可以作为对象的属性名，当然我们也可以做一层校验，判断变量名中是否存在不合法的字符，最简单的方法就是使用正则判断，具体实现这里就不写了

## 不允许重复声明和作用域提升

> 由于 javascript 中有预编译的概念，声明变量会被提升到作用域的顶层，而 let 和 const 声明的标识符不允许被重新声明，javascript 在预编译阶段就能检测出重复声明的标识符，因此我们也要做一层检查

我们利用一个数组先来保存所有声明的标识符，类似于预编译阶段的变量声明提升：

```js
var __scope__ = {};

var __variable__ = [];

for (var i = 0; i < __variable__.length; i++) {
  var property = __variable__[i];
  if (__scope__.hasOwnProperty(property)) {
    throw new SyntaxError(
      "Identifier " + property + " has already been declared"
    );
  }
}
```

然后利用对象的 hasOwnProperty 方法来检查\_\_scope\_\_是否拥有重复的属性，如果\_\_variable\_\_数组中有重复的 key 就会抛出一个重复声明的错误，如此我们就解决了变量重复声明的问题

## 关于暂时性死区

> 在 ES6 中，let 和 const 声明会被提升但未初始化，在变量声明之前引用块中的变量会导致错误，因为从块开始到处理声明为止，该变量都处于“临时死区”中

ok，我们接下来解决在声明之前访问变量的问题，这一步我们也可以在收集变量阶段一起处理，利用 ES5 的 Object.defineProperty API 对访问进行劫持：

```js
var __scope__ = {};

var __variable__ = [];

for (var i = 0; i < __variable__.length; i++) {
  var property = __variable__[i];
  if (__scope__.hasOwnProperty(property)) {
    throw new SyntaxError(
      "Identifier " + property + " has already been declared"
    );
  } else {
    Object.defineProperty(__scope__, property, {
      configurable: true,
      enumerable: false,
      get() {
        throw new ReferenceError(
          "Cannot access " + property + " before initialization"
        );
      },
    });
  }
}
```

如果在变量初始化前访问，就会抛出一个引用错误，这样我们就解决了变量初始化前引用的问题

## let 和 const 的实现

接下去我们看看如何实现 let 和 const 声明变量

我们来实现一个 let 函数来模拟：

```js
function __let__(key, value) {
  return Object.defineProperty(__scope__, key, {
    configurable: false,
    enumerable: false,
    get: function () {
      return value;
    },
    set: function (newValue) {
      value = newValue;
    },
  });
}
```

key 值为 let 声明的变量名，value 值为赋给变量的值，由于 let 声明的变量可以被重新赋值，因此同样做出了改变值处理，这样我们就可以在语法分析阶段做类似如下处理：

```js
let js = "jsvascript";
// 转义后
__let__("js", "jsvascript");
```

实现了 let，我们再来看看 const，const 声明的变量有一项要求，需要在初始化时赋值，因此我们调整一下：

```js
function __const__(key, value) {
  if (arguments.length === 1) {
    throw new SyntaxError("Missing initializer in const declaration");
  }

  return Object.defineProperty(__scope__, key, {
    configurable: false,
    enumerable: false,
    get: function () {
      return value;
    },
    set: function () {
      throw new TypeError("Assignment to constant variable");
    },
  });
}
```

我们利用函数的 arguments 长度来判断是否给了初始值，注意这里不能使用 undefined 来判断，因为 const 允许初始化值时使用 undefined，如果没有传递第二个参数，那么就会抛出一个错误：

```js
const immutable = undefined

const immutable;

immutable = 'immutable'

// 转义后

__const__('immutable', undefined) // √

__const__('immutable') // ✖ Uncaught SyntaxError: Missing initializer in const declaration

__scope__.immutable = 'immutable' // ✖ Uncaught TypeError: Assignment to constant variable
```

const 声明的变量不允许被重新赋值，我们在 set 方法中对做了拦截处理，如果变量被重新赋值就会触发 set 方法，然后抛出一个错误，当然这里也可以通过 设置 writable 属性为 false 加上严格模式来实现

## 关于块级作用域

let 和 const 声明的变量具有块级作用域的特点，这个不难实现，我们可以用一个闭包来解决：

```js
{
  let js = "jsvascript";
}

// 转义后

{
  (() => {
    __let__("js", "jsvascript");
  })();
}
```

## 关于作用域链

在 Javacript 中存在作用域的概念，内层可以访问外层的作用域，全局作用域作为最顶层的作用域，可以被整个程序访问，这种结构和原型链的概念非常相似，因此我们可以利用原型链来实现这种效果：

```js
(function (__globalScope__) {
  var __scope__ = Object.create(__globalScope__)
})(__scope__);
```

在利用闭包隔绝作用域的时候，可以把外层的作用域传递进去当做内层作用域的原型，这样顺着原型链就能找到外层作用域上声明的变量了

## 写在最后

以上就是关于如何在 ES5 中模拟实现 let 和 const 的效果，当然这其中还有很多不足，而且 ES6 的 let 和 const 是由底层实现的，再怎么样模拟也无法达到一模一样的效果，本文只是提供了一种思路，在实现过程中可以加深对 let 和 const 的理解，这才是思考这道题的最终目的
