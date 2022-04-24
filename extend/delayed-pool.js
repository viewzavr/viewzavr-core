// тестовая реализация delayed на очередях

// todo: идея - сделать так, чтобы если окружение удалено, то таймер бы его не вызывался
// это избавило бы нас от проверок лишних в обработчиках

export function setup( vz,me ) {
  vz.register_feature_set( me ); // получается вот этот вызов это есть сухожилия. соединение местного с системой. регаем фичи = добавляем в таблицу системы записи.
}

window.requestAnimationFrame( tick );

var qnext = [];

function tick() {
  window.requestAnimationFrame( tick );
  // надо вначале зарядить а то потом по ошибкам повалимся и все цикл остановится

  // гипотеза что 1 обхода не хватает и надо побольше. вроде 2 норм (проверял по работе гуи на ноуте)
  for (let i=0; i<2; i++)
    process_recs();
}

function process_recs() {
  if (qnext.length > 0) {
      //console.log("AF.stat",qnext.length);
      //console.log( qnext.map( it => it.funchint ))
  }    

  var q = qnext;
  qnext = [];

  for (let rec of q) {
    rec.tm --;
    if (rec.tm < 0) {
      if (rec.f)
          rec.f();
    }
    else
      qnext.push( rec );
  }
}

function setTimeoutQ( func, delay, funchint ) {
  let rec = { tm: delay, f: func, funchint: funchint};
  qnext.push( rec );
  return rec;
}

function clearTimeoutQ( rec ) {
  rec.f = null;
}

///////////////////////////////////////////////


export function delayed( env ) {
  env.delayed = (f,delay=0) => _delayed(f,delay,env);
  env.delayed_first = (f,delay=0) => _delayed_first(f,delay,env);;
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