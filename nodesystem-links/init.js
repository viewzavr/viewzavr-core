// дает функцию setup(m) которая
// наполняет указанный объект m свойствами node-системы, а именно

//import setup_links from "./links-are-objects.js";
import setup_refs from "./param-references.js";

//////

export default function setup(m) {

//  setup_links( m );
  setup_refs( m );

  return m;
}
