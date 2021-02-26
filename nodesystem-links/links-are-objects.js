// вводим понятие "ссылка" в духе Дениса Перевалова

export default function setup( vz ) {

  

  vz.createLink = function( opts ) {
    opts.name ||= "link";
    var obj = vz.createObj( opts );
    
    var currentRefFrom;
    var currentRefTo;

    var currentParamNameFrom;
    var currentParamNameTo;
    var tracode;
    
    function qqq() {
      if (!obj.getParam("enabled")) return;
      if (!currentRefTo) return;
      if (!currentRefFrom) return;
      
      var val = currentRefFrom.getParam( currentParamNameFrom  );
      
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
    }
    
    obj.setupLinks = function() {
      setupFromLink(false); setupToLink();
    }

    obj.addParamRef("from","",null,setupFromLink );
    obj.addParamRef("to","",null,setupToLink );
    
    obj.addCheckbox( "transform-enabled",false );
    obj.addText("transform-code","// enter transform code here. arg: v - input value\nreturn v",function(cod) {
       if (!cod || cod.length == 0) {
          tracode = undefined; // new Function("v","return v");
          return;
       }
       tracode = new Function("v",cod);
    } );

    return obj;
  }

vz.chain("create_obj",function( obj, opts ) {

  obj.createLinkTo = function( paramname,sourcestring ) {
    var q = vz.createLink( {parent: obj} );
    q.setParam( "to", obj.ns.getPath() + "->" + paramname );
    q.setParam( "from", sourcestring );
  }

  this.orig( obj, opts );

  return obj;
} ); // create_obj

vz.addItemType("link","Link",vz.createLink, {} );

}

// это для отслеживания если объект удалился
function addLinkTracking( obj, link ) {
  var firstTime = (!obj.links_to_me);
  obj.links_to_me ||= [];
  if (obj.links_to_me.indexOf( link ) >= 0) return;
  obj.links_to_me.push( link );

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
  if (i >= 0) obj.links_to_me = obj.links_to_me.splice( i,1 );
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