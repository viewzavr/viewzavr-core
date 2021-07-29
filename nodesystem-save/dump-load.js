// экспорт состояния дерева объектов nodesystem в json-простой объект
// а также создание дерева по этому состоянию

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
  m.createSyncFromDump = function( dump, _existingObj, parent, desiredName )
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
    
    return obj.restoreFromDump( dump );
  }
  
  // this is made specially so obj.restoreFromDump may be overriden
  m.restoreObjFromDump = function( dump, obj ) {
    var h = dump.params || {};
    var keys = Object.keys(h);

    keys.forEach( function(name) {
      //console.log("setting param",name,h[name]);
      obj.setParam( name, h[name] );
    });

    m.removeChildrenByDump( dump, obj );
    
    return m.createChildrenByDump( dump, obj );
  }
  
  m.removeChildrenByDump = function( dump, obj )
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
      if (lc.manuallyInserted) {
        if (!c[cname]) { // во входящих нет этого дитятки
          // console.log("removing local unnecessary child lc=",lc);
          lc.remove();
        }
      }
    }

  }
  
  // это вынесено в отдельную функцию потому что мы ее захотим овверрайдить для загрузки пакетов
  m.createChildrenByDump = function( dump, obj )
  {
    var c = dump.children || {};
    var ckeys = Object.keys( c );
    
    ///////////////////////////////////////////////////////////    
    // console.log("examining incoming children",c);
    // добавляем тех что есть во входящем списке но нет у нас
    // а мы добавим в общем списке..
  
    // todo отсортировать в порядке order..
    var promises_arr = [];
    ckeys.forEach( function(name) {
      var cobj = obj.ns.getChildByName( name );
      if (!c[name].manual && !cobj) {
        // ситуация когда объект должен был быть создан автоматически - но его нет!
        console.error("load_from_dump: no child of name found! name=",name,"obj=",obj);
        return;
      }
      var r = m.createSyncFromDump( c[name], cobj, obj, name );
      promises_arr.push( r );
    });
    
    return Promise.allSettled( promises_arr );
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
    return res;  
  }

m.chain("create_obj",function( obj, opts ) {

  obj.ismanual = function() {
    return obj.manuallyInserted ? true : false;
  }

  obj.dump = function() {
    return m.dumpObj( obj );
  }

  obj.restoreFromDump = function ( dump ) {
    return m.restoreObjFromDump( dump, obj );
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

  this.orig( obj, opts );

  return obj;
} ); // create_obj

}