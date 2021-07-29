// потребность: должен быть параметр-ссылка на некий параметр другого объекта
// это нам требуется для реализации Links Дениса

// решение: добавляет гуи для хранения ссылки
// особенности: если мы ставим ссылку на другой объект/параметр,то должны забывать о ней
// в случае удаления того объекта. Хотя может и не обязательно - ну подумаешь нерабочая ссылка
// но отписаться нужно точно

function default_crit_fn( obj ) {
  return obj.getParamsNames();
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

  x.addParamRef = function( name, value, crit_fn, fn, desired_parent ) {
    desired_parent ||= x;
    //var values = gatherParams( crit_fn || default_crit_fn );
    var values = [];
    var rec = x.addGui( { type: "combostring", name: name, value: value, values: values, crit_fn: crit_fn, fn: fn } );
    rec.getValues = function() {
      return gatherParams( crit_fn || default_crit_fn, desired_parent );
    }
    // special case to convert absolute links comming from parameter values to relative links
    rec.notFound = function( param_path, values ) { // в параметре значение, которого нет в комбо-бокс значениях
      // это случай вероятно, когда param_path абсолютный
      if (param_path && param_path[0] == '/') {
         let [objpath,paramname] = param_path.split("->");
         let obj = desired_parent.findByPath( objpath );
         if (obj) {
           let newpath = obj.getPathRelative( desired_parent ) + "->" + paramname;
           return values.indexOf( newpath );
         } else 
           return 0;
      } // not found
    }
    return rec;
  }
  // здесь crit_fn по объекту должна выдать перечень имен его допустимых параметров
  
  function gatherParams( crit_fn, relative_to_obj ) {
    var acc = [""];
    var r = x.findRoot(); // это получается в рамках текущего куста. а соседние кусты? (подсцены, вид, плеер)?
//    debugger;
    // var acc_full = []; // решено продублировать и полные пути - чтобы не ломать старые приложения...
    // ну либо надо научить combostring принимать то что дают..
    // дублирование это шляпа - там много шлака оказывается
    // надо сделать чтобы на импорте это все произошло    
    

    r.ns.traverse( function(obj) {
      var param_names = crit_fn( obj );
//      if (obj.getPathRelative(x) == "/xr-control") debugger;
      param_names.forEach( function(p) {
        //let objpath = relative_to_obj ? obj.getPathRelative( relative_to_obj ) : obj.getPath();
        let objpath = obj.getPathRelative( relative_to_obj );
        acc.push( objpath + "->" + p );
        ///acc_full.push( obj.getPath() + "->" + p );
      });
    });
    //return acc.concat( acc_full );
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
