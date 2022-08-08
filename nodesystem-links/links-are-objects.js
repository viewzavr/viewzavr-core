// вводим понятие "ссылка" в духе Дениса Перевалова

// idea: if object which some link references gets deleted, and then other object is created, try to reconnect to it.
// probably it is already the case, and then we have to write it as a requirement (fine feature).

// idea: move link resolution logic to addParamRef method
// idea: maybe - use some restriction mechanism for links -- e.g. it should choose source
//       only from some specifics. but may be no need because we may do it by default criteria

// R-RELATIVE-LINKS store: 
// ../../object-name->param-name
// ./this-object-name->param-name

// R-LINKS-FROM-OBJ: link objects should consider all links relative from their parents.

export default function setup( vz ) {

  // создание ссылки, большой, в целом такой глобальной из себя всей.
  vz.createLink = function( opts ) {
    opts.name ||= "link";
    var obj = vz.createObj( opts );
    obj.is_link = true;

    var currentRefFrom;
    var currentRefTo;

    var currentParamNameFrom;
    var currentParamNameTo;
    var tracode;

    var qqq_is_performing = 0;

    obj.currentRefFrom = () => currentRefFrom;
    obj.currentRefTo = () => currentRefTo;

    // tied_to_parent

/*
    obj.feature( "delayed" );
    let warn_undef = obj.delayed( () => {
       console.log("warning: link doesnt see source param", 
           currentRefFrom ? currentRefFrom.getPath() : "-", currentParamNameFrom, "linked to",
           currentRefTo ? currentRefTo.getPath() : "-", currentParamNameTo
           );
    }, 1000/10 )
*/    

    obj.feature("delayed");
    let warn_value_not_found = obj.delayed( () => {
        console.warn("Link: src object exist but no parameter of that name\n",
             currentRefFrom.getPath(),"->",currentParamNameFrom,
             "\n=====>\n",
             currentRefTo.getPath(),"->",currentParamNameTo,
             "\nlink object:",obj,"\nsrc object:",currentRefFrom
              );
       obj.vz.console_log_diag( obj );

    },20);
    
    // вызывается когда исходный параметр изменяется
    function qqq() {
      //console.log("qqq invoked", obj.getPath())
      if (!obj.getParam("enabled")) return;
      if (!currentRefTo) return;
      
      if (!currentRefFrom) return;

      // ссылки вида name->. это ссылка на сам объект
      if (currentParamNameFrom == "." || currentParamNameFrom == "~") {
        // в том числе и F-LINK-ACCESS-ENV-CONSTS

        if (currentRefFrom.is_cell)
           currentRefTo.setParam( currentParamNameTo,currentRefFrom.get(), obj.params.manual_mode );
        else    
           currentRefTo.setParam( currentParamNameTo,currentRefFrom, obj.params.manual_mode );
        return;
      }

      var val = null;
      var val_received = false;

      if (currentRefFrom) {

        if (currentRefFrom.is_cell)
        {
          if (currentParamNameFrom == "cell")
          {
            val = currentRefFrom;
            val_received = true;
          }
          else
          {
            console.error("only ->. and ->cell attr is available for cells");
          }  
        }
        else
        // доступ к полю F-OBJ-ACCESS-FROM-DECLARATIVE 
        if (currentParamNameFrom[0] == ".") {
          let field = currentParamNameFrom.slice( 1 );
          if (currentRefFrom) {
              val = currentRefFrom[field];
              val_received = true;
          }
        }
        // ссылка на команду - вернем функцию
        else if (currentRefFrom.hasCmd( currentParamNameFrom )) {
           val = (...args) => {
              return currentRefFrom.callCmd( currentParamNameFrom, ...args );
           }
           // т.е. тот кто читает параметр который cmd тот получает на выходе функцию вызова этой cmd
           // хм.. а чего не напрямую?
           val_received = true;
        }   
        // доступ к параметру   
        else {
          val = currentRefFrom.getParam( currentParamNameFrom  );
          val_received = currentRefFrom.hasParam( currentParamNameFrom);
        }
      }

      warn_value_not_found.stop();

      if (typeof(val) == "undefined" || val == null) {
        // теперь undefined скрываем только если ссылка добрая/мягкая/необязательная
        if (obj.params.soft_mode) {
            // обновление: скрываем только если и нет такого параметра. а если уж он там есть, а вернул ерунду - ну и ладно, передаем
            if (!val_received)
              return;
            // новое обновление - передаем всегда..
        }
        else
        {
          if (!val_received) {
            warn_value_not_found();
            // warn_undef();
            
               //console.warn("link: passing undefined value",obj.getPath() );
          }
        }
      }
      //else warn_undef.stop();
      
      /*
      if (tracode && obj.getParam("transform-enabled")) {
        try {
          val = tracode( val );
        } catch( ex ) {
          console.error("Link: transform-code error!",ex );
        }
      }
      */
      
      if (obj.params.log)
          console.log("link setting value",val,"\n",obj.params.from,"\n -------> \n",obj.params.to,obj);

      // obj.vz.history.add( ["link set value",obj.params.from,])
      obj.vz.history.add( 
        //["link setting value",val,"\n",obj.params.from,"\n -------> \n",obj.params.to, obj.getPath() ]
        { "info": "link",
            "value" : val,
            "from" : obj.params.from,
            "to" : obj.params.to,
            "link path": obj.getPath(),
            "source" : obj.$locinfo
         }
      );

      // feature: set only if val changes; in other case, we will lose manual effect..
      // обновление: чухня все это, надо хреначить. ну мануал эффект можно сохранить выставляя флаг

      if (qqq_is_performing > 2) {
        console.error("links: already processing, possible link loop");
        obj.vz.console_log_diag( obj );
        debugger;
        return;
      };

      qqq_is_performing++;

      try {
      currentRefTo.setParam( currentParamNameTo,val, 
        obj.params.manual_mode || currentRefTo.getParamManualFlag(currentParamNameTo) ); // F-LINKS-MANUAL
      } finally {
        qqq_is_performing--;
      }

      //currentRefTo.setParamWithoutEvents( currentParamNameTo,val, 
      //  obj.params.manual_mode || currentRefTo.getParamManualFlag(currentParamNameTo) ); // F-LINKS-MANUAL
      //currentRefTo.signalParam( currentParamNameTo );

      /*
      var curpv = currentRefTo.getParam( currentParamNameTo );
      // вторая проверка проверяет ситуацию такую в js: '' == 0 оказывается 
      if (curpv != val || typeof(curpv) != typeof(val)) {
        // feature: if setting param value by link, mark it as internal
        // so this value will not go to dump
        // + F-LINKS-MANUAL
        // IMPORTANT: need call this before setting param value (currently this is a bug)
        // update: no need to mark it internal! because of manual_mode, see below
        // currentRefTo.setParamOption( currentParamNameTo,"internal",obj.params.manual_mode ? false : true );

        // obj.getPath()
        //console.log("LINK PASS VALUE TO\n",currentRefTo.getPath() + "->" + currentParamNameTo,
        //  "from\n",currentRefFrom.getPath() + "->" + currentParamNameFrom,"\nvalue=",val)
        
        currentRefTo.setParam( currentParamNameTo,val, obj.params.manual_mode ); // F-LINKS-MANUAL
        // bug: if one invokes signal on source param, without changing param value (say by ref to array)
        // here we hide that propagation. we have to somehow understand that event will not propagate
        // and maybe send it manually

        //obj.emit("passed_value");
        // todo я до сих пор не умею красиво добавлять добавки..
        //obj.passed_value_timestamp = performance.now();

        obj.setParam("last_passed_value",val);
       }
       else
       {
         //console.log("link: value doesnt change, skipping pass", obj.getPath())
       }
       */

       // ну и что что не передала - сработала же..
       obj.passed_value_timestamp = performance.now();
       // @todo move out

//       else
//        console.log("LINK is not passed, vals and types same",currentRefTo.getPath(),currentParamNameTo,val)
      

    }
    
    obj.addCheckbox( "enabled", true );
    
    // enable_qqq = выполнить разовый вызов qqq в ходе настройки (работы алгоритма setupFromLink)
    let unsubFromParamTracking = () => {};
    obj.on("remove",() => unsubFromParamTracking());

    function setupFromLink(enable_qqq,enable_retry=true,enable_signal=true) {

      if (obj.params.debug)
        debugger;
              
      unsubFromParamTracking(); 

      //console.error("Link: setupFromLink called",obj);
      var v = obj.getParam("from");

      
      if (currentRefFrom) {
        currentRefFrom.untrackParam( currentParamNameFrom,qqq )
        forgetLinkTracking( currentRefFrom );
        currentRefFrom = undefined;
        currentParamNameFrom = undefined;
      }
      
      if (!v || v.length == 0) return;

      if (!obj.ns.parent && !obj.hosted) return; // seems this link is abandoned

      if (!v.split) {
        console.error("Link: invalid 'from' path value. v=",v,"link path=",obj.getPath());
        return;
      }
      
      var arr = v.split("->");

      // оказалось полезно уметь давать ссылку типа from не с параметра
      // а с объекта. в том смысле что если мы хотим объект по ссылке передать...
      // (конкретно это понадобилось для объекта рендеринга параметров)
      if (arr.length == 1)
          arr.push("~"); // ссылка просто на объект, обозначаем внутри как .

      if (arr.length != 2) {
        console.error("Link: source arr length not 2!",arr );
        return;
      }
      var objname = arr[0];
      var paramname = arr[1];
      
      // R-LINKS-FROM-OBJ
      // var sobj = obj.ns.parent.findByPath( objname );
      // R-LINKS-FROM-OBJ + R-LINKS-DIFFER
      // var sobj = (obj.getParam("tied_to_parent") ? obj.ns.parent : obj).findByPath( objname );
      var start_from_obj = (obj.getParam("tied_to_parent") ? obj.ns.parent : obj);

      // новая альтернативная история
      if (obj.hosted) start_from_obj = obj.host;

      var sobj = start_from_obj.findByPath( objname, obj );
      
      if (!sobj) {
        if (enable_retry) {
          // console.warn("Link: source obj not found! Will retry!",arr,'me=',obj.getPath() );
          if (obj.removed)
            debugger;
          //console.warn("my parent id is",obj.ns.parent.$vz_unique_id)
          sobj = start_from_obj.findByPath( objname, obj );
          linkScannerAdd( obj, "obj 'from' not found",() => {
            debugger;
            sobj = start_from_obj.findByPath( objname, obj );
          } );
        }
        return;
      }
      if (!paramname) {
        console.warn("Link: source param is blank",arr );
        return;
      }

      let is_object = sobj.trackParam ? true : false;
      let is_cell = sobj.is_cell ? true : false;

      // F-LINK-ACCESS-ENV-CONSTS
      if (!is_object)
      {
         // нихрена это не объект а вещь из окружения..
         // но вопрос а зачем присваивать такое paramname если оно по умолчанию вроде как и так такое
         // paramname = ".";
      }

      // F-POSITIONAL-ENVS и F-POSITIONAL-ENVS-OUTPUT
      // F-LINK-ACCESS-ENV-CONSTS
      if (is_object && (paramname == "~" || paramname == ".")) { // типа мы ссылки сделали || paramname == "output") {
        if (sobj.is_feature_applied("is_positional_env")) 
          paramname = 0;
        /* пока ладно
        else (sobj.is_feature_applied("data"))
          paramname = 0; 
        */
      }
      
      // F-LINK-ACCESS-ENV-CONSTS
      if (sobj && is_object) {
          unsubFromParamTracking = sobj.trackParam( paramname, qqq );
      }

      if (sobj && is_cell) {
         unsubFromParamTracking = sobj.on( "changed", qqq );
      }
  
      currentRefFrom = sobj;
      currentParamNameFrom = paramname;

      if (is_object)
          addLinkTracking( currentRefFrom,obj, true );
      
      if (enable_qqq) qqq();
      
      if (enable_signal) obj.signal("linksChanged");
      currentRefFrom.signal( paramname + "Linked" );

      return true;
    }
    
    function setupToLink(enable_qqq,enable_retry=true,enable_signal=true) {

      if (obj.params.debug)
        debugger;

      var v = obj.getParam("to");      
      
      if (currentRefTo) forgetLinkTracking( currentRefTo );
      currentRefTo = undefined;
      currentParamNameTo = undefined;
    
      if (!v || v.length == 0) return;

      if (!obj.ns.parent && !obj.hosted) return; // seems abandoned

      if (!v.split) {
        console.error("Link: invalid 'to' value. v=",v);
        return;
      }
    
      var arr = v.split("->");
      
      if (arr.length != 2) {
        console.error("Link: target arr length not 2!",arr );
        return;
      }
      
      var objname = arr[0];
      var paramname = arr[1];
      //var sobj = obj.findByPath( objname );
      // R-LINKS-FROM-OBJ
      //var sobj = obj.ns.parent.findByPath( objname );
      // R-LINKS-FROM-OBJ + R-LINKS-DIFFER
      var start_from_obj = (obj.getParam("tied_to_parent") ? obj.ns.parent : obj);

      // новая альтернативная история
      if (obj.hosted) start_from_obj = obj.host;

      var sobj = start_from_obj.findByPath( objname, obj );
      
      if (!sobj) {
        if (enable_retry) {
          //console.log("Link: target obj not found! Will retry!",arr, obj.getPath(),obj );
          var sobj2 = start_from_obj.findByPath( objname, obj );
          linkScannerAdd( obj, "obj 'to' not found" );
        }
        return;
      }
      
      currentRefTo = sobj;
      currentParamNameTo = paramname;
      
      addLinkTracking( currentRefTo, obj, false );

      if (enable_qqq) qqq();
      
      // это бы надо вытащить на общий уровень
      if (enable_signal) obj.signal("linksChanged");

      currentRefTo.signal( paramname + "Linked" );

      return true;
    }

    obj.feature("delayed");
    
    obj.setupLinks = function( may_retry_from = true, may_retry_to = true ) {
      if (obj.removed) return; // ничего такого не надо делать если эту ссылку уже удалили
      //console.error("Link: setupLinks called");
      if (setupFromLink(false, may_retry_from, false)) // 1st false => do not set param value, 3rd true => do not signal
          setupToLink(true, may_retry_to, true);       // 1st true => set param value if all ok, 3rd true => signal if ok
    }
    obj.setupLinksDelayed = obj.delayed( obj.setupLinks, 3 );

    //var references_obj = obj.getParam("tied_to_parent") ? obj.ns.parent : obj;
    var references_obj = obj.ns.parent;

    
    var setupFromLink_DELAYED = obj.delayed( () => setupFromLink(true) );
    var setupToLink_DELAYED = obj.delayed( () => setupToLink(true) );

    obj.addParamRef("from","",filter_from,setupFromLink_DELAYED, references_obj ); // R-LINKS-FROM-OBJ
    obj.addParamRef("to","",filter_to,setupToLink_DELAYED, references_obj ); // R-LINKS-FROM-OBJ
    obj.setParamOption( "to","is_outgoing",true);
    // note: we set here obj.ns.parent as desired parent for params pathes. probably it is only the case for tied_to_parent version

    obj.addCheckbox( "tied_to_parent", obj.params.tied_to_parent );

    obj.onvalue( "tied_to_parent",(v) => {
      if (v) { // это нам надо поскорее обозначить потому-что F-LINKS-OVERWRITE
        let tobj = obj.ns.parent;
        // тонкий момент. даже если мы tied-to-parent то может оказаться что ссылка на самом деле
        // действует на хост а не на парента..
        if (obj.hosted) 
          tobj = obj.host;
        else
        if ((obj.params.to || "")[0] == "." && obj.ns.parent.hosted)
            tobj = tobj.host;
        
        
        addLinkTracking( tobj, obj, false );
      }  
    } );

    obj.trackParam("manual_mode",qqq); // F-LINKS-MANUAL
    obj.feature("param_alias");
    obj.addParamAlias("manual_mode","manual");

    // обнуление таймера повторного поиска ссылок
    obj.onvalues_any(["from","to"],() => linkScannerReset( obj ));

    // todo speedup by func ptr
    function filter_to(o) {
      if (obj.getParam("tied_to_parent")) { // if our link is tied to parent... todo: move this if out of func def (define 2 functions)
        if (o === obj.ns.parent) {
          // implementing R-LINKS-NO-DEFAULT-VALUE
          //return [""].concat( Object.keys( o.params ) );
          // вроде как не обязательно "" добавлять т.к. там и так есть пустое значение
          return Object.keys( o.params );
          // return Object.keys( o.params );
        }
        return [];
      }
      else
      {
        return Object.keys( o.params );
      }
    }

    // F-RESTRICT-PARAM-REF-OPTION
    function filter_from(o) {
      // вход - объект o
      // выход - список имен параметров которые мы у него берем

      if (obj.getParam("tied_to_parent") && o == obj) return [];

      // если не выбрали куда - то ограничимся
      if (!(currentRefTo && currentParamNameTo)) return o.getParamsNames();

      var acc = [];

      var checker = currentRefTo.getParamOption( currentParamNameTo,"maylink" );
      if (!checker) 
      {
        return o.getParamsNames()
        /*
        checker = function( otherobj, otherparam ) {
        // ну не знаю что тут сделать.. гуи сравнить //
        return true;
        }
        */
      }
      var onames = o.getParamsNames();
      // вообще тупняк тут алгоритмы разводить. должна быть четкая функция
      // "можно ли к этому параметру прилинковать тот?"
      for (var pn of onames) {
        if (checker( o, pn )) // а почему такой интерфейс? удобно?
            acc.push( pn );
      }
      return acc;
    }

    return obj;
  }

vz.chain("create_obj",function( obj, opts ) {

  // createLinkTo( { param: "someparam", from: sourcestring})

  // создание ссылки локальной для объекта
  obj.createLinkTo = function( opts ) {
    //console.log("CLT called,.opts=",opts);
    var paramname = opts.param;
    var sourcestring = opts.from;
    opts.parent = obj;
    opts.type = "link";
    //var q = vz.createLink( opts );

    var q;
    // используем существующие, заодно удалим дубликаты
    // todo здесь уже конфликт появился - если мы ставим target_host_env
    // то и там надо вычищать, у мастера

    // оч важно тут различать цель и искать existing в правильном месте - у себя или у хоста
    var existing = (opts.target_host_env ? obj.host : obj).linksToParam( paramname );

    // но вообще конечно.. с дубликами.. может они и не дубликаты вовсе?...
    if (existing[0]) {
      var toremove = existing;
      // обработаем такой случай, что не будем пересоздавать встроенную ссылку.. зачем-то
      // а заюзаем существующий экземпляр

      // как выясняется это плохой случай. потому что та уже существующая ссылка это может быть
      // совершенно посторонняя ссылка.. у которой может быть еще и управляемый параметр по другой ссылке
      // и получится так что та другая управляющая ссылка начнет тут вдруг нами рулить
      // лучше уж все стереть. или хотя бы подавить, enabled false выставить
      /*
      if (existing[0].params.tied_to_parent && existing[0].ns.parent == obj) {
        q = existing[0];
        toremove = existing.slice(1);
      }
      */
      

      toremove.map( (e) => {
        //console.log("removing existing link", e.getPath(), "for param",paramname)
         e.remove()
      } )
    }
    
    if (!q) q = vz.createObjByType( {...opts} );

    if (paramname && paramname.length > 0) {
        let prefix = opts.target_host_env ? ".->" : "~->";
        q.setParam( "to", prefix + paramname, opts.manual );
      }
        //q.setParam( "to", obj.getPath() + "->" + paramname, opts.manual );
        //q.setParamWithoutEvents( "to", obj.getPath() + "->" + paramname, opts.manual ); // will emit events on 'from'?
    q.setParam( "from", sourcestring );
    q.setParam( "tied_to_parent",true, opts.manual );
    q.setParam( "soft_mode", opts.soft_mode || opts.soft , opts.manual );
    return q;
  }
  obj.linkParam = function( paramname, link_source,soft_mode ) {
     return obj.createLinkTo( { param: paramname, from: link_source, soft_mode:soft_mode })
  }
  
  obj.hasLinks = function() {
    return (howManyLinksTo( obj ) > 0);
  }
  obj.hasLinksToParam = function(pname) {
    return (howManyLinksOfParam( obj,pname,false,true ) > 0);
  }
  obj.hasLinksFromParam = function(pname) {
    return (howManyLinksOfParam( obj,pname,true,false ) > 0);
  }
  obj.linksToParam = function(name) {
    return linksOfParam(obj,name,false,true);
  }
  obj.linksFromParam = function(name) {
    return linksOfParam(obj,name,true,false);
  }

  this.orig( obj, opts );

  return obj;
} ); // create_obj

vz.addItemType("link","Link between params",vz.createLink, {hidegui: true} );

}

