// потребность: должен быть параметр-ссылка на некий параметр другого объекта
// это нам требуется для реализации Links Дениса

// решение: добавляет гуи для хранения ссылки
// особенности: если мы ставим ссылку на другой объект/параметр,то должны забывать о ней
// в случае удаления того объекта. Хотя может и не обязательно - ну подумаешь нерабочая ссылка
// но отписаться нужно точно

function default_crit_fn( obj ) {
  return Object.keys( obj.params );
}

/*
function traverse ( obj, fn ) {
    var cc = obj.getChildNames();
    for (var i=0; i<cc.length; i++) {
      var name = cc[i];
      var obj = obj.getChildByName( name );
      var res = fn( obj );
      traverse( obj, fn );
    }
  }
*/

export default function setup(vz) {
  
  vz.chain("create_obj",function( x, opts ) {

  x.addParamRef = function( name, value, crit_fn, fn ) {
    //var values = gatherParams( crit_fn || default_crit_fn );
    var values = [];
    var rec = x.addGui( { type: "combostring", name: name, value: value, values: values, crit_fn: crit_fn, fn: fn } );
    rec.getValues = function() {
      return gatherParams( crit_fn || default_crit_fn );
    }
    return rec;
  }
  // здесь crit_fn по объекту должна выдать перечень имен его допустимых параметров
  
  function gatherParams( crit_fn ) {
    var acc = [""];
    var r = x.findRoot();

    r.ns.traverse( function(obj) {
      var param_names = crit_fn( obj );
      param_names.forEach( function(p) {
        acc.push( obj.getPath() + "->" + p );
      });
    });
    return acc;
  }
  
  return this.orig( x,opts );
  
  });
  
/*  
  x.chain("setParam",function (name, value) {
    if (x.references && x.references[name]) {
      // ага это ссылка
      var xpath = vz.get_path( x );

      var old = x.getParam( name );
      if (old) {
        var oldobj = vz.find_by_path( x, old );
        if (oldobj && oldobj.references) {
          delete oldobj.references_to_me[ xpath ];
        }
      }
      
      var obj = vz.find_by_path( x,value );

      if (obj) {
        if (!obj.references_to_me) obj.references_to_me = {};
        obj.references_to_me[ xpath ] = name;
      }
    }
    this.orig( name, value );
  });
  
  x.setReference = function( name ) {
    if (!x.references) x.references = {};
    x.references[name] = true;
  }

    // забыть все ссылки на нас надо
  x.chain("remove",function() {
    Object.keys( x.references_to_me || {} ).forEach( function(k) {
      var ko = vz.find_by_path( vz.root, k );
      if (ko) {
        var pn = x.references_to_me[k];
        ko.setReference( pn, undefined );
      }
    });
    this.orig();
  });
*/

//  return x;
}
