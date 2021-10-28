// найти объекты 
/* критерий это текст, устроенный как набор строк, разделенных переводом или символом | вида:
     [маска-пути] [список-фич]
     [маска-пути] [список-фич]
     [маска-пути] [список-фич]

     в результате будут выбраны объекты удовлетворяющие какой-либо строке (то есть между строками операция ИЛИ)
     внутри одной строки:
       маска-пути это маска вида ** / *objname* / * в которой * заменяется на любые символы кроме /, а ** на любые символы
       список-фич это набор слов вида @featurename1 @featurename2 разделенных пробелами.
     тест строки проверяет путь объекта и его принадлежность ВСЕМ указанным фичам (то есть операция И)
*/

// кстати можно разбить на две - подготовка критериев и собственно поиск (компиляция условия и поиск по нему)
// по аналогии с regexp получится, прикольно. var finder = compile(text) finder.find( root, .... )
export function findObjects( root, criteria_text ) {
      let acc = [];
      if (!criteria_text || criteria_text.length === 0) return acc;

      let lines = criteria_text.split(/[\n|]+/);
      let or_criterias = lines.map( line => tocrit(line) )

      function tocrit( line ) {
         var parts = line.trim().split(/\s+/);
         var and_tests = [];
         
         if (parts[0] && parts[0][0] != "@") {
            // это путь
            var regexp_string = parts[0].replaceAll("**",".+").replaceAll("*","[^\/]+")
            var re = new RegExp( regexp_string );
            and_tests.push( (obj) => {
              //console.log("HHHHHHHHHH obj.getPath()=",obj.getPath(),re,re.test( obj.getPath() ))
              return re.test( obj.getPath() ) 
            })
            parts.shift();
         }

         var need_features = [];
         for (let p of parts) {
            if (p[0] == "@")
                need_features.push( p.slice(1) );
         }
         if (need_features.length > 0)
            and_tests.push( function(obj) { 
              for (let f of need_features)
                if (!obj.is_feature_applied(f)) return false;
              return true;
            })

         let result = function(obj) {
             for (let t of and_tests)
               if (!t(obj)) return false;
             return true;
         }
         return result;
      }

      traverse_if( root, (obj) => {
        if (matching(obj,or_criterias)) {
           acc.push( obj );
           //return false
        }
        return true;
      });

      function matching( obj,criterias ) {
        for (let cr of criterias)
          if (cr(obj)) return true;
        return false;
      }

      // console.log("find-objects: criteria=",criteria, "result=",acc );

      return acc;
};

// поиск - обход всех детей с вызовом fn
function traverse_if( obj, fn ) {
  if (!fn( obj )) return;
  var cc = obj.ns.getChildren();
  for (var cobj of cc) {
    traverse_if( cobj,fn );
  }
}

/*
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
*/

export function trackObjects( root, finder_func, cb ) {
  function rescan2() {
    let acc = finder_func(root);
    cb(acc);
  }

  var rescan = delayed(rescan2, 25); // поставим задержку и отсечение дублей
  rescan();

  var f3 = root.on("change_in_tree", rescan);
  return f3;
}

/////////////////////////////////////////////////////////////////////
export function addObjects(obj, name,criteria_text,cb,desired_root) {
  let unsubscribe;
  let removed;

  obj.addText(name,criteria_text,(v) => {
     if (unsubscribe) unsubscribe();
     unsubscribe = trackObjects( desired_root || obj.findRoot(),
        function(root) {
          return findObjects( root, v );
        },
        (acc) => {
          if (!removed) // фича не посылать cb удаленному объекту
            cb( acc );
       } )
  });
  obj.signalParam(name); // чтобы начала шевелиться

  obj.on("remove",() => {
    if (unsubscribe) unsubscribe(); unsubscribe = null;
    removed = true;  
  })
}

/////////////////////////////////////////////////////////////////////   

function delayed( f,delay=0 ) {
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

export function find_by_criteria( obj ) {
  obj.findObjects = findObjects;
  obj.trackObjects = trackObjects;
  obj.addObjects = addObjects.bind( undefined, obj );
}

export function setup( vz,me ) 
{
  vz.register_feature_set( {find_by_criteria})   
}