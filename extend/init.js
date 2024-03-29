import E from "./extend-viewzavr.js";
import * as F1 from "./vz-extras-2.js";
import * as F2 from "./criteria-finder.js";
import * as D1 from "./delayed-pool.js";
import * as S1 from "./scopes.js";
import * as AH from "./action-history.js";
import * as LC from "./links-as-channels.js";
//import * as L from "./console-log-diag.js";

export default function setup( vz ) {
  E( vz );
  F1.setup( vz, F1 );
  F2.setup( vz, F1 );

  D1.setup( vz, D1 );
 
  S1.setup( vz, S1 );

  AH.setup( vz, AH );

  LC.setup( vz, LC );

  //L.setup( vz, L );
}