// это для отслеживания если объект удалился
function addLinkTracking( obj, link, isFrom ) {
  var firstTime = (!obj.links_to_me);
  obj.links_to_me ||= [];
  obj.links_to_me_direction ||= [];
  
  if (obj.links_to_me.indexOf( link ) >= 0) return;
  obj.links_to_me.push( link );
  obj.links_to_me_direction.push( isFrom );

  if (firstTime)
  {
    obj.on("remove",() => {
      (obj.links_to_me || []).forEach( function(l) {
        l.setupLinksDelayed( true, l.ns.parent && !l.ns.parent.removed ? true : false ); // forget this object
        // we achieved that if object if deleted and 
        // if some link has arrow from this object
        //   then link will retry to find object with same name (which may appear soon, as in js-code object)
        // if some link has arrow to this object
        //   then link will retry only in case the link has parent (which means link is not child of current, deleted object).
      });
    });
  }

/*
  obj.chain("remove",function() {
    this.orig();
    // @optimized - выяснилось что мы удаляем выражения, и вот часть удалили, а другие ссылки еще ссылаются на эту часть
    // и мы начинаем их ресканить.. зачем? когда можно чутка подождать и вообще будет не надо уже

    setTimeout( () => {

      (obj.links_to_me || []).forEach( function(l) {
        l.setupLinks( true, l.parent ? true : false ); // forget this object
        // we achieved that if object if deleted and 
        // if some link has arrow from this object
        //   then link will retry to find object with same name (which may appear soon, as in js-code object)
        // if some link has arrow to this object
        //   then link will retry only in case the link has parent (which means link is not child of current, deleted object).
      });

    }, 0);

  });
*/  
  
}

