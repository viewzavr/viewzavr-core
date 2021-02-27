// вводим понятие "ссылка" в духе Дениса Перевалова

export default function setup( vz ) {

  vz.createLink = function( opts ) {
    opts.name ||= "formula";
    var obj = vz.createObj( opts );
    
    var currentRefFrom;
    var currentRefTo;

    var currentParamNameFrom;
    var currentParamNameTo;
    var tracode;
    
    function qqq() {
      if (!obj.getParam("enabled")) return;
      if (!currentRefTo) return;
      
      //if (!currentRefFrom) return;
      
      var val = currentRefFrom ? currentRefFrom.getParam( currentParamNameFrom  ) : [];
      
      if (tracode && obj.getParam("transform-enabled")) {
        try {
          val = tracode( val );
        } catch( ex ) {
          console.error("Link: transform-code error!",ex );
        }
      }
      
      currentRefTo.setParam( currentParamNameTo,val );
    }
    
    obj.addCheckbox( "enabled", true );
    
    function setupFromLink(enable_qqq) {
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
        console.log("Link: source obj not found! Will retry!",arr );
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
        console.log("Link: target obj not found! Will retry!",arr );
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
      setupFromLink(false); setupToLink();
    }

    obj.addParamRef("from","",null,setupFromLink );
    obj.addParamRef("to","",filter_to,setupToLink );
    
    // todo speedup by func ptr
    function filter_to(o) {
      if (obj.getParam("tied_to_parent")) {
        if (o == obj.ns.parent) return Object.keys( o.params );
        return [];
      }
      else
      {
        return Object.keys( o.params );
      }
    }
    
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

    return obj;
  }

vz.chain("create_obj",function( obj, opts ) {

  obj.createLinkTo = function( opts ) {
    var paramname = opts.param;
    var sourcestring = opts.from;
    opts.parent = obj;
    opts.type = "link";
    //var q = vz.createLink( opts );
    var q = vz.createObjByType( opts );
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

vz.addItemType("link","Formula",vz.createLink, {hidegui: true} );

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
  x.forEach( link => link.setupLinks ); // она там себя добавит если облом
}, 1000 );