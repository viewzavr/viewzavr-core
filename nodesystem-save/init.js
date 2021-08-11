// дает функцию setup(m) которая
// наполняет указанный объект m свойствами node-системы, а именно
// * m.create_obj для создания объектов, имеющих древовидность и параметры
// * m.root - корневой объект

// на вход ничего не требует


import setup_dump_load from "./dump-load.js";
//import setup_dump_distinct from "./feature-dump-only-distinct.js";
import setup_dump_manual from "./feature-dump-only-manual.js";

//////

export default function setup(m) {

  setup_dump_load( m );
  //setup_dump_distinct( m );
  setup_dump_manual( m );

  return m;
}
