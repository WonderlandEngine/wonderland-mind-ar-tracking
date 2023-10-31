# wonderland-mind-ar-tracking

Integration of [mind-ar-js](https://github.com/hiukim/mind-ar-js), an
open-source image tracking framework,
for [Wonderland Engine](https://wonderlandengine.com/).

## Setup

The fastest setup can be achieved by copying one of the [examples](#examples)
and adjusting it for you use case.

### Create a Marker

Prepare target images and compile them into `.mind` file using the
[mind-ar-js compiler tool](https://hiukim.github.io/mind-ar-js-doc/tools/compile).

### Project Setup

With a new Wonderland Engine project, follow these steps for setup:

1. `npm i --save @wonderlandengine/mind-ar-tracking`
2. Disable VR in `Views > Project Settings > VR & AR`

#### Tracking Camera

Set up the camera to receive tracking results:

4. Right-click "root", `Add Object > View (Camera)`, optionally renamed it to `AR Camera`.
5. Attach a new component `image-tracking` to this object.
6. Set the `mindPath` parameter to the path of the compiled MindAR target file, i.e. `targets.mind` file.
   For example, you can put the `targets.mind` file into a `static` folder under the root directory,
   and then set his parameter to `targets.mind`.

#### Camera Plane

Setup the camera feed in the background:

7. For the video plane, add a new child object `Mesh` on `AR Camera`. Optionally renamed it to `Video Plane`
8. In the `mesh` component, select `Primitive Plane` as mesh.
9. Assign a material with a `Flat Opaque Textured` pipeline.
10. In the `image-tracking` component on the `AR Camera`, assign the `Video Plane` to the `videoPane` parameter.

#### Tracking Targets

11. `Right-Click > Add Object > Empty` on `AR Camera`. Optionally rename it to "Tracking Target 0".
12. Attach a `image-tracking-target` component to this object, assign the `AR Camera` object to the `arCamera` parameter.
13. `targetIndex` is the index of the target images in the `targets.mind` file. If you only have one target, it should be `0`.
    Add any content as child objects of the `Tracking Target` objects.

You can add as many targets as you want, and assign different `targetIndex` to multiple `image-tracking-target` components.

## Demo

[![Demo Video on YouTube](https://img.youtube.com/vi/0PJngMiO_tM/0.jpg)](https://www.youtube.com/watch?v=0PJngMiO_tM)

## Examples

**Minimal**: `/examples/image-tracking`

**Multiple Targets**: `/examples/image-tracking-multiple-targets`

## Roadmap

- Integration of mind-ar's face tracking feature
