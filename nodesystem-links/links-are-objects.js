// вводим понятие "ссылка" в духе Дениса Перевалова

// idea: if object which some link references gets deleted, and then other object is created, try to reconnect to it.
// probably it is already the case, and then we have to write it as a requirement (fine feature).

export default function setup( vz ) {

  vz.createLink = function( opts ) {
    opts.name ||= "link";
    var obj = vz.createObj( opts );
    
    var currentRefFrom;
    var currentRefTo;

    var currentParamNameFrom;
    var currentParamNameTo;
    var tracode;
    
    // вызывается когда исходный параметр изменяется
    function qqq() {
      if (!obj.getParam("enabled")) return;
      if (!currentRefTo) return;
      
      //if (!currentRefFrom) return;
      
      var val = currentRefFrom ? currentRefFrom.getParam( currentParamNameFrom  ) : null;
      
      if (typeof(val) == "undefined") {
        console.log("Links: incoming value undefined, skipping assign");
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
      
      currentRefTo.setParam( currentParamNameTo,val );
      // feature: if setting param value by link, mark it as internal
      // so this value will not go to dump
      currentRefTo.setParamOption( currentParamNameTo,"internal",true );
    }
    
    obj.addCheckbox( "enabled", true );
    
    // enable_qqq = выполнить разовый вызов qqq в ходе настройки (работы алгоритма setupFromLink)
    function setupFromLink(enable_qqq) {
      //console.error("Link: setupFromLink called",obj);
      var v = obj.getParam("from");
      
      if (currentRefFrom) {
        currentRefFrom.untrackParam( currentParamNameFrom,qqq )
        forgetLinkTracking( currentRefFrom );
        currentRefFrom = undefined;
        currentParamNameFrom = undefined;
      }
      
      if (!v || v.length == 0) return;
      
      var arr = v.split("->");
      if (arr.length != 2) {
        console.error("Link: source arr length not 2!",arr );
        return;
      }
      var objname = arr[0];
      var paramname = arr[1];
      var sobj = obj.findByPath( objname );
      
      if (!sobj) {
        console.error("Link: \source obj not found! Will retry!",arr );
        linkScannerAdd( obj );
        return;
      }
      if (!paramname) {
        console.error("Link: source param is blank",arr );
        
        return;
      }      
      
      if (sobj)
          sobj.trackParam( paramname, qqq );
  
      currentRefFrom = sobj;
      currentParamNameFrom = paramname;      
      addLinkTracking( currentRefFrom,obj );
      
      if (enable_qqq) qqq();
      
      obj.signal("linksChanged");
      currentRefFrom.signal( paramname + "Linked" );
    }
    
    function setupToLink(enable_qqq) {
      var v = obj.getParam("to");
      
      if (currentRefTo) forgetLinkTracking( currentRefTo );
      currentRefTo = undefined;
      currentParamNameTo = undefined;
    
      if (!v || v.length == 0) return;
    
      var arr = v.split("->");
      
      if (arr.length != 2) {
        console.error("Link: target arr length not 2!",arr );
        return;
      }      
      
      var objname = arr[0];
      var paramname = arr[1];
      var sobj = obj.findByPath( objname );    
      
      if (!sobj) {
        // console.log("Link: target obj not found! Will retry!",arr );
        linkScannerAdd( obj );
        return;
      }
      
      currentRefTo = sobj;
      currentParamNameTo = paramname;
      
      addLinkTracking( currentRefTo, obj );

      if (enable_qqq) qqq();
      
      obj.signal("linksChanged");
      
      currentRefTo.signal( paramname + "Linked" );
    }
    
    obj.setupLinks = function() {
      //console.error("Link: setupLinks called");
      setupFromLink(false);
      setupToLink();
    }

    obj.addParamRef("from","",null,setupFromLink );
    obj.addParamRef("to","",filter_to,setupToLink );
    
    // todo speedup by func ptr
    function filter_to(o) {
      if (obj.getParam("tied_to_parent")) { // if our link is tied to parent... todo: move this if out of func def (define 2 functions)
        if (o == obj.ns.parent) {
          // implementing R-LINKS-NO-DEFAULT-VALUE
          return [""].concat( Object.keys( o.params ) );
          // return Object.keys( o.params );
        }
        return [];
      }
      else
      {
        return Object.keys( o.params );
      }
    }

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

    return obj;
  }

vz.chain("create_obj",function( obj, opts ) {

  obj.createLinkTo = function( opts ) {
    //console.log("CLT called,.opts=",opts);
    var paramname = opts.param;
    var sourcestring = opts.from;
    opts.parent = obj;
    opts.type = "link";
    //var q = vz.createLink( opts );
    var q = vz.createObjByType( opts );
    if (paramname && paramname.length > 0)
        q.setParam( "to", obj.getPath() + "->" + paramname );
    q.setParam( "from", sourcestring );
    q.setParam( "tied_to_parent",true );
  }
  
  obj.hasLinks = function() {
    return (howManyLinksTo( obj ) > 0);
  }
  obj.hasLinksToParam = function(pname) {
    return (howManyLinksToParam( obj,pname ) > 0);
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
    (obj.links_to_me || []).forEach( function(l) {
      l.setupLinks(); // probably forget this
    });
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

function howManyLinksToParam( obj,name ) {
  return (obj.links_to_me || []).filter( function(link) {
    var i = obj.links_to_me.indexOf( link );
    var isFrom = obj.links_to_me_direction[i];
    var nama = isFrom ? "from" : "to";
    var arr = (link.getParam(nama) || "").split("->");
    var paramname = arr[1];
    return (paramname == name);
  } ).length;
}


/////////////////////////////////////////////

// восстановление ненайденных ссылок

var scannerLinks = [];
function linkScannerAdd( link ) {
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
