// дает функцию setup(m) которая
// наполняет указанный объект m свойствами node-системы, а именно

import setup_links from "./links-are-objects.js";
import setup_param_refs from "./param-references.js";

//////

export default function setup(m) {

  setup_param_refs( m );
  setup_links( m );  

  return m;
}
