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

  vz.createLink = function( opts ) {
    opts.name ||= "link";
    var obj = vz.createObj( opts );
    obj.is_link = true;

    var currentRefFrom;
    var currentRefTo;

    var currentParamNameFrom;
    var currentParamNameTo;
    var tracode;

    obj.currentRefFrom = () => currentRefFrom;
    obj.currentRefTo = () => currentRefTo;

    // tied_to_parent
    
    // вызывается когда исходный параметр изменяется
    function qqq() {
      if (!obj.getParam("enabled")) return;
      if (!currentRefTo) return;
      
      if (!currentRefFrom) return;

      if (currentParamNameFrom == "." || currentParamNameFrom == "~") {
        currentRefTo.setParam( currentParamNameTo,currentRefFrom, obj.params.manual_mode );
        return;
      }
      
      var val = currentRefFrom ? currentRefFrom.getParam( currentParamNameFrom  ) : null;

      if (typeof(val) == "undefined" || val == null) {
//        console.warn("Links: incoming value undefined, skipping assign");
        //console.warn('me=',obj.getPath(),'currentRefFrom=',currentRefFrom ? currentRefFrom.getPath() : null,"currentParamNameFrom=",currentParamNameFrom );
//        console.warn("from=",obj.getParam("from"),"to=",obj.getParam("to"));

        // доп хак чтобы можно было ссылаться на команды
        if (currentRefFrom && currentRefFrom.hasCmd( currentParamNameFrom )) {
           val = (...args) => {
              currentRefFrom.callCmd( currentParamNameFrom, ...args );
           }
           currentRefTo.setParam( currentParamNameTo,val, obj.params.manual_mode );
        }

        return;
      }
      
      /*
      if (tracode && obj.getParam("transform-enabled")) {
        try {
          val = tracode( val );
        } catch( ex ) {
          console.error("Link: transform-code error!",ex );
        }
      }
      */
      /*
      console.log("link setting value from",obj.params.from,"to",obj.params.to);
      if (obj.params.to === "/view-cmp-Lidar_crop_p3_4->origin")
        debugger;
      */  

      // feature: set only if val changes; in other case, we will lose manual effect..
      var curpv = currentRefTo.getParam( currentParamNameTo );
      // вторая проверка проверяет ситуацию такую в js: '' == 0 оказывается 
      if (curpv != val || typeof(curpv) != typeof(val)) {
        // feature: if setting param value by link, mark it as internal
        // so this value will not go to dump
        // + F-LINKS-MANUAL
        // IMPORTANT: need call this before setting param value (currently this is a bug)
        // update: no need to mark it internal! because of manual_mode, see below
        // currentRefTo.setParamOption( currentParamNameTo,"internal",obj.params.manual_mode ? false : true );
        //console.log("LINK ",obj.getPath(),"PASS VALUE TO ",currentRefTo.getPath() + "->" + currentParamNameTo,"from",currentRefFrom.getPath() + "->" + currentParamNameFrom,"value=",val)
        
        currentRefTo.setParam( currentParamNameTo,val, obj.params.manual_mode ); // F-LINKS-MANUAL
        // bug: if one invokes signal on source param, without changing param value (say by ref to array)
        // here we hide that propagation. we have to somehow understand that event will not propagate
        // and maybe send it manually
       }
//       else
//        console.log("LINK is not passed, vals and types same",currentRefTo.getPath(),currentParamNameTo,val)
      

    }
    
    obj.addCheckbox( "enabled", true );
    
    // enable_qqq = выполнить разовый вызов qqq в ходе настройки (работы алгоритма setupFromLink)
    function setupFromLink(enable_qqq,enable_retry=true,enable_signal=true) {
      //console.error("Link: setupFromLink called",obj);
      var v = obj.getParam("from");
      
      if (currentRefFrom) {
        currentRefFrom.untrackParam( currentParamNameFrom,qqq )
        forgetLinkTracking( currentRefFrom );
        currentRefFrom = undefined;
        currentParamNameFrom = undefined;
      }
      
      if (!v || v.length == 0) return;

      if (!obj.ns.parent) return; // seems this link is abandoned

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
      var sobj = start_from_obj.findByPath( objname );
      
      if (!sobj) {
        if (enable_retry) {
          console.warn("Link: source obj not found! Will retry!",arr,'me=',obj.getPath() );
          //sobj = obj.ns.parent.findByPath( objname );
          linkScannerAdd( obj );
        }
        return;
      }
      if (!paramname) {
        console.warn("Link: source param is blank",arr );
        return;
      }

      if (paramname == "~") {
      }
      
      if (sobj)
          sobj.trackParam( paramname, qqq );
  
      currentRefFrom = sobj;
      currentParamNameFrom = paramname;      
      addLinkTracking( currentRefFrom,obj, true );
      
      if (enable_qqq) qqq();
      
      if (enable_signal) obj.signal("linksChanged");
      currentRefFrom.signal( paramname + "Linked" );

      return true;
    }
    
    function setupToLink(enable_qqq,enable_retry=true,enable_signal=true) {
      var v = obj.getParam("to");
      
      if (currentRefTo) forgetLinkTracking( currentRefTo );
      currentRefTo = undefined;
      currentParamNameTo = undefined;
    
      if (!v || v.length == 0) return;

      if (!obj.ns.parent) return; // seems abandoned

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
      var sobj = start_from_obj.findByPath( objname );
      
      if (!sobj) {
        if (enable_retry) {
          // console.log("Link: target obj not found! Will retry!",arr );
          linkScannerAdd( obj );
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
    
    obj.setupLinks = function( may_retry_from = true, may_retry_to = true ) {
      if (obj.removed) return; // ничего такого не надо делать если эту ссылку уже удалили
      //console.error("Link: setupLinks called");
      if (setupFromLink(false, may_retry_from, false)) // 1st false => do not set param value, 3rd true => do not signal
          setupToLink(true, may_retry_to, true);       // 1st true => set param value if all ok, 3rd true => signal if ok
    }

    //var references_obj = obj.getParam("tied_to_parent") ? obj.ns.parent : obj;
    var references_obj = obj.ns.parent;

    obj.feature("delayed");
    var setupFromLink_DELAYED = obj.delayed( () => setupFromLink(true) );
    var setupToLink_DELAYED = obj.delayed( () => setupToLink(true) );

    obj.addParamRef("from","",filter_from,setupFromLink_DELAYED, references_obj ); // R-LINKS-FROM-OBJ
    obj.addParamRef("to","",filter_to,setupToLink_DELAYED, references_obj ); // R-LINKS-FROM-OBJ
    obj.setParamOption( "to","is_outgoing",true);
    // note: we set here obj.ns.parent as desired parent for params pathes. probably it is only the case for tied_to_parent version

    obj.addCheckbox( "tied_to_parent", obj.params.tied_to_parent );

    obj.onvalue( "tied_to_parent",(v) => {
      if (v) // это нам надо поскорее обозначить потому-что F-LINKS-OVERWRITE
        addLinkTracking( obj.ns.parent, obj, false );
    } );

    obj.trackParam("manual_mode",qqq); // F-LINKS-MANUAL

    

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

/*
    function filter_from(o) {
      // вход - объект o
      // выход - список имен параметров которые мы у него берем

      // если не выбрали куда - то ограничимся
      if (!(currentRefTo && currentParamNameTo)) return o.getParamsNames();

      var acc = []  
      // а теперь введем ограничения хотя бы даже по гуи
      var myguitype = currentRefTo.getGui( currentParamNameTo )?.getType();
      var myparamtype = currentRefTo.getParamOption("type");
      var onames = o.getParamsNames();
      
      // вообще тупняк тут алгоритмы разводить. должна быть четкая функция
      // "можно ли к этому параметру прилинковать тот?"
      for (var pn of onames) {
        var oguitype = o.getGui( pn )?.getType();
        var oparamtype = o.getParamOption("type");
        if (myparamtype) 
          { // если у исходного параметра указан тип то ориентируемся на него

          }
          else
          {
            if (oguitype == myguitype) acc.push(pn);
          }
      }

      return acc;

    }
    */

/*
    obj.addCheckbox( "transform-enabled",false,qqq );
    obj.addText("transform-code","// enter transform code here. arg: v - input value\nreturn v",function(cod) {
       if (!cod || cod.length == 0) {
          tracode = undefined; // new Function("v","return v");
          qqq();
          return;
       }
       tracode = new Function("v",cod);
       qqq();
    } );
*/
    // todo: if link object is removed - forget all back-references (e.g. forgetLinkTracking)

    return obj;
  }

vz.chain("create_obj",function( obj, opts ) {

  // createLinkTo( { param: "someparam", from: sourcestring})
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
    var existing = obj.linksToParam( paramname );
    if (existing[0]) {
      var toremove = existing;
      if (existing[0].params.tied_to_parent && existing[0].ns.parent == obj) {
        q = existing[0];
        toremove = existing.slice(1);
      }
      toremove.map( (e) => e.remove() )
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
    return q;
  }
  obj.linkParam = function( paramname, link_source ) {
     return obj.createLinkTo( { param: paramname, from: link_source })
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

var scannerLinks = [];
/* заоверрайдено фичей ниже.. почему в js нельзя переопределять функцию? */
/* но быть может потому что это надо делать через точку передачи управления */
/* сделал через перехват точки управления (было function linkScannerAdd) */

var linkScannerAdd = function ( link ) {
  if (scannerLinks.indexOf( link ) < 0) 
      scannerLinks.push( link );
}


setInterval( function() {
  var x = scannerLinks;
  scannerLinks = [];
  //console.error("Link: retrying to connect links",x);
  //if (x.length > 0) debugger;
  x.forEach( link => link.setupLinks() ); // она там себя добавит если облом
}, 1000 );

///////////////////////////////////////////
/// фича - несколько попыток и идите в лес
/// перехватываем вот то управление.. можно было бы там метод какой-то типа doAddToArr?
linkScannerAdd = function ( link ) {
  if (scannerLinks.indexOf( link ) < 0) {
      link.linkScannerCounter = (link.linkScannerCounter || 0) + 1;
      if (link.linkScannerCounter < 10)
          scannerLinks.push( link );
      else
          console.error("Link: retry counter finished, will not retry anymore.")
  }
}