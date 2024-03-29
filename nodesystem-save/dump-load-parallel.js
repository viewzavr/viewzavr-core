import * as FT from "../extend/feature-tools.js";

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

  
  m.createSyncFromDump = function( dump, _existingObj, parent, desiredName, manualParamsMode,cb )
  {
    // выяснилось что у нас могут на промисах шпарить создание детей вовсю, когда объект уже решили удалить
    if (parent && parent.removed) {
      return Promise.resolve("parent_removed");
    }
    /*
    if (parent) {
      let root = parent.findRoot();
      if (root.getPath().split("/").length > 2)
         debugger;
    }
    */

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

    if (cb) cb(obj)
    // в dump должно быть поле type, оно нам все и создаст что надо

    // F-FEAT-PARAMS
    if (dump.feature_of_env) {
      obj.hosted = true;
      obj.host = dump.feature_of_env;
    } else {
      obj.hosted = false;
      obj.host = obj;
    }

    // F-LEXICAL-PARENT
    if (dump.lexicalParent)
      obj.lexicalParent = dump.lexicalParent;

    // неописанное еще приключение
    if (dump.$name) {
      obj.$env_extra_names ||= {};
      obj.$env_extra_names[ dump.$name ] = true;
    };


    /// походу надо параметры до фич таки.. но тогда непонятно что есть restorefromdump...

    let p1 = m.restoreFeatures( dump, obj, manualParamsMode );
    // таким образом фичи имеют возможность заменить obj.restoreFromDump
    // и стать функторами
          if (obj.removed)
            debugger;

    
    return new Promise( function (resolve, reject) {

        p1.then( () => {

          if (obj.removed) {
            // уже удалили пока мы ево делали
            //debugger;
            console.error("createSyncFromDump: object is removed, between create && restoreFromDump stages.", obj.getPath())
            resolve( obj );
            return;
            
          }

          obj.restoreFromDump( dump,manualParamsMode ).then( (res) => {
            // @exp - тпу когда фичи все из описания применены, и параметры, и дети
            if (!_existingObj) {
              obj.emit("cocreate");
            }; // idea и еще emit("synced");
            resolve( obj );
          }).catch( (err) => {
            reject( err );
          })

        }); // фичи восстановились
    })
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

    // F-FEAT-PARAMS
    if (dump.feature_of_env) {
      obj.hosted = true;
      obj.host = dump.feature_of_env;
    } else {
      obj.hosted = false;
      obj.host = obj;
    }

    // F-LEXICAL-PARENT

    if (dump.lexicalParent)
      obj.lexicalParent = dump.lexicalParent;

    // неописанное еще приключение
    if (dump.$name) {
      obj.$env_extra_names ||= {};
      obj.$env_extra_names[ dump.$name ] = true;
    }      

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

      let v = h[name];

      // фишка. v это у нас общее описание на уровне dump.
      // если мы туда прописываем lexicalParent то мы пишем в общую запись
      // это надо специальным образом как-то зарешать

      // F-LEXICAL-PARENT
      // здесь происходит назначение "лексического родителя" в dump-описания окружений, хранимых в параметрах
      let bemanual = manualParamsMode;
      if (v?.needLexicalParent) {
         //v.lexicalParent = obj;
         if (Array.isArray(v)) // там список окружений - всем назначим..
         {
            // старое for (let q of v) q.lexicalParent = obj;
            // новое - сделаем тупо, потом можно оптимизировать например создавая спец-структуру
            // вида newrecord -> lexicalparent, array..
            v = v.map(a => ({...a}));
            for (let q of v) q.lexicalParent = obj;
            //v.this_is_env_list_description = true;  
            bemanual=false;
         }
       }

      obj.setParam( name, v, bemanual ); // ставим true - в том смысле что это установка из

      // F-LINKS-OVERWRITE
      // удалить ссылки пишушие в этот параметр... типа мы тут со значением пришли...
      // и с учетом что у нас все снизу вверх теперь раскрывается - это сработает
      // и плюс уже учтено keepExistingParams
      if (obj.hasLinksToParam( name )) {
          let larr = obj.linksToParam( name );
          for (let l of larr)
            l.remove();
      }
      
    });

    ///// особый случай - параметры значение которых это список окружений
    // им надо выставить lexicalParent

