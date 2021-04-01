// дает функцию setup(m) которая
// наполняет указанный объект m свойствами node-системы, а именно
// * m.create_obj для создания объектов, имеющих древовидность и параметры
// * m.root - корневой объект

// на вход ничего не требует


import setup_types from "./types3.js";
import setup_cats from "./cats.js";

//////

export default function setup(m) {

  setup_types( m );
  setup_cats( m );

  return m;
}
