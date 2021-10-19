import E from "./extend.js";
import * as F1 from "./vz-extras-2.js";

export default function setup( vz ) {
  E( vz );
  //E1( vz );
  F1.setup( vz, F1 );
  vz.register_feature_set( F1 );
}