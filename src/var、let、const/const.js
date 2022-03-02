/**
 * 手写源码系列之const
 *
 * const的标准定义：
 * 可以使用const关键字创建一个只读的命名常量
 * 常量标识符必须是一个合法的变量标识符
 * 常量不能通过赋值改变值，也不能在脚本运行时重新声明，它必须初始化为一个值
 * 常量不能在初始化完成前引用
 * 常量拥有块级作用域
 */

/**
 * 创建一个对象来模拟作用域
 */
var __scope__ = {};

/**
 * 收集所有 const 声明的变量
 */
var __variable__ = [];

/**
 * 查看是否有重复声明的变量名，并且设置变量在初始化前不能访问
 */
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

/**
 *
 * 定义 const 实现
 *
 * 实现思路：
 *
 * 常量需要在定义的时候初始化值，通过检查 arguments 的长度来判断实参的个数，对于没有初始化的常量抛出错误
 *
 * 常量在初始化后不允许重新赋值，利用 Object.defineProperty 定义常量的 set 方法，在重新赋值时抛出错误
 *
 */
function __const__(key, value) {
  if (arguments.length === 1) {
    throw new SyntaxError("Missing initializer in const declaration");
  }

  return Object.defineProperty(__scope__, key, {
    enumerable: false,
    configurable: false,
    get: function () {
      return value;
    },
    set: function () {
      throw new TypeError("Assignment to constant variable");
    },
  });
}

/**
 * 
 * 对于块级作用域，利用闭包来实现作用域的隔阂
 * 
 * 对于作用域链，可以利用原型链来实现相应的效果
 *
 */
(function (__globalScope__) {
  var __scope__ = Object.create(__globalScope__)
})(__scope__);
