import {Component, Type} from '@wonderlandengine/api';
import {quat2} from 'gl-matrix';

/**
 * Make an object follow an image marker
 */
export class ImageTrackingTarget extends Component {
    static TypeName = 'image-tracking-target';
    static Properties = {
        /** Index of the marker in the 'image-tracking' marker file */
        targetIndex: {type: Type.Int},
        /** Object that holds an 'image-tracking' component to register at */
        arCamera: {type: Type.Object},
    };

    init() {
        this.arCamera.getComponent('image-tracking').registerTarget(this.targetIndex, this);
        /* "Hide" object */
        this.object.scalingLocal.fill(0);
        this.object.setDirty();
    }

    /* Update tracking target transformation */
    updateTrack(worldMatrix, markerWidth, markerHeight) {
        if (!worldMatrix) {
            /* "Hide" object => invalid tracking */
            this.object.scalingLocal.fill(0);
            this.object.setDirty();
            return;
        }

        quat2.fromMat4(this.object.transformLocal, worldMatrix);
        quat2.normalize(this.object.transformLocal, this.object.transformLocal);
        // Anchor point should be the marker center
        this.object.translateObject([markerWidth / 2, markerHeight / 2, 0]);

        const mw = markerWidth / window.devicePixelRatio;
        this.object.scalingLocal.fill(mw);
        this.object.setDirty();
    }
}
