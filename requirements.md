# Requirements for the project

## R-GUIVISIBLE

We need to somehome show and hide specific gui (e.g. parameters) elements according to situation.

Real case: one may select sound from preset, and also - from file in case if user
chooses preset file as "custom file", in which case a file parameter's gui should be visible
and hidden in other cases.

## R-VR-BIGFPS

A FPS information when visible should be large enought to be clearly visible for eyes.

## R-VR-FAST-MOTION

On large scenes, we need to speedup a VR person embody movement. At the same time, we need
to perform slow movemenents too (for occuratie inspection of details).
One probable solution is modes of movement, for example x5 or x50 speed when button pressed.

## R-MESH-FLATSHADING

A mesh should have gui option of flat shading. This is required for Dubins car VRML visualization.

## R-NO-ROOT

Viewzavr function should be separated from tree. Thus Viewzavr is a namespace for functions almost 
without state (only item types table). Do not know why but this is good. Probably because we do
two separate things - 1) operations on 2) objects. mm?

# Pattern cases

## P-SELECT-IMPLEMENTATION

Sometimes there are various implementation of same thing/algorythm. 
It is interesting to choose one or another in gui (parameters).
Another case is to temporary turn off some features. For example, turn off sound generation for a while
to check is it a source of laggings.

# Other

## R-TEXT-PARAMETER

We have to get a big text parameter, this is freedom for many things (scripts, lists, trees, so on).

## R-ADD-XGUI
We may support XGUi format
https://forum.xclu.dev/t/sdk-xgui-module-interface-description-language/19
https://github.com/XcluDev/Xclu/blob/master/builtin_modules/Sound/SoundOsc/description.xgui
example usage
export function create (vz, opts ) {
  var obj = vz.createObj();
  vz.loadXgui( obj,"myfile.xgui" );
  obj.track("...",....);
  return obj;
}

# R-FAST-ACCESS-TO-CHILDREN
During js coding, we need to access children of some object shortly.

## F-ITEMS
obj.items.childName probably is a good idea - as a synonym to obj.ns.childrenTable.
Todo - think same about obj.params as a valid way to access obj params.

# R-TYPE-NAMESPACES

Probably we have to deal with namespaces. E.g. adding a type should be considered as a type inside namespace of current package.

# R-OBJ-PARAMETER-RETRY

We have an obj parameter (which is a question, are we really need it).
In any case, it should return an object, not a string.
And if object is not found, retry later. Same behaviour as with links.
Probably, we also may consider obj-refs as links to obj/this implicit param
and leverage their ability to find things later.

# IDEA-FAST-PARAMS-IDEA
I tried to write obj.getParam("blabla") - probably better obj.params.blabla?
Hovewer, I also want obj.params.blabla.on( "evenname", .. ).
Probably, we should refactor obj namespaces to hold both params as object with events and param values.
Consider also React expericence here where they have super-fast access to obj state props as local vars.

# IDEA-OPTIONS-IDEA
Probably it is better to write addGui("name").min(0).max(100).step(5).value(3).onchange(fn) than addGui( "name",3,0,100,5,fn )? 
Probably in some non-obvious cases or optional options..

# R-LINKS-NO-DEFAULT-VALUE
When adding a link, it should not have a default target parameter value (it should be blank).
There were cases when adding a link - it have blank source param and some selected target param.
An obj started behaving with default value, which were not the case (program hanged).

# R-DO-NOT-SAVE-LABEL-VALUE
If one creates gui via addLabel, it should not be saved to storage.
Solution: this parameter (represented by label) should become internal.
This is because I think so (see such pattern).

# R-GUI-SKIP-LABEL-VALUE-FROM-PARAM?
Comment: R-DO-NOT-SAVE-LABEL-VALUE maybe enought
Labels should not load it's value from parameters..
During addGui, if parameter marked as internal, it should not be loaded from hash?
Or this is at least for labels?.. (labels should not in any case seems)

# R-SETREF-OBJ
We should be able to set references to objects as objects, not as strings.
e.g.:
obj.setObjRef("somename",targetobj,filterfunc,changed_event_func),
obj.getParam("somename") => object (was string)
+ obj.setParam("somename",path) should be overrided to assign obj to param value, not path.
+ system should retry to find object if it was not found at the time of setParam
+ provide backward compatibility so vz.find( path ) should work when path is passed as obj
because it was a frequent case when obj ref was string. 
=> F-PARAMDUMP-METHOD: override param dump function so it dump obj path, not string.

# R-PARAM-REF
We need to create param-ref same as obj ref. Logic of parameter recovery (object not found so on)
should be placed there (instead of links object). getParam of add-param-ref should return
value of linked parameter.

# R-RESTRICT-PARAM-REF
For usability we need to restrict list of params which may be linked to current selected param.

=> F-RESTRICT-PARAM-REF-OPTION we introduce param option `maylink` where restriction function
might be described by user. 
Example: obj.setParamOption( "paramname","maylink",(tobj,tparam) => tparam.match(/color/) );

# R-LINKS-MANUAL
Need an option for links to consider their function as setting value manually.
=> F-LINKS-MANUAL added optional parameter for links, manual_mode. Link will issue 'setParam' with it.

# R-DEFAULT-NAME-IN-TYPE
Type options should define a default name or name comment.
In other way, it may be non-user friendly to generate name only by type.