function forgetLinkTracking( obj, link ) {
  if (!obj.links_to_me) return;
  var i = obj.links_to_me.indexOf( link );
  if (i >= 0) {
    obj.links_to_me = obj.links_to_me.splice( i,1 );
    obj.links_to_me_direction = obj.links_to_me_direction.splice( i,1 );
  }
}

function howManyLinksTo( obj ) {
  return (obj.links_to_me || []).length;
}

function howManyLinksOfParam( obj,name, needfrom=true, needto=true ) {
  return (obj.links_to_me || []).filter( function(link) {
    var i = obj.links_to_me.indexOf( link );
    var isFrom = obj.links_to_me_direction[i];

    if (isFrom && !needfrom) return;
    if (!isFrom && !needto) return;

    var nama = isFrom ? "from" : "to";
    var arr = (link.getParam(nama) || "").split("->");
    var paramname = arr[1];
    return (paramname == name);
  } ).length;
}

function linksOfParam( obj,name, needfrom=true, needto=true ) {
  return (obj.links_to_me || []).filter( function(link) {
    var i = obj.links_to_me.indexOf( link );
    var isFrom = obj.links_to_me_direction[i];

    if (isFrom && !needfrom) return;
    if (!isFrom && !needto) return;

    var nama = isFrom ? "from" : "to";
    var arr = (link.getParam(nama) || "").split("->");
    var paramname = arr[1];
    return (paramname == name);
  } );
}


