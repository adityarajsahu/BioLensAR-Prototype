import { distanceBetweenPoints, checkAndShowVisualisation, torsoScalingFactor, getLandmarkFromName } from './utils.js';
var loadedMesh;

function initializeScene(canvasElement) {
    const engine = new BABYLON.Engine(canvasElement, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
    // scene.debugLayer.show(); //- Display babylonJS DebugLayer
    new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0, 0, 0), scene);
    new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
    // loading the glb file
    BABYLON.SceneLoader.ImportMesh("", "./models/", "liver.glb", scene, function (newMeshes) {
        loadedMesh = newMeshes;
        loadedMesh[2].name = "liver";
        // remove the default cube
        let defaultCube = scene.getMeshByName("Cube");
        if(defaultCube){
            defaultCube.dispose();
        }
    });
    return scene;
}

// function to pause the rotation of the mesh that is caused by the dynamic position change
function pauseMeshRotation(mesh) {
    mesh.rotationQuaternion = null;
}

function liverPosition(landmarks, videoWidth, videoHeight) {
    if (!landmarks || !landmarks.length) {
        return;
    }
    const leftShoulder = getLandmarkFromName(landmarks, "LEFT_SHOULDER", videoWidth, videoHeight);
    const rightShoulder = getLandmarkFromName(landmarks, "RIGHT_SHOULDER", videoWidth, videoHeight);
    const leftHip = getLandmarkFromName(landmarks, "LEFT_HIP", videoWidth, videoHeight);
    const rightHip = getLandmarkFromName(landmarks, "RIGHT_HIP", videoWidth, videoHeight);
    const midShoulder = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2,
    }
    const midHip = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2,
    }
    const torsoLength = distanceBetweenPoints(midShoulder, midHip);
    const liverPosition = {
        x: midHip.x,
        y: midHip.y - torsoLength / 2,
    }
    return liverPosition;
}

function showLiver({scene, canvas, video, result, viewport}) {
    checkAndShowVisualisation({scene, canvas, video, result});
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (!result || !result.poseLandmarks || !result.poseLandmarks.length) {
        return;
    }
    let liverMesh = scene.getMeshByName("liver");
    if(!liverMesh){
        return;
    }
    
    const liverPos = liverPosition(result.poseLandmarks, video.videoWidth, video.videoHeight);
    
    const vector = BABYLON.Vector3.Unproject(
        new BABYLON.Vector3(video.videoWidth - liverPos.x, liverPos.y, 1),
        video.videoWidth,
        video.videoHeight,
        BABYLON.Matrix.Identity(),
        viewport.getViewMatrix(),
        viewport.getProjectionMatrix()
    );
    // setting position and visibility of the mesh
    liverMesh.isVisible = true;
    liverMesh.position.x = vector.x / 100;
    liverMesh.position.y = vector.y / 100;
    // setting rotation of the mesh
    pauseMeshRotation(liverMesh);
    liverMesh.rotation.x = Math.PI / 2;
    liverMesh.rotation.y = Math.PI / 2;
    // dynamic scaling of the mesh
    const scale = torsoScalingFactor(result.poseLandmarks, video.videoWidth, video.videoHeight);
    liverMesh.scaling = new BABYLON.Vector3(scale, scale, scale);
    //render the scene
    scene.render();
    
}

async function initialize(){
    const canvas = document.getElementById("renderCanvas"); // Get the canvas element
    const video = document.getElementById('input_video');
    if(!video || !canvas){
        // setTimeout(initialize, 1000);
        return;
    }
    // initialize the babylon scene
    const scene = initializeScene(canvas);
    const viewport = scene.activeCamera;
    viewport.position.z =  -100;
    // loading and configuring the medipipe pose model
    const pose = new Pose({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }});
    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    // setting the camera and sending the video frame to the pose model
    let camera = new Camera(video, {
        onFrame: async () =>  await pose.send({ image: video }),
        width: window.innerWidth,
        height: window.innerHeight,
        facingMode: "environment"
    });
    camera.start();
    pose.onResults((result) => showLiver({scene, canvas, video, result, viewport}));
}

window.onload = initialize;