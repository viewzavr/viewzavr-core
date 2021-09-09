import a2 from "./find-obj.js";
import * as p from "./prepend.js";


export default function setup(m) {
  a2(m);
  
  m.tools = p; // возможно потом разобью
}