/*
    var h = dump.env_list_params || {};
    var keys = Object.keys(h);
    keys.forEach( function(name) {
      //console.log("setting param",name,h[name]);

      // F-KEEP-EXISTING-PARAMS
      if (dump.keepExistingParams && obj.hasParam( name )) return;

      let v = h[name];
      v.lexicalParent = obj;

      obj.setParam( name, v, manualParamsMode ); // ставим true - в том смысле что это установка из
    });
*/
    
  }

  // цель - активировать в окружении новую фичу, определенную в dump
  // отличие в том, что там не просто имя, а целое новое под-окружение
  // и мы не можем создать сначала под-окружение а потом его прицепить
  // потому что при создании происходит активация фич, и им уже надо знать
  // что они активируются в режиме аттача к основному новому окружению..
  m.importAsParametrizedFeature = function( dump,obj ) {
     // todo заменить это все на работу с деревом..
     dump.feature_of_env = obj;
     dump.keepExistingChildren = true; // без этой штуки оно начинает стирать своих собственных детей

     //fr.keepExistingChildren = true; // странно это все...

     let prom = m.createSyncFromDump( dump, null, null, dump.$name );

     return new Promise( (resolve,reject) => {

       prom.then( (feature_obj) => {

         //arr.push( feature_obj );
         //feature_obj.lexialParent = obj;
         //feature_obj.master_env = obj;
         //obj.feature_
         // todo надо бы их в дерево посадить... тем более там по именам потом захочется ходить..

         // вот здесь получается что мы вырубаем x-on "remove"... todo
         // мбыть сделать on_prepend = добавить в начало очереди...
         let forget_that = obj.on("remove",() => {
            forget_that = () => {};
            feature_obj.remove();
         });

         // $feature_name затем используется... выяснить какую семантику я в него вложил..
         feature_obj.$feature_name = dump.$name || "some_feature"; /// ......

         obj.$feature_list_envs ||= [];
         obj.$feature_list_envs.push( feature_obj );
         obj.$feature_list_envs_table ||= {};

         let kname = feature_obj.$feature_name;
         while (obj.$feature_list_envs_table[kname]) {
            // @todo это место пипец конечно.. надо под-окружения уникальные создавать или типа того..
            //console.warn("$feature_list_envs_table DUPLICATE DETECTED, $feature_name=",kname)
            kname = kname + "_x";
            //console.warn("renamed to",kname);
         }
         obj.$feature_list_envs_table[kname] = feature_obj;
         // надо бы запомнить, как мы ее запомнили..
         feature_obj.$feature_name = kname;

         // протокол F-NEW-MODIFIERS-FTREE
         let detach_code = feature_obj.emit("attach",obj)
         // времянка некая..  
         /*
         let feature_obj_got_attached_signal = false;
         if (!(feature_obj.hasParam("input") || feature_obj.hasLinksToParam("input"))) {
             feature_obj.emit("attach",obj)
             feature_obj_got_attached_signal = true;
         }
         */

         // если фичу просто так удалять будут - надо освободить родителя
         feature_obj.on("remove",() => {
          forget_that()

          // протокол F-NEW-MODIFIERS-FTREE
          feature_obj.emit("detach",obj);
          //if (feature_obj_got_attached_signal)
          //    feature_obj.emit("detach",obj);
          // detach_code();

          if (!obj.removed) {
             // почистить таблицу еще надо
             // по сути мы тут children-таблицу заново пишем.. эх
             delete obj.$feature_list_envs_table[kname];
             let myindex = obj.$feature_list_envs.indexOf( feature_obj );
             if (myindex >= 0) obj.$feature_list_envs.splice( myindex,1 );
          }
         });

         resolve( feature_obj );
       });  
     
     //return feature_obj;
     });
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

    // есть идея - применять фичи после {{ }}- фич
    // это позволит навесить всякие on-обработчики до появления каких-либо событий внутри
    let feat_arr = [];

    for (let fn of Object.keys(dump.features || {})) 
    {
      // тут считается что feature-code совпадает с feature-name
      // в целом же наверняка это можно расширить до того что код нескольких фич может совпадать.
      // но это надо тогда будет учесть и feature-tools (там отсекается повторное применение фич с одинаковым кодом)
      let r = obj.feature( fn, dump.features[fn].params );
      feat_arr.push( Promise.resolve( r ));
    }

    // белковый представитель manual-features
    // важно эти фичи восстанавливать на 1м проходе, т.к. далее идет присвоение manual_features
    // и сообразно фичи начинают применяться без промисов, а на 2м проходе - они уже считаются примененными и промисов не собрать
    // поэтому мы тут хаком - влазим и применяем не дожидаясь.
    // но вообще - надо по уму что-то другое делать с manual-features-ами. возможно это 
    // вручную набранные модификаторы (скорее всего это они)
    
    if (dump.params?.manual_features) {
      let mf = FT.feature_names_to_arr( dump.params.manual_features );
      //if (!Array.isArray(mf)) mf = [mf];
      for (let fn of mf)
      {
        // тут считается что feature-code совпадает с feature-name
        // в целом же наверняка это можно расширить до того что код нескольких фич может совпадать.
        // но это надо тогда будет учесть и feature-tools (там отсекается повторное применение фич с одинаковым кодом)
        let r = obj.feature( fn );
        feat_arr.push( Promise.resolve( r ));
      }
    }

    // а теперь фиче-листы... F-FEAT-PARAMS
    // restoreFeatures вызывается многократно, и если от однократных фич у нас есть защита то тут нет
    obj.features_list_is_restored ||= new Set();
    if (!obj.features_list_is_restored.has(dump.features_list)) {
      //var arr = [];
      for (let fr of (dump.features_list || [])) 
      {
         let r2 = m.importAsParametrizedFeature( fr, obj );
         feat_arr.push( Promise.resolve( r2 ) );
      }
      obj.features_list_is_restored.add( dump.features_list ) ;
      //obj.$feature_list_envs = (obj.$feature_list_envs || []).concat( arr );
      // тут бы списочег...
      //obj.setParam("feature_list_envs",arr);
    }

    return Promise.all( feat_arr );
  }

  m.restoreLinks = function( dump, obj ) {
    for (var lname of Object.keys(dump.links || {})) {
      
      var lrec = dump.links[lname];
      var arr = lrec.to.split("->");
      if (arr[0] == "." || arr[0] == "~") {
        //console.log("cre-link-to",lrec, obj.getPath()) 
        if (dump.keepExistingParams) {
          // особый режим сохранения уже существующих параметров
          // проблема что hasLinksToParam заработает только при активации ссылки, которая у нас отложенная...
          // F-LINKS-OVERWRITE
          if (obj.hasLinksToParam( arr[1] ) || obj.hasParam( arr[1] )) {
              //console.log("orig link is kept - keepExistingParams")
              continue;
          }
        }
        // разделяем ситуацию куда же нам направить местную ссылку - на себя (на фичу) или на главное окружение

        obj.createLinkTo( {param: arr[1], 
                           from: lrec.from,
                           name: "arg_link_to", 
                           target_host_env: (arr[0] == "."),
                           soft_mode: lrec.soft_mode 
                         } );
      }
      else
      {
        //console.log("arg-link-to",lrec, obj.getPath())
        m.createLink( {parent: obj, name: "arg_link"});
        m.setParam("soft_mode",lrec.soft_mode);
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
    let feature_promise = m.restoreFeatures( dump, obj,manualParamsMode );
    // тут идет дублирование restoreFeatures с createSyncFromDump, но ничего, мы переживем.

    if (dump.manual) {
      manualParamsMode = true; // такой вот прием.. а то "ручные объекты" потом не сохранить получается..
    };  
    if (manualParamsMode) { // детей сделали - тыркнем объект что вот, восстановились
       // а причем важно это сделать тут так как - там среди детей могет создаться монеторер
       // этого события
       //console.log("emitting manual-restore for",obj.getPath())
       //obj.emit("manual-restore");
       obj.setParam("manual_restore_performed",true);
    }

    return new Promise( (resolve,reject) => {
       feature_promise.then( () => {
          let rc = obj.restoreChildrenFromDump( dump, manualParamsMode );
          rc.then( () => {
             resolve( obj );
          });
       })
    })

    //let rc = obj.restoreChildrenFromDump( dump, manualParamsMode );
    //return Promise.all( feature_promise,rc );
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

/*
  восстанавливает детей объекту из дампа
  требования: 
    * при восстановлении сохранить порядок детей
    * вернуть промису которая разрезолвится когда работа будет готова

  новое: раздельный порядок восстановления: F-DEFINED
    * сначала все load и register_feature
    * а затем все остальное

  todo оптимизировать - на тему чтобы load несколько параллельно загружались
*/ 
  m.createChildrenByDump = function( dump, obj, manualParamsMode )
  {
    var c = dump.children || {};
    var ckeys = Object.keys( c );

    var result_p = new Promise( (resolv, reject) => {

      restore( 0,0 );

      function restore( i, priority, prev=[] ) {
        if (i == ckeys.length) {
          if (priority == 0) {
            // дожидаемся всех load-ов
            Promise.all( prev ).then( () => {
               return restore( 0,1 ); // переходим на второй этап  
            })
          }
          else {
            // теперь созданы все чайлды. их надо отсортировать
            //return resolv( obj );
            Promise.allSettled( prev ).then( (arr_of_objects_res) => {
             // тех что уже были в объекте - считаем на первом месте

             // не катит этот алгоритм, т.к. там уже они могли доп-объектов насоздавать..
             // по идее надо в парента потом прицеплять, или что..
             // ну или забивать на, а если важен порядок то заморачиваться им отдельно..
             var sorted = obj.ns.getChildren().sort( (a,b) => {
                if (a.i < b.i) return -1;
                if (a.i > b.i) return 1;
                return 0;
                //return a.i - b.i;
             })

             obj.ns.setChildren( sorted );

             resolv( obj );
          });

          }

          return;
        }
        name = ckeys[i];

        var child_dump = c[name];

        // если 
        
        let feats = child_dump.features || {};
        let item_priority = (feats.load || feats.feature || feats.register_feature) ? 0 : 1
        if (priority != item_priority)
          return restore( i+1, priority, prev );

        var cobj = obj.ns.getChildByName( name );
        if (!c[name].manual && !cobj && !c[name].forcecreate) {
          // ситуация когда объект должен был быть создан автоматически - но его нет!
          console.error("load_from_dump: no child of name found! name=",name,"obj=",obj);
          //promises_arr.push( Promise.reject() );
          return restore( i+1, priority, prev );
        }

        
        if (dump.keepExistingChildren)
            child_dump.keepExistingChildren = dump.keepExistingChildren;

        if (dump.keepExistingChildren) cobj = null; // R-NEW-CHILDREN

        var r = m.createSyncFromDump( child_dump, cobj, obj, name, manualParamsMode,(cobj) => {
          cobj.i = i;
        } );
        // todo вернуть оптимизацию
        /*
        //if (priority == 0)
        r.then( () => {
           restore( i+1, priority );
        });
        */
        //return Promise.all( r, restore( i+1, priority ) );
        prev.push(r);
        restore( i+1, priority, prev );
        
        // the only way to catch errors is here, allSettled will ignore that error
        r.catch( (err) => {
          console.error("createChildrenByDump: error! parent=",obj.getPath(),"child_dump=",child_dump,"error=",err );
          // и че.. по идее надо все-равно вызывать следующих... или вызовется?
        });        

      }; // функция restore

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

          if (v == null) return;

          if (typeof(v) === "string" && v.length > 10000) {
            console.error("dumpObj: because value too long, dump will not save param ",name,"of obj",obj.getPath());
            return;
          }

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

  // @compolang @todo @design - почему вот это нельзя было бы в параметры то перетащить?
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

  // выделяем восстановление детей в отдельный метод в контексте obj
  // чтобы фичи объекта могли успеть его поменять (конкретно это надо было для repeater)
  obj.restoreChildrenFromDump = (dump, ismanual) => {
      if (!dump.keepExistingChildren)
          m.removeChildrenByDump( dump, obj, ismanual );
      return m.createChildrenByDump( dump, obj, ismanual );
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