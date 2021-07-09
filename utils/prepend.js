// calls new code before
// вообще-то это название некорректное. в руби prepend это именно что override
//  с возможностью вызывать старое через super
export function prepend( obj, name, newfn ) {
    var origfn = obj[name] || function() {};
    obj[name] = function() {
      var r1 = newfn.apply( obj, arguments );
      var r2 = origfn.apply( obj,arguments );
      return r2;
    }
}

// calls new code after
export function append( obj, name, newfn ) {
    var origfn = obj[name] || function() {};
    obj[name] = function() {
      var r1 = origfn.apply( obj,arguments );
      var r2 = newfn.apply( obj, arguments );
      return r2;
    }
}

// calls new code and transfers responsibility to call old code
export function chain( obj, name, newfn ) {
    var origfn = obj[name] || function() {};
    obj[name] = function() {
      return newfn.apply( {orig:origfn}, arguments );
    }
}

// calls new code after
export function appendOnce( obj, name, newname, newfn ) {
    var origfn = obj[name] || function() {};
    obj[name] = function() {
      var r1 = origfn.apply( obj,arguments );
      var r2 = newfn.apply( obj, arguments );
      obj[name] = origfn;
      return r2;
    }
}
// тут надо разработать строгую модель, опирающуюся на newname..
// и использующую именно ее для вызова, а не ссылки на коды в scope..

// todo: t-builder?
// т.е. prependPart или типа того.. короче тут надо развернуть строительство функций
// именованных в духе т-каналов, и еще видимо надо будет unchain методы сделать
// т.е. это как подписка на события получается в каком-то смысле, но это древовидная
// структура/// а забавная вещица может выйти!
