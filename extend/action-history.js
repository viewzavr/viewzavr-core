/* замысел сохранять последние действия а потом показывать их в логе если ошибка
*/

// пусть общее будет для простоты
export var records = [];

function clearrecords() {
  records=[];
};

// аддитивность!
import * as D1 from "./delayed-pool.js";
D1.callbacks.push( clearrecords );

let counter=0;

export function setup( vz )
{
  /*
  vz.history = { records: [] };
  vz.history.add = (record) = {
    vz.records.push( record );
  }
  vz.history.clear = () {
    vz.history.records = [];
  };
  */

  vz.history = {};

  // record это дбыть хеш
  vz.history.add = ( record ) => {
    record.counter = counter++;
    records.push( record )
    //records.push( [counter++].concat(record) );
  }
  vz.history.clear = () => {
    records = [];
  };

  vz.history.getall = () => {
    return records;
    // ну туду фильтр по vz
  }

  vz.history.log = () => {
    console.log('recent events:')
    console.log( vz.history.getall().slice() );
  }

  // поставим эксперимент на тему не вписывать в env функции
  // оно конечно неаддитивно но зато такты экономим ибо
  // редкая операция такто.. а на каждый энв ее запихивать..
  // но можно было бы и фичей оформить.. эх..
  // env.feature('console_log_diag'); env.console_log_diag(); ?
  vz.console_log_diag = function(env,show_history=false) {
        if (env.$locinfo)
            console.log( env.$locinfo );
        if (show_history)  
            env.vz.history.log();
  };

}
