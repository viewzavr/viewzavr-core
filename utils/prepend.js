export function prepend( obj, name, newfn ) {
    var origfn = obj[name] || function() {};
    obj[name] = function() {
      return newfn.apply( {orig:origfn}, arguments );
    }
}

// todo: t-builder?
