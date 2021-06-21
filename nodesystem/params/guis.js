// добавляет понятие элементов управления к x
// 

export default function setup(x) {

  x.guis = {};
  
  // need this to remove circluar ref (when gui record holds ref to owner obj)
  x.chain("remove",function() {
    x.guis = {};
    this.orig();
  });

  x.addGui = function(rec) {
    if (!rec.fn) rec.fn = function() {};
  
    rec.setValue = function(val) {
      rec.value = val;
      rec.fn( val );
    }

//  возможно, это все стоит связать с опциями параметра, т.е. setParamOption
//    rec.set = function( optionname, value ) {
//      rec[optionname] = value;
//    }

    x.guis[ rec.name ] = rec;
    return rec;
  };
  
  x.removeGui = function(name) {
    delete x.guis[ name ];
  }

  x.addSlider = function (name, value, min, max, step, fn) {
    return x.addGui( { type: "slider", name: name, value: value, min: min, max: max, step: step, fn: fn } );
  }
  x.addCombo = function(name, value, values, fn) {
    return x.addGui( { type: "combo", name: name, value: value, values: values, fn: fn } );
  };
  x.addComboString = function(name, value, values, fn) {
    return x.addGui( { type: "combostring", name: name, value: value, values: values, fn: fn } );
  };
  
  x.addCmd = function( name, fn ) {
    return x.addGui( { type: "cmd", name: name, fn: fn });
  };
  
  x.addColor = function( name, value, fn ) {
    return x.addGui( { type: "color", name: name, value: value, fn: fn });
  };
  x.addCheckbox = function( name, value, fn ) {
    return x.addGui( { type: "checkbox", name: name, value: value, fn: fn });
  };

  x.addText = function( name, value, fn ) {
    return x.addGui( { type: "text", name: name, value: value, fn: fn });
  };

  x.addString = function( name, value, fn ) {
    return x.addGui( { type: "string", name: name, value: value, fn: fn });
  };
  
  x.addLabel = function( name, value, fn ) {
    x.setParamOption( name,"internal",true ); // R-DO-NOT-SAVE-LABEL-VALUE
    return x.addGui( { type: "label", name: name, value: value, fn: fn });
    //return x.addGui( { type: "label", name: name, value: value, fn: fn, forceUseGuiValue: true });
  };
//  x.addUrl = function( name, value, fn ) {
//    return x.addGui( { type: "url", name: name, value: value, fn: fn });
//  };
  x.addFile = function( name, value, fn ) {
    return x.addGui( { type: "file", name: name, value: value, fn: fn });
  };
  
  x.addArray = function( name, value, text_formating_options, fn ) {
    //x.setParam( name,value );
    //x.setParamOption( name,"internal",true );
    return x.addGui( { type: "array", name: name, value: value, fn: fn, columns_count: text_formating_options });    
    //return x.addGui( { type: "text", name: name, value: value, fn: fn });
  };

  return x;
}
