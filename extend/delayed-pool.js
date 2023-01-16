// тестовая реализация delayed на очередях

// todo: идея - сделать так, чтобы если окружение удалено, то таймер бы его не вызывался
// это избавило бы нас от проверок лишних в обработчиках

export function setup( vz,me ) {
  vz.register_feature_set( me ); // получается вот этот вызов это есть сухожилия. соединение местного с системой. регаем фичи = добавляем в таблицу системы записи.

  //vz.register_feature_map({"viewzavr-object":"delayed"}); // всем delayed
}

let request_af = typeof(window) !== "undefined" ? window.requestAnimationFrame : setImmediate;
// https://nodejs.org/ru/docs/guides/timers-in-node/

request_af( tick );

export var qnext = [];

export var callbacks = [];

function tick() {
  request_af( tick );
  // надо вначале зарядить а то потом по ошибкам повалимся и все цикл остановится

  // гипотеза что 1 обхода не хватает и надо побольше. вроде 2 норм (проверял по работе гуи на ноуте)
  // итого нонче задержка 30 это одна секунда (исходя из того что 60 кадров в секунду 
  // но на других мониторах по другому)

  let tstart = performance.now();
  for (let i=0; i<2; i++)
    if (process_recs(tstart)) break;

  // console.log("qnext.length",qnext.length) 
  callbacks.forEach( c => c() );
}

function process_recs(tstart) {
  //if (qnext.length > 0) {
      //console.log("AF.stat",qnext.length);
      //console.log( qnext.map( it => it.funchint ))
  //}

  var q = qnext;
  qnext = [];
  
  // чето браузер плачет если мы тут слишком долго тусуемся в requestAnimationFrame
  let time_is_out = false;

  for (let rec of q) {
    rec.tm --;
    if (!time_is_out && rec.tm < 0) {
      //let tbeg = performance.now();  
      if (rec.f)
          rec.f();

      let tnow = performance.now();  
      // потом поразбираться что это за расчеты
      //if (tnow - tbeg > 10) console.warn('long task',tnow - tbeg,rec.f)

      if (tnow - tstart > 15)  
      {
        time_is_out = true;
        // по идее то скопировать остаток очереди и все
        //qnext = qnext.concat( q );
        //console.log("time_is_out = true;", tnow-tstart)
      }
    }
    else
      qnext.push( rec );
  }

  return time_is_out;
}

function setTimeoutQ( func, delay, funchint ) {
  let rec = { tm: delay, f: func, funchint: funchint};
  rec.stop = () => { rec.f = null };
  qnext.push( rec );
  return rec;
}

function clearTimeoutQ( rec ) {
  rec.f = null;
}

///////////////////////////////////////////////


export function delayed( env ) {
  
  env.delayed = (f,delay=0) => _delayed(f,delay,env);

  env.delayed_first = (f,delay=0) => _delayed_first(f,delay,env);

  env.timeout = (f,delay=0) => {
    let id = setTimeoutQ( () => {
         if (!(env && env.removed)) f();
       },delay );
    return () => clearTimeoutQ(id);
  }

  env.timeout_ms = (f,delay=0) => {
    let id = setTimeout( () => {
      if (!(env && env.removed)) f();
     },delay );
    return () => clearTimeout(id);
  }

  env.repeat = (f,delay=0,tfunc) => {
    tfunc ||= env.timeout;
    let fnew = () => {
      if (dostop) return;
      f();
      tfunc( fnew, delay );
    };
    let starter = tfunc( fnew, delay );
    let dostop = false;
    starter.stop = () => { dostop = true };
    return starter;
  };

}

/////////////////////////////////////////////////////////////////////   


export function _delayed( f,delay=0, env ) {
  var t;
  var remembered_args;

  var res = function(...args) {
    remembered_args = args;
    if (t) return;
    
    t = setTimeoutQ( () => {

      // t=null; фундаментально - рестарт разрешаем только после того как все закончено..
      if (!(env && env.removed))
          f(...remembered_args);
        else {
          //console.log("delayed: cb skipped due env removed", env.getPath())
        }

      t=null;
      
    },delay,f);
  }
  res.stop = () => { if(t) clearTimeoutQ(t);t=null; };

  return res;
}

// вариант когда запоминается первая версия аргументов
function _delayed_first( f,delay=0,env ) {
  var t;

  var res = function(...args) {
    if (t) return;
    t = setTimeoutQ( () => {

      // t=null; фундаментально - рестарт разрешаем только после того как все закончено..
      
      if (!(env && env.removed))
        f(...args);

      t=null;

    },delay);
  }
  res.stop = () => { if(t) clearTimeoutQ(t);t=null; };

  return res;
}