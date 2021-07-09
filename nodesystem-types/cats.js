/////////////// adds categories of types into nodesystem

// m.addItemType(code,title,initfn,opts)
// opts may contain field "cat"

// vz.getCats() -> various cat field values
// vz.getTypesByCat(category) -> list of codes (types) of that category

export default function setup( vz ) {

var cats_dic = {};

  vz.tools.chain( vz,"addItemType", function(code,title,fn,opts) {
  
    // feature: split : in title into 2
    
    if (!opts) opts = {};
    if (!opts.cat) {
      var parts = title.split(": ");
      if (parts.length >= 2) {
        title = parts[1]; // ну это никуда не уходит..
        opts.cat = parts[0].toLowerCase(); // feature: cats are lower-case
      }
    }
  
    var cat = opts && opts.cat ? opts.cat : "uncategorized";
    cats_dic[ cat ] ||= [];
    if (cats_dic[ cat ].indexOf( code ) < 0) 
        cats_dic[ cat ].push( code );

    this.orig( code, title, fn, opts );
  } );

  vz.getCats = function() {
    return Object.keys( cats_dic );
  }

  vz.getTypesByCat = function( cat ) {
    return cats_dic[ cat ] || [];
  }
  
  vz.getCatByType = function(type) {
    var opts = vz.getTypeOptions( type );
    var cat = opts && opts.cat ? opts.cat : "uncategorized";    
    return cat;
  }

} // setup

