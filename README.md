# viewzavr-core
a viewzavr core library - objects and their properties, tree, types

# Object creation and types

## vz.createObj( options )
creates new Viewzavr object.
possible options are:
* name - a name of object.
* parent - parent object this new object.

Example:
```
  var myobj = vz.createObj({ name:"my", parent: someotherobj})
```

## vz.createObjByType( options )
creates new Viewzavr object of specified type.
options are save as in *createObj* with addition:
* type - a type of object

Example:
```
  var myobj = vz.createObjByType({ parent: someotherobj, type: "bg-image"})
```

# Parameters

# Gui

# Events

# Parameters

## addObjectRef

Adds a parameter that is reference to another object. Viewzavr will track and clear reference if referred object is removed.

Example:
```
  obj.addObjectRef("otherobj","/",function(v) {
    var otherobj = obj.vz.find_by_path( obj, v );
  });
```