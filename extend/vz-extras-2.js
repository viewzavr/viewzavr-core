// (c) viewzavr project. MIT license.
// purpose: add viewzavrs extras

//import delayed from "vz/delayed";
//import * as vis from "vz/viewlang";

/////////////////////////////////////////////////////////////////////

export function find_objects(env) {
   
  // найти объекты 
  // criteria это строка, в которой через пробел перечислены имена категорий (точнее начала имен)
  // update: если нашли объект, то не входить в его под-объекты
  // возвращает массив найденных объектов
	env.findObjects = function( root, criteria ) {
		  let acc = [];
		  if (!criteria || criteria.length === 0) return acc;
		  let cats = criteria.split(" ");
		  let cats_set = new Set( cats );

      traverse_if( root, (obj) => {
      	 if (matching(obj)) { acc.push( obj ); return false }
         return true;
      })

      function matching( obj ) {
      	let type = obj.historicalType;
      	if (!type) return;
      	var objcats = env.vz.getCatsByType( type );
      	   for (let c of cats) {
      	   	  for (let oc of objcats) {
      	   	  	 if (oc.startsWith( c ))
      	   	  	 	  return obj;
      	   	  }
      	   }
      }

      // console.log("find-objects: criteria=",criteria, "result=",acc );

      return acc;
   };
}


	// https://forum.xclu.dev/t/sdk-math-paths-time-bangs-rasters-logic/34#sending-bangs-15
	// у Дениса указывается список строк, и это повод чтобы найти а) объекты, б) команды.
	// моя задача немного другое - поиск объектов (а возможно и их команд)

	// вариант - пусть поисковые строки остаются как есть, ну там что-нибудь написано
	// а самый цымес будет таки в функциях которые берут эти строки и находят то что надо.
	// мы им даже можем callback-и снарядить или промисы

	// а так я думал делать addObjects и там параметры поиска

	//vz.addPointers = function

  // findThings.. findCommands.. ?

  // задача 1 - по имени. по префиксу даже

  // сделаем просто а потом поищем по стандартам
  // https://github.com/poef/json-css
  // https://www.npmjs.com/package/jsonpath

/////////////////////////////////////////////////////////////////////

export function track_objects(env) {
  
  env.feature( "find_objects" );

  // tracks objects creation/removal in subtree according to criteria
	env.trackObjects = function( root, criteria, cb ) {
      let reported_names;
		  function rescan2() {
		  	// @todo delayed
		  	let acc = env.findObjects( root, criteria );
        let acc_names = acc.map( (e) => e.getPath() ).join(" ");
        if (acc_names != reported_names) {
          reported_names = acc_names;
          cb( acc );
        }
      }
      var rescan = delayed( rescan2,25 ); // поставим задержку и отсечение дублей

      //var f1 = root.on("appendChildInTree",rescan );
      //var f2 = root.on("forgetChildInTree",rescan );
      var f3 = root.on("change_in_tree",rescan );
      // @todo on rename

      // возвращаем функцию отписки
      //var fall = () => { f1(); f2(); }
      var fall = () => { f3(); }

      rescan();

      return fall;
	}
	
}

/////////////////////////////////////////////////////////////////////

export function objects_param(obj) {

    //track_objects( obj );
    obj.feature("track_objects");
  
    // добавляет параметр равный массиву объектов заданного критерия

    obj.addObjects = function(name,criteria,cb,desired_root) {
       obj.setParamOption( name,"internal",true );
       
       let unsubscribe;
       let removed;

       obj.addString(`${name}_criteria`,criteria,(v) => {
       		if (unsubscribe) unsubscribe();
       		unsubscribe = obj.trackObjects( desired_root || obj.findRoot(),v,(acc) => {
       			 obj.setParam( name, acc );
             if (!removed) // фича не посылать cb удаленному объекту
       			     cb( acc );
       		} )
       });
       obj.signalParam(`${name}_criteria`);

       
       obj.chain("remove",function() {
       	 if (unsubscribe) unsubscribe();
         removed = true;
       	 this.orig();
       })
    }
    
}

/////////////////////////////////////////////////////////////////////
  

export function param_alias(obj) {  
  
		obj.addParamAlias = function(toname, fromname) {
			obj.trackParam(fromname, () => {
				obj.setParam(toname, obj.params[fromname]);
			})
			obj.setParamOption(fromname, "internal", true);
		}

}  

/////////////////////////////////////////////////////////////////////
export function param_mirror(obj) {  

    obj.feature("find_track");

    // импортирует параметр и его гуи из другого объекта, и устанавливает взаимную связь
    // source это путь объект->имяпараметра
    obj.addParamMirror = function(toname, source ) {
      let arr = source.split("->");
      obj.findByPathTrack( arr[0], (o) => {
        let gr = o.getGui( arr[1] );
        //if (obj.par)
        let vv = obj.params[toname];
        // если у нас выставлено значение - передадим подопечному...
        if (typeof(vv) != "undefined") {
          
          o.setParam(arr[1],vv);
        }
        obj.addGui( {...gr,name:toname, fn:undefined, value: undefined } );
        var olink = obj.linkParam( toname, source );
        // obj.setParamOption( toname, o.paramOptions( arr[1] ) ); // ну и тут события всякие приедут.. ну ладно..
        obj.param_options[ toname ] = o.paramOptions( arr[1] ); // хак.. ну починим когда апи устаканится..
        // feature: if source object removed, forget link to its param
        o.on("remove", () => olink.remove() );
        o.linkParam( arr[1], obj.getPath() + "->"+toname );
        // todo здесь надо что-то другое, история с visible
      } )
      // вся эта история работает только потому, что мы делаем дубликат rec и там сообразно приезжает fn
    }
    
}


/////////////////////////////////////////////////////////////////////
export function tree_items(obj) {  

		obj.treeItems = function(tree = "ns") {
			var names = {};
			var txt = "";
			obj[tree].traverse(function(co) {
				names[co[tree].name] = co;
				var nama = co[tree].name.replace(/[^a-zA-Z0-9_]/, "_");
				names[nama] = co;
			});
			return names;
		}

}

/////////////////////////////////////////////////////////////////////
export function find_track(obj) {  

    obj.findByPathTrack = function( path, cb,retry_left=50 ) {
      var res = obj.findByPath( path );
      if (res) return cb( res );
      if (retry_left <= 0) return;

      setTimeout( () => {
        obj.findByPathTrack( path, cb,retry_left-1 );
      },500);
    }
	
	}

/////////////////////////////////////////////////////////////////////   

export function delayed( env ) {
  env.delayed = _delayed;
}

/////////////////////////////////////////////////////////////////////   
	

function _delayed( f,delay=0 ) {
  var t;

  var res = function() {
    if (t) return;
    t = setTimeout( () => {
      t=null;
      f();
    },delay);
  }

  return res;
}

  // поиск - обход всех детей с вызовом fn
function traverse_if( obj, fn ) {
    if (!fn( obj )) return;
    var cc = obj.ns.getChildNames();
    for (var i=0; i<cc.length; i++) {
      var name = cc[i];
      var cobj = obj.ns.getChildByName( name );
      // это не надо оно само себя вызовет var res = fn( cobj );
      traverse_if( cobj,fn );
    }
}

export function setup( vz,me ) {
  vz.register_feature_set( me ); // получается вот этот вызов это есть сухожилия. соединение местного с системой. регаем фичи = добавляем в таблицу системы записи.
  //let q = import.meta;
  //debugger;
  //vz.register_feature_set( {find_objects,delayed,find_track,tree_items,param_alias,param_mirror,objects_param,find_objects,track_objects} );
}