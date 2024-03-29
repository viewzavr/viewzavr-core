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

  x.getParamRefs = () => Object.keys( x.references_to_params || {} );
  x.getParamRefsRecords = () => Object.values( x.references_to_params || {} );

  // name - имя параметра который является ссылкой
  // value - значение, строка в форме ПУТЬОБЪЕКТА->ИМЯПАРАМЕТРА
  // crit_fn - критерий отбора параметров, f(obj)->names
  // fn - вызывается при измененении; строка вида путь->имяпараметра
  // desired_parent - относительно кого отсчитывать пути

  // todo - нужен какой-то более удобный критерий отбора объектов..

/* todo - может быть на будущее. хотя лучше конечно парам-ref держать мб как пару (ссылка-на-объект, имя)
  x.getParamRefObj = (name) => {
    if (!x.references_to_params) return;
    let rec = x.references_to_params[name];
    if (!rec) return;
    return rec.target_obj;
  }
  x.getParamRefName = (name) => {
    if (!x.references_to_params) return;
    let rec = x.references_to_params[name];
    if (!rec) return;
    return rec.target_param;    
  }
  x.updateParamRef = (name) => {
    if (!x.references_to_params) return;
    let rec = x.references_to_params[name];
    if (!rec) return;

    let target = x.params[name];
    if (!target) {
      x.closeParamRef(name);
      return;
    }

    rec.unsub();

    var arr = target.split("->");
    var tobj = env.findByPath( arr[0] );
    x.references_to_params[name].target_obj = tobj;
    x.references_to_params[name].target_param = arr[1];

    if (tobj) {
      let u1 = tobj.on("remove", () => x.updateParamRef(name));
      let u1 = tobj.on("parent_change", () => x.updateParamRef(name));
      // todo: name change..
      rec.unsub = () => { u1(); u2(); };
    }
    else
      rec.unsub = () => {};
  }

  x.closeParamRef = (name) => {
    if (!x.references_to_params) return;
    let rec = x.references_to_params[name];
    if (!rec) return;    
    rec.unsub();
    rec.unsub = () => {};
    rec.target_obj = undefined;
    rec.target_param = undefined;    
  }

  x.on("remove",() => {
    for (let n of x.getParamRefs())
      x.closeParamRef(n);
  });
*/  

  // было бы гораздо удобнее, если бы obj.addParamRef создавал бы какое-то свое
  // окружение с которым можно было бы поговорить через доп-методы
  // а не только через непойми что

  // и плюс - выбор параметра из красивого диалога с русскими надписями и графикой idea
  // https://www.w3schools.com/howto/howto_js_popup.asp
  x.addParamRef = function( name, value, crit_fn, fn, desired_parent0 ) {
    let desired_parent = desired_parent0 || x;
    
    //desired_parent ||= x;
    //var values = gatherParams( crit_fn || default_crit_fn );
    var values = [];
    var rec;
    setrec();

    // фича - сохранить чтобы можно было потом сообщить
    //x.closeParamRef( name );
    x.references_to_params ||= {};
    
    let refrec  ={ desired_parent: desired_parent, 
        name: name,
        obj_param_name: name+"_object",
        unsub: ()=>{} 
    };
    x.references_to_params[ name ] = refrec;

    /* в общем можно как бы заюзать и затем всегда уметь искать
    let objrec = x.addObjRef( obj_param_name );
    objrec.setVisible(false);
    x.onvalue(name,(n) => {
       let arr = n.split("->");
       x.setParam(obj_param_name,arr[0]);
       refrec.obj_path = arr[0];
       refrec.param_path = arr[1];
    };
    */

    //let unsub1 = x.on(`param_${name}_changed`,() => x.updateParamRef(name));
    //x.references_to_params[ name ].unsub1 = unsub1;

    x.addCmd(`rescan-${name}`,() => {
      //var vv = gatherParams( crit_fn || default_crit_fn, desired_parent );
      //x.setParamOption( name, "values",vv);
      setrec();
      update_status();
    });
    x.addLabel(`status-${name}`);

    x.trackParamOption(name,"crit_fn",setrec);
    x.trackParamOption(name,"search_root",setrec);

    function setrec() {
      // ну так то это неправильно - фиксировать через какое гуи мы тут пойдем
      //rec = x.addGui( { type: "editablecombo", name: name, value: value, values: values, crit_fn: crit_fn, fn: fn } );
      rec = x.addGui( { type: "combovalue", name: name, value: value, values: getvalues, crit_fn: crit_fn, fn: fn } );
      rec.getValues = getvalues;
      function getvalues() {
        let crit_fn1 = x.getParamOption( name, "crit_fn") || crit_fn || default_crit_fn;
        let search_root = x.getParamOption( name, "search_root") || x.findRoot();
        //console.log("using root",search_root)
        return gatherParams( crit_fn1, desired_parent, search_root );
      }
      x.setParamOption( name,"values",getvalues );

      rec.notFound = function( param_path, values ) { 
        // в параметре значение, которого нет в комбо-бокс значениях
        // это случай вероятно, когда param_path абсолютный
          if (param_path && param_path[0] == '/') {
             let [objpath,paramname] = param_path.split("->");
             let obj = desired_parent.findByPath( objpath );
             if (obj) {
               let newpath = obj.getPathRelative( desired_parent ) + "->" + paramname;
               return values.indexOf( newpath );
             } else 
               return 0;
           }
       } // not found
    }

    // вот эта штука вообще ток для гуи актуальна... пока эта гуи работает.... странно все это...
    // x.trackParam(name,update_status)
    // @byrequest @optimize тут я вижу это часто вызывается (ибо линки) - надо по запросу..

    function update_status() {
       var v = x.getParam(name);
       if (v?.split) {
        var [obj,param] = v.split("->");
        var status = "ok";
        obj = desired_parent.findByPath( obj );
        if (!obj) status = "obj no found";
        x.setParam(`status-${name}`,"status: "+status);
      }
        else x.setParam(`status-${name}`,"status: invalid value");
       //console.log("checked param ",name,"v=",v,"result=",obj)
    }

    return rec;
  }
  // здесь crit_fn по объекту должна выдать перечень имен его допустимых параметров
  
  function gatherParams( crit_fn, relative_to_obj, search_root ) {
    var acc = [];
    var r = search_root || x.findRoot(); // это получается в рамках текущего куста. а соседние кусты? (подсцены, вид, плеер)?
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

}


// поиск - обход всех детей с вызовом fn
function traverse_if( obj, fn ) {
  if (!fn( obj )) return;
  var cc = obj.ns.getChildren();
  for (var cobj of cc) {
    traverse_if( cobj,fn );
  }
}