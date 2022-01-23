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

    // F-FEAT-PARAMS
    if (dump.feature_of_env) {
      obj.hosted = true;
      obj.host = dump.feature_of_env;
      // obj.master_env = dump.feature_of_env;
      //obj.lexicalParent = dump.feature_of_env;
    }
    else
      obj.host = obj;

    m.restoreFeatures( dump, obj );
    // таким образом фичи имеют возможность заменить obj.restoreFromDump
    // и стать функторами

    obj.restoreFromDump( dump );
    return obj;
  }


  m.restoreParams = function ( dump, obj, manualParamsMode) {
    if (dump.manual) manualParamsMode = true; // такой вот прием.. а то "ручные объекты" потом не сохранить получается..

    var h = dump.params || {};
    var keys = Object.keys(h);
    keys.forEach( function(name) {
      //console.log("setting param",name,h[name]);

      // F-KEEP-EXISTING-PARAMS
      if (dump.keepExistingParams && obj.hasParam( name )) return;

      obj.setParam( name, h[name], manualParamsMode ); // ставим true - в том смысле что это установка из
    });
  }

  m.createSyncFromDump = m.createSyncFromDumpNow;

  // цель - активировать в окружении новую фичу, определенную в dump
  // отличие в том, что там не просто имя, а целое новое под-окружение
  // и мы не можем создать сначала под-окружение а потом его прицепить
  // потому что при создании происходит активация фич, и им уже надо знать
  // что они активируются в режиме аттача к основному новому окружению..
  m.importAsParametrizedFeature = function( dump,obj ) {
     // todo заменить это все на работу с деревом..
     dump.feature_of_env = obj;

     //fr.keepExistingChildren = true; // странно это все...
     let feature_obj = m.createSyncFromDumpNow( dump, null, null, dump.$name );
     //arr.push( feature_obj );
     //feature_obj.lexialParent = obj;
     //feature_obj.master_env = obj;
     //obj.feature_
     // todo надо бы их в дерево посадить... тем более там по именам потом захочется ходить..
     obj.on("remove",() => {
        feature_obj.remove();
     });

     // $feature_name затем используется...
     feature_obj.$feature_name = dump.$name || "some_feature"; /// ......

     obj.$feature_list_envs ||= [];
     obj.$feature_list_envs.push( feature_obj );
     obj.$feature_list_envs_table ||= {};

     let kname = feature_obj.$feature_name;
     while (obj.$feature_list_envs_table[kname]) {
        console.warn("$feature_list_envs_table DUPLICATE DETECTED, $feature_name=",kname)
        kname = kname + "_x";
        console.warn("renamed to",kname);
     }
     obj.$feature_list_envs_table[kname] = feature_obj;
  }

  m.restoreFeatures = function ( dump, obj) {
    
    // получается что здесь происходит повторный вызов obj.feature
    // (первый в конструкторе объекта за счет опций .features)
    // пока отменим тут 

    // нет не отменим. применение фич на этапе конструкции объекта оказалось тем странно, что
    // фичи применяются вперед, на самом базовом createObj

    // таки отменим.. пусть они там уж применяются
    //return;

    // нет не отменим
    // потому что мы применяем здесь фичи из функтора восстановления из дампа (compalang)

    for (let fn of Object.keys(dump.features || {})) 
    {
      // тут считается что feature-code совпадает с feature-name
      // в целом же наверняка это можно расширить до того что код нескольких фич может совпадать.
      // но это надо тогда будет учесть и feature-tools (там отсекается повторное применение фич с одинаковым кодом)
      obj.feature( fn, dump.features[fn].params );
    }

    // а теперь фиче-листы... F-FEAT-PARAMS
    // restoreFeatures вызывается многократно, и если от однократных фич у нас есть защита то тут нет
    obj.features_list_is_restored ||= new Set();
    if (!obj.features_list_is_restored.has(dump.features_list)) {
      //var arr = [];
      for (let fr of (dump.features_list || [])) 
      {
         m.importAsParametrizedFeature( fr, obj );
      }
      obj.features_list_is_restored.add( dump.features_list ) ;
      //obj.$feature_list_envs = (obj.$feature_list_envs || []).concat( arr );
      // тут бы списочег...
      //obj.setParam("feature_list_envs",arr);
    }

  }

  m.restoreLinks = function( dump, obj ) {
    for (var lname of Object.keys(dump.links || {})) {
      
      var lrec = dump.links[lname];
      var arr = lrec.to.split("->");
      if (arr[0] == "." || arr[0] == "~") {
        if (dump.keepExistingParams) {
          // особый режим сохранения уже существующих параметров
          // проблема что hasLinksToParam заработает только при активации ссылки, которая у нас отложенная...
          // F-LINKS-OVERWRITE
          if (obj.hasLinksToParam( arr[1] ) || obj.hasParam( arr[1] )) continue;
        }
        // разделяем ситуацию куда же нам направить местную ссылку - на себя (на фичу) или на главное окружение

        obj.createLinkTo( {param: arr[1], from: lrec.from, name: "arg_link_to", target_host_env: (arr[0] == ".") } );
      }
      else
      {
        m.createLink( {parent: obj, name: "arg_link"});
        m.setParam("to",lrec.to);
        m.setParam("from",lrec.from);
        // крайне важно давать имена тут ссылкам (типа arg_...) потому что иначе они смешиваются со ссылками
        // задаваемыми через children и начинают с ними конфликтовать по именам (перезаписывают их)
      }
    }
  }
  
  // this is made specially so obj.restoreFromDump may be overriden
  m.restoreObjFromDump = function( dump, obj, manualParamsMode ) {
    m.restoreParams( dump, obj,manualParamsMode );
    m.restoreLinks( dump, obj,manualParamsMode );
    m.restoreFeatures( dump, obj,manualParamsMode );
    // тут идет дублирование restoreFeatures с createSyncFromDump, но ничего, мы переживем.

    if (dump.manual) manualParamsMode = true; // такой вот прием.. а то "ручные объекты" потом не сохранить получается..

    // выделяем восстановление детей в отдельный метод в контексте obj
    // чтобы фичи объекта могли успеть его поменять (конкретно это надо было для repeater)
    obj.restoreChildrenFromDump ||= (dump, ismanual) => {
      if (!dump.keepExistingChildren)
          m.removeChildrenByDump( dump, obj, ismanual );
      return m.createChildrenByDump( dump, obj, ismanual );
    }

    return obj.restoreChildrenFromDump( dump, manualParamsMode );
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
    
    //var actual_children_table
    var result_p = [];
    ckeys.forEach( function(name) {
      var cobj = obj.ns.getChildByName( name );
      if (!c[name].manual && !cobj && !c[name].forcecreate) {
        // ситуация когда объект должен был быть создан автоматически - но его нет!
        console.error("load_from_dump: no child of name found! name=",name,"obj=",obj);
        return;
      }

      /// история из keepExistingChildren по сохранению объектов-детей, которые уже созданы другими фичами
      /// данного окружения. мысль - распространяем keepExistingChildren на все восстанавливаемое поддерево.
      var child_dump = c[name];
      if (dump.keepExistingChildren)
          child_dump.keepExistingChildren = dump.keepExistingChildren;

      if (dump.keepExistingChildren) cobj = null; // R-NEW-CHILDREN

      var r = m.createSyncFromDump( child_dump, cobj, obj, name, manualParamsMode );
      result_p.push(r);
    });

    //return Promise.allSettled( promises_arr );

    // теперь у нас ситуация что есть входящий список детей, и их экземпляры
    // и есть текущий список детей внутри объекта
    // и надо чтобы порядок текущего списка соответствовал входящему списку

/*
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
*/    

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