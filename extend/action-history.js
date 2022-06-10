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

}
