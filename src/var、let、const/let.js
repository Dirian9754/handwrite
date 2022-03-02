/**
 * 手写源码系列之let
 *
 * let的标准定义：
 * 可以使用let关键字创建一个命名变量
 * 变量标识符必须是一个合法的变量标识符
 * 变量不能在初始化完成前引用，不能在脚本运行时重新声明
 * 变量拥有块级作用域
 */

/**
 * 创建一个对象来模拟作用域
 */
 var __scope__ = {};

 /**
  * 收集所有 let 声明的变量
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
  * 定义 let 实现
  *
  */
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
 