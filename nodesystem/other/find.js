// добавляет функцию поиска объектов в дереве


export default function setup( vz ) {

  vz.find_by_path = function(obj,path) {
    if (!path) return null;
    
    if (path[0] == "/") {
      var root = obj.findRoot();
      if (root != obj)
        return vz.find_by_path( root, path );
    }
    
    if (!Array.isArray(path)) path = path.split("/");
    if (path.length == 0) return obj;
    if (path[0] == "") path = path.slice( 1 );

    var c1 = obj.ns.getChildByName( path[0] );
    if (c1) {
      return vz.find_by_path( c1, path.slice(1) );
    }
    return null;
  }
  
  vz.get_path = function( obj ) {
    if (!obj) return undefined;
    if (!obj.ns.parent) return "/";
    var res = vz.get_path( obj.ns.parent );
    if (res == "/") 
      return "/" + obj.ns.name;
    else
      return res + "/" + obj.ns.name;
  }
  
/*  вроде как выяснено что это должно зависеть от объекта.. чтобы можно было домены деревьев разделять.. */
  vz.find_root = function( obj ) {
    return obj.findRoot();
//    if (!obj.ns.parent) return obj;
//    return vz.find_root( obj.ns.parent );
  }
  
  vz.chain( "create_obj", function (obj,options) {
  
    this.orig( obj, options );

    obj.findRoot = function() {
      if (!obj.ns.parent) return obj;
      return obj.ns.parent.findRoot();
    }
    
    return obj;

  });

}