export function prepend( obj, name, newfn ) {
    var origfn = obj[name] || function() {};
    obj[name] = function() {
      var r1 = newfn.apply( obj, arguments );
      var r2 = origfn.apply( obj,arguments );
      return r2;
    }
}

export function append( obj, name, newfn ) {
    var origfn = obj[name] || function() {};
    obj[name] = function() {
      var r1 = origfn.apply( obj,arguments );
      var r2 = newfn.apply( obj, arguments );
      return r2;
    }
}

export function chain( obj, name, newfn ) {
    var origfn = obj[name] || function() {};
    obj[name] = function() {
      return newfn.apply( {orig:origfn}, arguments );
    }
}

// todo: t-builder?
// т.е. prependPart или типа того.. короче тут надо развернуть строительство функций
// именованных в духе т-каналов, и еще видимо надо будет unchain методы сделать
// т.е. это как подписка на события получается в каком-то смысле, но это древовидная
// структура/// а забавная вещица может выйти!
