import {Component, Texture, Type} from '@wonderlandengine/api';
import {mat4, vec3} from 'gl-matrix';
import {Controller} from 'mind-ar/src/image-target/controller.js';

const FacingModes = ['environment', 'user'];

/**
 * MindAR image tracking setup
 */
export class ImageTracking extends Component {
    static TypeName = 'image-tracking';
    static Properties = {
        /** Object with plane mesh for the background video */
        videoPane: {type: Type.Object},
        /** Path to the .mind file containing the marker information */
        mindPath: {type: Type.String},
        /** Maximum amount of markers to use */
        maxTrack: {type: Type.Int, default: 1},
        /** Facing mode of the user camera to get the video feed from */
        facingMode: {type: Type.Enum, values: FacingModes, default: FacingModes[0]},
    };

    init() {
        if (!navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            console.error('No media devices found.');
            this.active = false;
        }

        this.trackingTargets = [];
    }

    start() {
        this.view = this.object.getComponent('view');

        navigator.mediaDevices
            .getUserMedia({audio: false, video: {facingMode: FacingModes[this.facingMode]}})
            .then((stream) => {
                this.video = document.createElement('video');
                this.video.playsInline = true;
                this.video.srcObject = stream;
                this.video.addEventListener('loadedmetadata', () => {
                    this.video.play();
                    this.video.width = this.video.videoWidth;
                    this.video.height = this.video.videoHeight;

                    this._setupAR(this.video);
                });
            });
    }

    /** Register an 'image-tracking-target' component to follow a marker */
    registerTarget(targetIndex, target) {
        this.trackingTargets.push({targetIndex, target});
    }

    // start AR. input can be HTML image or video
    async _setupAR(input) {
        const controller = new Controller({
            inputWidth: input.width,
            inputHeight: input.height,
            maxTrack: this.maxTrack,
            filterMinCF: 0.001, // OneEuroFilter, min cutoff frequency. default is 0.001
            filterBeta: 1, // OneEuroFilter, beta. default is 1000
            missTolerance: 5, // number of miss before considered target lost. default is 5
            warmupTolerance: 5, // number of track before considered target found. default is 5

            onUpdate: (data) => {
                if (this.videoTexture) this.videoTexture.update();
                this.engine.scene.colorClearEnabled = false;

                this._updateCameraProjection();
                if (data.type === 'updateMatrix') {
                    const {targetIndex, worldMatrix} = data;

                    this.trackingTargets.forEach((t) => {
                        if (targetIndex === t.targetIndex) {
                            const [markerWidth, markerHeight] =
                                this.markerDimensions[targetIndex];
                            t.target.updateTrack(worldMatrix, markerWidth, markerHeight);
                        }
                    });
                }
            },
        });
        const {dimensions} = await controller.addImageTargets(this.mindPath);
        const texture = new Texture(this.engine, this.video);

        this.input = input;
        this.controller = controller;
        this.markerDimensions = dimensions;
        this.videoTexture = texture;

        const videoPaneMesh = this.videoPane.getComponent('mesh');
        videoPaneMesh.material = videoPaneMesh.material.clone();
        videoPaneMesh.material.flatTexture = texture;

        this.controller.processVideo(input);
    }

    /* Update camera projection matrix and background video plane */
    _updateCameraProjection() {
        const {input, controller} = this;

        if (!input || !controller) {
            return;
        }

        if (
            this.lastProjectionCanvasWidth === this.engine.canvas.width &&
            this.lastProjectionCanvasHeight === this.engine.canvas.height
        ) {
            return;
        }

        const controllerProjectionMatrix = controller.getProjectionMatrix();
        const projectionMatrix = [...controllerProjectionMatrix];

        const canvasAspect = this.engine.canvas.width / this.engine.canvas.height;
        const inputAspect = input.width / input.height;
        if (canvasAspect < inputAspect) {
            projectionMatrix[0] *= inputAspect / canvasAspect;
        } else {
            projectionMatrix[5] *= canvasAspect / inputAspect;
        }

        // put the background video to the far clipping plane
        const invProjectionMatrix = new Float32Array(16);
        mat4.invert(invProjectionMatrix, projectionMatrix);
        const corner = new Float32Array(3);
        vec3.transformMat4(corner, [1, 1, 0], invProjectionMatrix);

        let videoScaleX, videoScaleY;
        if (inputAspect < canvasAspect) {
            videoScaleX = corner[0];
            videoScaleY = (videoScaleX * input.height) / input.width;
        } else {
            videoScaleY = corner[1];
            videoScaleX = (videoScaleY * input.width) / input.height;
        }

        const far = projectionMatrix[14] / (projectionMatrix[10] + 1.0);
        const videoTranslateZ = -far * 0.999; // slightly less than far clippig plane to avoid clipped

        this.videoPane.scalingLocal = [
            (videoScaleX / corner[2]) * videoTranslateZ,
            (videoScaleY / corner[2]) * videoTranslateZ,
            1.0,
        ];
        this.videoPane.setTranslationLocal([0, 0, videoTranslateZ]);
        this.view.projectionMatrix.set(projectionMatrix);

        this.lastProjectionCanvasWidth = this.engine.canvas.width;
        this.lastProjectionCanvasHeight = this.engine.canvas.height;
    }
}
