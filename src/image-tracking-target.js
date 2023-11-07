import {Component, Type} from '@wonderlandengine/api';
import {vec3, quat, quat2, mat4} from 'gl-matrix';

const ZERO = [0, 0, 0];
const tempQuat = quat.create();
const tempQuat2 = quat2.create();
const tempVec3 = vec3.create();

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

    originalScaling = vec3.create();

    init() {
        this.arCamera.getComponent('image-tracking').registerTarget(this.targetIndex, this);
    }

    start() {
        this.onTrackingLost();
    }

    onTrackingLost() {
        /* "Hide" object */
        this.object.getScalingLocal(this.originalScaling);
        this.object.setScalingLocal(ZERO);
    }

    /* Update tracking target transformation */
    updateTrack(worldMatrix, markerWidth, _) {
        if (!worldMatrix) {
            this.onTrackingLost();
            return;
        }

        const mw = markerWidth / window.devicePixelRatio;

        mat4.getRotation(tempQuat, worldMatrix);
        quat.normalize(tempQuat, tempQuat);

        mat4.getTranslation(tempVec3, worldMatrix);
        vec3.scale(tempVec3, tempVec3, 1/mw);

        quat2.fromRotationTranslation(tempQuat2, tempQuat, tempVec3);

        this.object.setTransformLocal(tempQuat2);
        /* Anchor point should be the marker center */
        const c = window.devicePixelRatio/2;
        this.object.translateObject([c, c, 0]);

        this.object.setScalingLocal(this.originalScaling);
    }
}
