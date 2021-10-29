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

  // name - имя параметра который является ссылкой
  // value - значение, строка в форме ПУТЬОБЪЕКТА->ИМЯПАРАМЕТРА
  // crit_fn - критерий отбора параметров, f(obj)->names
  // fn - вызывается при измененении; строка вида путь->имяпараметра
  // desired_parent - относительно кого отсчитывать пути

  // todo - нужен какой-то более удобный критерий отбора объектов..
  x.addParamRef = function( name, value, crit_fn, fn, desired_parent ) {
    desired_parent ||= x;
    //var values = gatherParams( crit_fn || default_crit_fn );
    var values = [];
    var rec = x.addGui( { type: "combovalue", name: name, value: value, values: values, crit_fn: crit_fn, fn: fn } );
    rec.getValues = function() {
      return gatherParams( crit_fn || default_crit_fn, desired_parent );
    }
    x.addCmd(`rescan-${name}`,() => {
      var vv = gatherParams( crit_fn || default_crit_fn, desired_parent );
      x.setParamOption( name, "values",vv);
    });
    /*
    rec.on("connect",() => {
      x.callCmd(`rescan-${name}`);
    })
    */

    x.setParamOption( name,"value-find-helper", rec.notFound );
    //x.trackParamOption
    //x.setParamOption( name, "values" );
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
    var acc = [];
    var r = x.findRoot(); // это получается в рамках текущего куста. а соседние кусты? (подсцены, вид, плеер)?
//    debugger;
    // var acc_full = []; // решено продублировать и полные пути - чтобы не ломать старые приложения...
    // ну либо надо научить combovalues принимать то что дают..
    // дублирование это шляпа - там много шлака оказывается
    // надо сделать чтобы на импорте это все произошло    
    

    traverse_if( r, function(obj) {
      var param_names = crit_fn( obj );
      if (!param_names) return ; // значит не надо в это поддерево
//      if (obj.getPathRelative(x) == "/xr-control") debugger;
      var priority = false;
      if (param_names.priority) {
        param_names = param_names.result;
        priority = true;
      }
      param_names.forEach( function(p) {
        //let objpath = relative_to_obj ? obj.getPathRelative( relative_to_obj ) : obj.getPath();
        let objpath = obj.getPathRelative( relative_to_obj );
        if (priority)
          acc.unshift( objpath + "->" + p );
        else
          acc.push( objpath + "->" + p );
        ///acc_full.push( obj.getPath() + "->" + p );
      });
      return true;
    });
    //return acc.concat( acc_full );

    acc.unshift( "" );
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


// поиск - обход всех детей с вызовом fn
function traverse_if( obj, fn ) {
  if (!fn( obj )) return;
  var cc = obj.ns.getChildren();
  for (var cobj of cc) {
    traverse_if( cobj,fn );
  }
}