/////////////////////////////////////////////
// восстановление ненайденных ссылок

var linkScannerReset = function(link) {
  link.linkScannerCounter = 0;
}

var linkScannerAdd = function ( link, reason,cb_on_error=()=>{} ) {

  if (!link.rescan_it_delayed)
    link.rescan_it_delayed = link.delayed( () => link.setupLinks(),3 );
    // идея добавить так чтобы был сдвиг по времени при повторном вызове
    // с текущей реализацией delayed это сделать реально

  link.linkScannerCounter = (link.linkScannerCounter || 0) + 1;
  if (link.linkScannerCounter < 100) {
    
    link.rescan_it_delayed.stop();
    link.rescan_it_delayed();
  }
  else {
    console.error("links: failed to setup link, reason:",reason,"from:",link.params.from,"======> to:",link.params.to,link)
    if (link.$locinfo)
       console.log( link.$locinfo );
    cb_on_error(); 
  }
  
}


/*

var scannerLinks = [];
// заоверрайдено фичей ниже.. почему в js нельзя переопределять функцию?
// но быть может потому что это надо делать через точку передачи управления
// сделал через перехват точки управления (было function linkScannerAdd)

var linkScannerAdd1 = function ( link ) {
  if (scannerLinks.indexOf( link ) < 0) 
      scannerLinks.push( link );
}


setInterval( function() {
  var x = scannerLinks;
  scannerLinks = [];
  //console.error("Link: retrying to connect links",x);
  //if (x.length > 0) debugger;
  x.forEach( link => link.setupLinks() ); // она там себя добавит если облом
}, 10 );

///////////////////////////////////////////
/// фича - несколько попыток и идите в лес
/// перехватываем вот то управление.. можно было бы там метод какой-то типа doAddToArr?
linkScannerAdd2 = function ( link ) {
  if (scannerLinks.indexOf( link ) < 0) {
      link.linkScannerCounter = (link.linkScannerCounter || 0) + 1;
      if (link.linkScannerCounter < 100)
          scannerLinks.push( link );
      else
          console.error("Link: retry counter finished, will not retry anymore.",link)
  }
}
*/

