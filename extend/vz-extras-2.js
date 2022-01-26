// (c) viewzavr project. MIT license.
// purpose: add viewzavrs extras

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

  var res = function(...args) {
    if (t) return;
    t = setTimeout( () => {
      t=null;
      f(...args);
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