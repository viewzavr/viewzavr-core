// экспорт состояния дерева объектов nodesystem в json-простой объект
// а также создание дерева по этому состоянию

// update: manualParamsMode получается это идет признак источника восстановления и сообразно разное поведение
// manualParamsMode=true => все параметры считаются выставленные вручную, setParam( .... true )
// что приведет при дальнейшем дампе к их сохранению в дамп
// manualParamsMode=false => все параметры считаются устанавливаемыми программно и сообразно потом в дамп не попадут
// и более того, это используется для анализа стирания объектов которые не упоминаются в дампе
// todo переразобраться с manual и forcecreate(dumpyInserted) - тут где-то чувствуется что будет ясность причин.

export default function setup( m ) {

  // создание дерева по json-описанию
  // с возможностью синхронизации в существующее дерево
  
  // выяснилось что раз мы не держим во вьюзавре корня,
  // то надо уметь создавать объекты по дампу..
  // но - как нам это поможет выставлять параметры на созданной сцене?
  // видимо это все-таки создающе-синхронизирующая функция
  // и ее второй аргумент это как раз - текущий имеющийся объект
  // короче я все еще в сомнениях - тут смешано получается создание дерева по описанию
  // и 2) синхронизация этого дерева из описания, и 
  // и еще это упирается в ситуацию а что если корень дерева в памяти не того типа что в описании?
  
  // returns promise
  m.createSyncFromDump = function( dump, _existingObj, parent, desiredName, manualParamsMode )
  {
    var obj = _existingObj;
    if (!obj || (dump.type && obj.historicalType != dump.type && dump.manual)) {
      if (!obj || obj.ns.parent) {  // пусть это работает пока не для корня дерева - там непонятно мне пока
         // var opts = { parent: parent, type: dump.type, name: dump.name }
         var opts = Object.assign( {}, dump, { parent: parent, name: desiredName } );
         obj = dump.type ? m.create_obj_by_type( opts ) : m.createObj( opts );
         if (!obj) {
           console.error("createSyncFromDump: failed to create object! opts=",opts);
           console.error("will create some obj to avoid js errors, but it is not the desired one");
           obj = m.createObj( { parent: parent, name: desiredName || "ehh" });
         }
      }
    }
    // в dump должно быть поле type, оно нам все и создаст что надо

    
    return new Promise( function (resolve, reject) {
        obj.restoreFromDump( dump,manualParamsMode ).then( (res) => {
          resolve( obj );
        }).catch( (err) => {
          reject( err );
        })
    })
    
    /*
    //return obj.restoreFromDump( dump );
    obj.restoreFromDump( dump );
    return obj;
    */
  }

  // тестовое - получается создает obj а наполнение потом уж
  m.createSyncFromDumpNow = function( dump, _existingObj, parent, desiredName )
  {
    var obj = _existingObj;
    if (!obj || (dump.type && obj.historicalType != dump.type && dump.manual)) {
      if (!obj || obj.ns.parent) {  // пусть это работает пока не для корня дерева - там непонятно мне пока
         // var opts = { parent: parent, type: dump.type, name: dump.name }
         var opts = Object.assign( {}, dump, { parent: parent, name: desiredName } );
         obj = dump.type ? m.create_obj_by_type( opts ) : m.createObj( opts );
         if (!obj) {
           console.error("createSyncFromDump: failed to create object! opts=",opts);
           console.error("will create some obj to avoid js errors, but it is not the desired one");
           obj = m.createObj( { parent: parent, name: desiredName || "ehh" });
         }
      }
    }
    // в dump должно быть поле type, оно нам все и создаст что надо

    obj.restoreFromDump( dump );
    return obj;
  }
  
  // this is made specially so obj.restoreFromDump may be overriden
  m.restoreObjFromDump = function( dump, obj, manualParamsMode ) {
    var h = dump.params || {};
    var keys = Object.keys(h);

    //var objismanual = obj.ismanual();

    if (dump.manual) manualParamsMode = true; // такой вот прием.. а то "ручные объекты" потом не сохранить получается..

    keys.forEach( function(name) {
      //console.log("setting param",name,h[name]);
      obj.setParam( name, h[name], manualParamsMode ); // ставим true - в том смысле что это установка из
    });

    m.removeChildrenByDump( dump, obj, manualParamsMode );
    
    return m.createChildrenByDump( dump, obj, manualParamsMode );
  }
  
  m.removeChildrenByDump = function( dump, obj, manualParamsMode )
  {
    var c = dump.children || {};
    var ckeys = Object.keys( c );
    ///////////////////////////////////////////////////////////
    // удаляем тех что есть у нас но нет во входящем списке
    // важно на каждой итерации цикла обращаться в getChildren
    var cnames = obj.ns.getChildNames();
    for (var i=0; i<cnames.length; i++) {
      var cname = cnames[i];
      var lc = obj.ns.getChildByName( cname );
      if (lc.protected) continue;

      // режимы:
      // объект был добавлен вручную => входящая информация несет приоритет
      // объект был добавлен программно => вообще его не трогаем (почему-то)
      // объект был добавлен программно с пометкой dumpyInserted/forcecreate => входящая информация несет приоритет если режим ввода программный
      if (lc.manuallyInserted || (lc.dumpyInserted && !manualParamsMode)) {
        if (!c[cname]) { // во входящих нет
          // console.log("removing local unnecessary child lc=",lc);
          lc.remove();
        }
      }
    }

  }
  
  // это вынесено в отдельную функцию потому что мы ее захотим овверрайдить для загрузки пакетов
  m.createChildrenByDump = function( dump, obj, manualParamsMode )
  {
    var c = dump.children || {};
    var ckeys = Object.keys( c );
    
    ///////////////////////////////////////////////////////////    
    // console.log("examining incoming children",c);
    // добавляем тех что есть во входящем списке но нет у нас
    // а мы добавим в общем списке..
  
    // todo отсортировать в порядке order..
    var promises_arr = [];
    //var actual_children_table
    ckeys.forEach( function(name) {
      var cobj = obj.ns.getChildByName( name );
      if (!c[name].manual && !cobj && !c[name].forcecreate) {
        // ситуация когда объект должен был быть создан автоматически - но его нет!
        console.error("load_from_dump: no child of name found! name=",name,"obj=",obj);
        promises_arr.push( Promise.reject() );
        return;
      }
      var r = m.createSyncFromDump( c[name], cobj, obj, name, manualParamsMode );
      promises_arr.push( r );
      
      // the only way to catch errors is here, allSettled will ignore that error
      r.catch( (err) => {
        console.error("createChildrenByDump: error!",err );
      });
    });

    //return Promise.allSettled( promises_arr );

    // теперь у нас ситуация что есть входящий список детей, и их экземпляры
    // и есть текущий список детей внутри объекта
    // и надо чтобы порядок текущего списка соответствовал входящему списку

    var result_p = new Promise( (resolv, reject) => {
      Promise.allSettled( promises_arr ).then( (arr_of_objects_res) => {

       let order = {};
       let index = 0;
       for (let c of ckeys) {
          // имя в дампе может отличаться от реального назначенного имени
          order[ arr_of_objects_res[index].value?.ns?.name || "__not__found__" ] = index++;
       }
       // тех что уже были в объекте - считаем на первом месте
       var dp = -1;
       var sorted = obj.ns.getChildren().sort( (a,b) => {
          if ((order[a.ns.name] || dp) < (order[ b.ns.name ] || dp)) return -1;
          if ((order[a.ns.name] || dp) > (order[ b.ns.name ] || dp)) return +1;
          return 0;
       })
       
       obj.ns.setChildren( sorted );

       resolv( obj );
    });
    });
    
    return result_p;

  }
  
  m.dumpObj = function( obj ) {
    
    //var res = Object.create( obj.params );
    var res = {};
    if (Object.keys( obj.params ).length > 0) {
        //res.params = Object.assign({},obj.params);
        // feature: do not copy some params to dump!
        res.params = {};
        Object.keys( obj.params ).forEach( function(name) {
          var v = obj.dumpParam( name );

          if (typeof(v) === "string" && v.length > 10000) {
            console.error("dumpObj: because value too long, dump will not save param ",name,"of obj",obj.getPath());
            return;
          }

          if (typeof(v) !== "undefined" && v !== null)
            res.params[name] = v;
        });
    }

    if (obj.ismanual && obj.ismanual()) {
      res.manual = true;
      res.type = obj.historicalType;
    }
    else if (obj.historicalType) {
      res.type = obj.historicalType;
      //res.type = opts.type; //tttt
    }
    if (obj.module_url) {
      res.module_url = obj.module_url;
    }
    var ch = obj.ns.getChildNames();
    if (ch.length > 0) {
      res.children={};
      ch.forEach( function(cname,index) {
         var c = obj.ns.getChildByName( cname );
         var r = c.dump();
         if (!r) return; // возможность объекту отказаться от сохранения
         res.children[cname] = r;
         if (res.children[cname].manual)
             res.children[cname].order=index;
      } );
    }

    // фича "если не заданы параметры вовсе то не надо делать запись params"
    if (res.params && Object.keys(res.params).length == 0) delete res.params;
    // фича "если не заданы дети вовсе то не надо делать запись children"
    if (res.children && Object.keys(res.children).length == 0) delete res.children;

    return res;
  }

m.chain("create_obj",function( obj, opts ) {

  obj.ismanual = function() {
    return obj.manuallyInserted ? true : false;
  }
  obj.setmanual = function(v) {
    return obj.manuallyInserted = v;
  }

  obj.dump = function() {
    return m.dumpObj( obj );
  }

  // manualParamsMode - consider incoming params as manual
  obj.restoreFromDump = function ( dump, manualParamsMode ) {
    return m.restoreObjFromDump( dump, obj, manualParamsMode );
  }
  
  // returns promise
  obj.clone = function( opts = {} ) {
    var dump = obj.dump();
    //debugger;
    if (!opts.parent) opts.parent = obj.ns.parent;
    return m.createSyncFromDump( dump, null, opts.parent, opts.name );
  }
  
    // created this method(tpu) to implement R-SETREF-OBJ
  obj.dumpParam = function ( name ) {
        if (obj.getParamOption( name,"internal" ) || name[0] == "@")
        {
          // console.log("skipped dump of name because internal",name);
        }
        else
        {
          return obj.params[name];
        }
  }

  
  if (opts.manual) obj.manuallyInserted = true;

  if (opts.forcecreate) obj.dumpyInserted = true; // @todo раскопать эту тему
  // расскомментировал dumpyInserted так как это признак при очистке детей что их можно очищать..
  // (там идет идейный конфликт - нам приходит дамп и можно ли удалить объект?)
  // и вот у на случай что мы сделали xmlFromChildren.. и хотим повторить... и значит надо всех кого мы не перечислили - убрать..
  // но это приводит к тому что когда приходит дамп из проекта (хеш браузера) то это приводит к очистке всево..
  // значит нужны режимы...

  this.orig( obj, opts );

  return obj;
} ); // create_obj

}