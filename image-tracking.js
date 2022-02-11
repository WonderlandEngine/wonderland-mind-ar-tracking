import { quat2, mat4, vec3, vec4 } from 'gl-matrix';

WL.registerComponent('image-tracking', {
    videoPane: {type: WL.Type.Object},
    mindPath: {type: WL.Type.String},
    maxTrack: {type: WL.Type.Int, default: 1},
}, {
    init: function() {
        if(!navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            console.error("No media devices found.");
            this.active = false;
        }

	this.trackingTargets = [];
    },
    start: async function() {
	//return;

        this.view = this.object.getComponent('view');

        navigator.mediaDevices.getUserMedia({audio: false, video: true})
            .then(stream => {
                this.video = document.createElement('video');
                this.video.srcObject = stream;
                this.video.addEventListener('loadedmetadata', () => {
                    this.video.play();
		    this.video.width = this.video.videoWidth;
		    this.video.height = this.video.videoHeight;

		    this._setupAR(this.video);
                });
            });
    },
    update: function(dt) {
	if (this.videoTexture) {
	    this.videoTexture.update();
	}
	this._updateCameraProjection();
    },

    registerTarget(targetIndex, target) {
	this.trackingTargets.push({targetIndex, target});
    },

    // start AR. input can be HTML image or video
    _setupAR: async function(input) {
	const controller = new MINDAR.IMAGE.Controller({
	    inputWidth: input.width,
	    inputHeight: input.height,
	    maxTrack: this.maxTrack,
	    onUpdate: (data) => {
		if (data.type === 'updateMatrix') {
		    const {targetIndex, worldMatrix} = data;

		    this.trackingTargets.forEach((t) => { 
			if (targetIndex === t.targetIndex) {
			    const [markerWidth, markerHeight] = this.markerDimensions[targetIndex];
			    t.target.updateTrack(worldMatrix, markerWidth, markerHeight);
			}
		    });
		}
	    }
	});
	const {dimensions, matchingDataList, imageListList} = await controller.addImageTargets(this.mindPath);
	const texture = new WL.Texture(input);

	this.input = input;
	this.controller = controller;
	this.markerDimensions = dimensions;
	this.videoTexture = texture;

        const videoPaneMesh = this.videoPane.getComponent('mesh');
	videoPaneMesh.material = videoPaneMesh.material.clone(); 
	videoPaneMesh.material.flatTexture = texture;

	this._updateCameraProjection();

        this.controller.processVideo(input);
    },

    // update camera projection matrix and background video plane
    _updateCameraProjection: function() {
	const {input, controller} = this;

	if (!input || !controller) {
	    return;
	}

	if (this.lastProjectionCanvasWidth === WL.canvas.width &&
	    this.lastProjectionCanvasHeight === WL.canvas.height) {
	    return;
	}

	const controllerProjectionMatrix = controller.getProjectionMatrix();
	const projectionMatrix = [...controllerProjectionMatrix];

	const canvasAspect = WL.canvas.width / WL.canvas.height;
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

      	let videoScaleX, videoScaleY, videoOffsetX, videoOffsetY;
        if (inputAspect < canvasAspect) {
	  videoScaleX = corner[0];
	  videoScaleY = videoScaleX * input.height / input.width;
	} else {
	  videoScaleY = corner[1];
	  videoScaleX = videoScaleY * input.width / input.height;
	}

	const far = projectionMatrix[14] / (projectionMatrix[10] + 1.0);
        const videoTranslateZ = -far*0.999; // slightly less than far clippig plane to avoid clipped 

        this.videoPane.scalingLocal = [
	    videoScaleX / corner[2] * videoTranslateZ,
	    videoScaleY / corner[2] * videoTranslateZ,
	    1.0
	];
        this.videoPane.setTranslationLocal([0, 0, videoTranslateZ]);
        this.view.projectionMatrix.set(projectionMatrix);

	this.lastProjectionCanvasWidth = WL.canvas.width;
	this.lastProjectionCanvasHeight = WL.canvas.height;

	//console.log("updated camera projection", projectionMatrix);
    },
});

WL.registerComponent('image-tracking-target', {
    targetIndex: {type: WL.Type.Int},
    arCamera: {type: WL.Type.Object},
}, {
    init: function() {
	this.arCamera.getComponent("image-tracking").registerTarget(this.targetIndex, this);
	this.object.scalingLocal = [0,0,0];
	this.object.setDirty();
    },

    // update tracking target transformation
    updateTrack: function(worldMatrix, markerWidth, markerHeight) {
	if (!worldMatrix) {
	    this.object.scalingLocal = [0,0,0];
	    this.object.setDirty();
	    return;
	}

        const fixedWorldMatrix = new Float32Array(16);
	// anchor point should be the marker center
	const adjustMatrix = [
	    1, 0, 0, 0,
	    0, 1, 0, 0,
	    0, 0, 1, 0,
	    markerWidth/2, markerHeight/2, 0, 1
	];
	mat4.multiply(fixedWorldMatrix, worldMatrix, adjustMatrix);
        quat2.fromMat4(this.object.transformLocal, fixedWorldMatrix);

	this.object.scalingLocal = [
	  markerWidth / window.devicePixelRatio,
	  markerWidth / window.devicePixelRatio,
	  markerWidth / window.devicePixelRatio
	];
        this.object.setDirty();
    }
});
