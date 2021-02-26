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

    obj.addParamRef("from","",null,function(v) {

      if (currentRefFrom) {
        currentRefFrom.untrackParam( currentParamNameFrom,qqq )
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
        console.error("Link: source obj not found! TODO: retry after appendChild! Maybe via external scheduler/signalTracked",arr );
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
    });
    
    obj.addParamRef("to","",null,function(v) {
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
        console.error("Link: target obj not found! TODO retry!",arr );
        return;
      }      
      
      currentRefTo = sobj;
      currentParamNameTo = paramname;
    
    });
    
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
}

function forgetLinkTracking( obj, link ) {
}