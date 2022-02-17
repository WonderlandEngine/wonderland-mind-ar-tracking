WL.registerComponent('mediapipe', {
}, {
    init: function() {
	console.log("hello");

	const faceMesh = new FaceMesh({locateFile: (file) => {
	    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`;
	}});

	const input = document.createElement("img");
	input.onload = () => {
	    // comment this out stop the error
	    faceMesh.send({image: input});
	}
	input.src = './face1.jpeg';
    }
});
