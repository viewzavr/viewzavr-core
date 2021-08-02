// добавляет функцию поиска объектов в дереве


export default function setup( vz ) {

  /*
    / => root
    /item => child named `item` of root
    /item/item => child named `item` of child named `item` of root    
    item => child named `item` of obj
    ../item => child named `item` of parent of obj
    EMPTY => obj
  */
  vz.find_by_path = function(obj,path) {
    if (path == "") return obj;

    if (!path) return null;

    if (path.getPath) return path; // this is object - return as is, R-SETREF-OBJ
    
    if (path[0] == "/") {
      var root = obj.findRoot();
      if (root == obj) {
//        if (obj.ns.name !== "scene") debugger;
        path = path.substring(1);
      }
      else
      {
        return vz.find_by_path( root, path );
      }
    }
    
    if (path[0] == "." && path[1] == "." && path[2] == "/") {    // example: ../camera
      return vz.find_by_path( obj.ns.parent, path.substring(3) );
    }
    if (path == "..") {    // example: ..
      return obj.ns.parent;
    }
    if (path == ".") {     // example: .
      return obj.ns.parent;
    }
    if (path[0] == "." && path[1] == "/") // example: ./child
      path = path.substring(2);

    if (!Array.isArray(path)) path = path.split("/");

    var c1 = obj.ns.getChildByName( path[0] );
    if (c1) {
      return vz.find_by_path( c1, path.slice(1) );
    }
    return null;
  }
  
  vz.get_path = function( obj ) {
    if (!obj) return undefined;
    if (!obj.ns.parent) return "/";
    
    var root = obj.findRoot();
    if (obj == root) return "/";
    
    var p = obj;
    var res = obj.ns.name;
    while (p != root) {
      p = p.ns.parent;
      if (p == root)
        res = "/" + res;
      else
        res = p.ns.name + "/" + res;
    }
    return res;
    

/*    
    var res = vz.get_path( obj.ns.parent );
    if (res == "/") 
      return "/" + obj.ns.name;
    else
      return res + "/" + obj.ns.name;
*/      
  }
  
  // computes path to obj relative to basisobj
  vz.get_path_rel = function( obj, basisobj ) {
    var p1 = vz.get_path( obj );
    var p2 = vz.get_path( basisobj );

    // https://github.com/jinder/path/blob/master/path.js#L506
    var to = p1;
    var from = p2;

    var fromParts = trimArray(from.split('/'));
    var toParts = trimArray(to.split('/'));

    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }

    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push('..');
    }

    outputParts = outputParts.concat(toParts.slice(samePartsLength));

    return outputParts.join('/');
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
    
    obj.getPath = function() {
      return vz.get_path( obj );
    }
    
    obj.getPathRelative = function(basisobj) {
      return vz.get_path_rel( obj,basisobj);
    }    
    
    obj.findByPath = function(path) {
      return vz.find_by_path( obj, path );
    }
    
    return obj;

  });

}

////////////////////////////////
// https://github.com/jinder/path/blob/master/path.js#L58
// returns an array with empty elements removed from either end of the input
// array or the original array if no elements need to be removed
function trimArray(arr) {
  var lastIndex = arr.length - 1;
  var start = 0;
  for (; start <= lastIndex; start++) {
    if (arr[start])
      break;
  }

  var end = lastIndex;
  for (; end >= 0; end--) {
    if (arr[end])
      break;
  }

  if (start === 0 && end === lastIndex)
    return arr;
  if (start > end)
    return [];
  return arr.slice(start, end + 1);
}
