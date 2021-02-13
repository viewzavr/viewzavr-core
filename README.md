# viewzavr-core
a viewzavr core library - objects and their properties, tree, types

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
