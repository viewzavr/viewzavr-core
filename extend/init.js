import E from "./extend-viewzavr.js";
import * as F1 from "./vz-extras-2.js";
import * as F2 from "./criteria-finder.js";

export default function setup( vz ) {
  E( vz );
  F1.setup( vz, F1 );
  F2.setup( vz, F1 );
}