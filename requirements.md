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
We have to support XGUi format
https://forum.xclu.dev/t/sdk-xgui-module-interface-description-language/19
https://github.com/XcluDev/Xclu/blob/master/builtin_modules/Sound/SoundOsc/description.xgui
example usage
export function create (vz, opts ) {
  var obj = vz.createObj();
  vz.loadXgui( obj,"myfile.xgui" );
  obj.track("...",....);
  return obj;
}
