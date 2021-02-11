// добавляет понятие элементов управления к x
// 

export default function setup(x) {

  x.guis = {};

  x.addGui = function(rec) {
    rec.setValue = function(val) {
      rec.value = val;
      if (rec.fn) rec.fn( val );
    }

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
  x.addLabel = function( name, value, fn ) {
    return x.addGui( { type: "label", name: name, value: value, fn: fn });
  };
//  x.addUrl = function( name, value, fn ) {
//    return x.addGui( { type: "url", name: name, value: value, fn: fn });
//  };
  x.addFile = function( name, value, fn ) {
    return x.addGui( { type: "file", name: name, value: value, fn: fn });
  };

  return x;
}
