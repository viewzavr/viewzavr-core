/////////////// добавляет понятие типа объектов в систему nodesystem

//// m.addItemType(code,title,initfn,opts) - регистрирует тип (code)
//// сигнатура функции initfn: function( opts )
//// где у opts могут быть такие интересные ключи как parent

//// m.getTypeInfo(code) -> (initfn,title,opts)
//// m.getTypeRecords() - возвращает массив записей [code,tittle]
//// m.create_obj_by_type( opts )
//// где в opts надо указать ключ type: xxx

//// Заметки
//// эта версия лучше чем types1 тем, что она формально развязывает
//// систему типов (которая есть этот файл) и создание узлов
//// пользователь формально может создавать узлы как угодно вызывая
//// собственные функции. И оставаться счастливым человеком при этом
//// даже не ведая что тут какие-то типы есть.
//// Ну а эти типы больше для работы в гуи и для наполнения из 
//// скриптов которые один раз должны отработать.


export default function setup( m ) {

var itemtypes_dic = {};
var itemtypes_arr = [];

m.addItemType = function(code,title,fn,opts) {
  //console.log("addItemType called!",code);
  if (!opts) opts = {};

  // если уже был такой тип - заменяем новым
  if (itemtypes_dic[code]) {
    var existing_i = itemtypes_dic[code][3];
    itemtypes_arr[existing_i] = [code,fn,title,opts];
  }
  else
  {
    itemtypes_arr.push( [code,fn,title,opts] );
  }
  itemtypes_dic[code] = [fn,title,opts, itemtypes_arr.length-1 ];
}

m.forgetItemType = function(code) {
  itemtypes_arr = itemtypes_arr.filter( rec => rec[0] != code );
  delete itemtypes_dic[code];
}

// возвращает запись вида [fn,title,opts]
m.getTypeInfo = function(code) {
  return itemtypes_dic[code];
}

m.getTypeOptions = function(code) {
  var r = itemtypes_dic[code];
  if (r) return r[2];
  return {};
}

// возвращает массив записей вида [code,title,opts]
m.getTypeRecords = function() {
  return itemtypes_arr.map( function(rec) { return [ rec[0], rec[2], rec[3] ] } );
}

// хорошо бы сигнатуру соблюсти.. opts? и там type указывать? ну да. и такое-же провернуть с vis3-объектами..
m.create_obj_by_type = function( opts ) {

  var code = opts.type;

  var typerecord = m.getTypeInfo( code );
  
  if (!typerecord) {
    console.error("Viewzavr: create_obj_by_type no type info for type=",code );
    return;
  }
  
  var finalopts = {};
  Object.assign( finalopts, typerecord[2], opts || {} );
  
  var typefunc = typerecord[0];
  var obj = typefunc( opts );
  obj.historicalType = opts.type;

  return obj;
}

m.getTypeFunc = function(code) {
  return itemtypes_dic[code][0];
}

} // setup

