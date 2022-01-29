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
    if (!obj) return null;

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
      // F-FEAT-PARAMS
      if (obj.host.ns.parent)
        return obj.host.ns.parent;

      if (obj.host.host != obj.host) // ну вот так вот.. смысл чтобы как-то выходить из вложенных окружений..
        return obj.host.host;
      return null;
      //return obj.host.ns.parent;
      //return obj.lexicalParent || obj.ns.parent || obj.master_env;
    }
    if (path == ".") { // example: .
      //return obj;
      return obj.host;
    }
    if (path == "")
      return obj;

    // // F-FEAT-PARAMS
    if (path == "~") { // example: ~
      //return obj.master_env || obj;
      return obj;
    }

    if (path[0] == "." && path[1] == "/") // example: ./child
      path = path.substring(2);

    if (path[0] == "@") // find by id @name or @name/sub/path
      return vz.find_by_id_scopes( obj,path.slice(1) )
      // todo: @name:subenv ?

    if (!Array.isArray(path)) path = path.split("/");

    // вход в дерево фич:  ./&/somechild
    /*
    if (path[0] == "&") {      
      var c1 = obj.ft.getChildByName( path[1] ); // это работает потому что теперь path это массив
      if (c1) {
        return vz.find_by_path( c1, path.slice(2) );
      }
      return null
    }
    */

    var c1 = obj.ns.getChildByName( path[0] ); // это работает потому что теперь path это массив
    if (c1) {
      return vz.find_by_path( c1, path.slice(1) );
    }

    // случай доступа во вложенную фичу, F-SUBFEAT-PATH
    let parts = path[0].split(":");
    if (parts[1]) { 
      var c2 = obj.ns.getChildByName( parts[0] ); // это работает потому что теперь path это массив
      if (c2 && c2.$feature_list_envs_table) {

        let maybe_feature = c2.$feature_list_envs_table[ parts[1] ];

        // надо добавить путешествие дальше, ибо мб a:b:c
        for (let qq=2; qq<parts.length; qq++) {
          if (!maybe_feature) break;
          maybe_feature = maybe_feature.$feature_list_envs_table[ parts[qq] ];
        }

        if (maybe_feature) {
           return vz.find_by_path( maybe_feature, path.slice(1) );
        }
      }
    }

    return null;
  }

  // алгоритм поиска объекта по имени
  vz.find_by_id_scopes = function (startobj,name,skipobj,allow_up=true,tree_name="ns" ) {
    
    var c1 = startobj[tree_name].getChildByName( name );
    if (c1) return c1;
    for (let o of startobj[tree_name].getChildren()) {
      if (o === skipobj) continue;
      let res = vz.find_by_id_scopes( o, name, null, false );
      if (res) return res;
    }

    // походим по субфичам
    if (startobj.$feature_list_envs_table) {
      let c2 = startobj.$feature_list_envs_table[ name ];
      if (c2) return c2;
      // хотя вопросов это много вызывает, очень много...
      // и да, мы пока тут не заходим внутрь этих субфич, т.е. это работает ток на первый их слой..
    }

    // воткнем сюда проверку на доп-имена
    // F-FEAT-ROOT-NAME
    if (startobj.$env_extra_names && startobj.$env_extra_names[ name ])
       return startobj; // это мы

    // прошлись по дереву детей - не нашли. идем к соседям и далее рекурсивно

    if (allow_up) {
      if (startobj.lexicalParent) // // F-LEXICAL-PARENT
          return vz.find_by_id_scopes( startobj.lexicalParent, name, startobj, true );      

      if (startobj.hosted) // F-FEAT-PARAMS
        return vz.find_by_id_scopes( startobj.host, name, startobj, true );
        /*
          return vz.find_by_id_scopes( startobj.master_env, name, startobj, true,"feature_tree" ) 
                 || vz.find_by_id_scopes( startobj.master_env, name, startobj, true );
        */         
      
      if (startobj.ns.parent)
          return vz.find_by_id_scopes( startobj.ns.parent, name, startobj, true );
    }
  }

  vz.get_path = function( obj,known_root_obj ) {
    if (!obj) return undefined;

    if (obj.hosted) { // F-FEAT-PARAMS
       //if (!obj.$feature_name) debugger;
       let fn = obj.$feature_name || obj.ns.name; // временный хак по поиску как же это назвали
       return vz.get_path( obj.host,known_root_obj ) + ":" + fn;
    }

    if (!obj.ns.parent) return "/";
    
    known_root_obj ||= obj.findRoot(); // это нам надо чтобы уметь делать остановки на промежуточных слоях (например vzPlayer - scene здесь scene будет рутом)
    if (obj == known_root_obj) return "/";

    let parental = vz.get_path( obj.ns.parent,known_root_obj );
    if (parental == "/") parental = "";
    
    return parental + "/" + obj.ns.name;
  }
  
  /*
  vz.get_path = function( obj ) {
    if (!obj) return undefined;

    if (obj.master_env) { // F-FEAT-PARAMS
       return vz.get_path( obj.master_env ) + ":" + obj.$feature_name;
    }

    if (!obj.ns.parent) return "/";

    let parental = vz.get_path( obj.ns.parent );
    if (parental == "/") parental = "";
    
    return parental + "/" + obj.ns.name;
  }
  */

  /*
  vz.get_path = function( obj ) {
    if (!obj) return undefined;

    if (obj.master_env) { // F-FEAT-PARAMS
       return vz.get_path( obj.master_env ) + ":" + obj.$feature_name;
    }

    if (!obj.ns.parent) return "/";
    
    var root = obj.findRoot();
    if (obj == root) return "/";
    
    var p = obj;
    var res = obj.ns.name;

    return vz.get_path( obj.ns.parent ) + "/" + res;

    while (p != root) {
      //p = p.ns.parent;
      p = p.ns.parent || p.master_env; // F-FEAT-PARAMS
      if (p == root)
        res = "/" + res;
      else
        res = p.ns.name + "/" + res;
    }
    return res;
  }
  */
  
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

    obj.findRoot = function() {
      if (obj.hosted) return obj.host.findRoot(); // F-FEAT-PARAMS

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
    
    this.orig( obj, options );
    
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
