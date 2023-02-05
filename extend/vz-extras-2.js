// (c) viewzavr project. MIT license.
// purpose: add viewzavrs extras

/////////////////////////////////////////////////////////////////////
  

export function param_alias(obj) {  
  
		obj.addParamAlias = function(toname, fromname) {
			obj.trackParam(fromname, () => {
				obj.setParam(toname, obj.params[fromname]);
			})
			obj.setParamOption(fromname, "internal", true);
      if (obj.hasParam(fromname))
        obj.setParam( toname, obj.getParam(fromname))
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
        if (o.hasCmd( arr[1])) // команды не линкуем пока - там зацикливанье
          return;
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

        // это криминал. надо если что-то то давайте вручную копировать..
        // потому что получается что manual флаг здесь теперь сидит..
        // obj.param_options[ toname ] = o.paramOptions( arr[1] ); // хак.. ну починим когда апи устаканится..

        // feature: if source object removed, forget link to its param
        // ладно уш, не будем
          //o.on("remove", () => olink.remove() );

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
      },50);
    }
	
	}

/////////////////////////////////////////////////////////////////////   

// вот мысли у меня. с одной стороны фичи это хорошо - можем именно что модифицировать окружение
// и менять его поведение. с другой стороны - вот в целях предоставления отдельного функционала...
// может быть и не хотелось бы влазить прямо в окружение. при этом кажется, что может быть
// ценно привязаться к конкретному env. это пожалуй да, но - можно же привязаться, но не влезать в него
// @todo @compalang
// и еще мысль была - регистрировать фичи как функции env или vz или еще чего, фиче-тейбла
// и вызывать их не по env.feature(name) а по env.name. аргументов много сходу их не помню.

function delayed( env ) {
  env.delayed = _delayed;
  env.delayed_first = _delayed_first;
}

/////////////////////////////////////////////////////////////////////   
	

function _delayed( f,delay=0 ) {
  var t;
  var remembered_args;

  var res = function(...args) {
    remembered_args = args;
    if (t) return;
    t = setTimeout( () => {

      // t=null; фундаментально - рестарт разрешаем только после того как все закончено..
      
      f(...remembered_args);

      t=null;
      
    },delay);
  }
  res.stop = () => { if(t) clearTimeout(t);t=null; };

  return res;
}

// вариант когда запоминается первая версия аргументов
function _delayed_first( f,delay=0 ) {
  var t;

  var res = function(...args) {
    if (t) return;
    t = setTimeout( () => {

      // t=null; фундаментально - рестарт разрешаем только после того как все закончено..
      
      f(...args);

      t=null;

    },delay);
  }
  res.stop = () => { if(t) clearTimeout(t);t=null; };

  return res;
}

////////////////////////////

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