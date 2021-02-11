// дает функцию setup(m) которая
// наполняет указанный объект m свойствами node-системы, а именно
// * m.create_obj для создания объектов, имеющих древовидность и параметры
// * m.root - корневой объект

// на вход ничего не требует


import setup_dump_load from "./dump-load.js";

//////

export default function setup(m) {

  setup_dump_load( m );

  return m;
}
