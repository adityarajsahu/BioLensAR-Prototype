import { POSE_INDEX_MAPPER } from "./constants.js";

function distanceBetweenPoints(point1, point2) {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2))
}

function findMidPoint(point1, point2) {
    return {
        x: (point1.x + point2.x) / 2,
        y: (point1.y + point2.y) / 2
    }
}

function disposeMesh(mesh) {
    if(mesh){
        mesh.dispose();
    }
}

function checkAndShowVisualisation({scene, canvas, video, result}){
    let visualise = document.getElementById("visualise");
    const visualiseCanvas = document.getElementById("visualiseCanvas");
    const ctx = visualiseCanvas.getContext("2d");
    ctx.globalCompositeOperation = "source-in";
    ctx.clearRect(0, 0, visualiseCanvas.width, visualiseCanvas.height);
    visualiseCanvas.width = video.videoWidth;
    visualiseCanvas.height = video.videoHeight;
    if (!result || !result.poseLandmarks || !result.poseLandmarks.length) {
        return;
    }
    ctx.globalCompositeOperation = 'destination-atop';
    ctx.drawImage(result.image, 0, 0, visualiseCanvas.width, visualiseCanvas.height);
    ctx.fillStyle = "red";
    if(!visualise.checked){
        return;
    }
    
  
    ctx.globalCompositeOperation = 'source-over';
    drawConnectors(ctx, result.poseLandmarks, POSE_CONNECTIONS, {color: '#00FF00', lineWidth: 4});
    drawLandmarks(ctx, result.poseLandmarks, {color: '#FF0000', lineWidth: 2});
    ctx.restore();
}

function generateMidPoint(landmarks, POSE_NAME, videoWidth, videoHeight){
    return {
        x: (landmarks[POSE_INDEX_MAPPER[POSE_NAME][0]].x + landmarks[POSE_INDEX_MAPPER[POSE_NAME][1]].x) * videoWidth / 2,
        y: (landmarks[POSE_INDEX_MAPPER[POSE_NAME][0]].y + landmarks[POSE_INDEX_MAPPER[POSE_NAME][1]].y) * videoHeight / 2
    }
}

function getLandmarkFromName(landmarks, POSE_NAME, videoWidth, videoHeight){
    return {
        x: landmarks[POSE_INDEX_MAPPER[POSE_NAME]].x * videoWidth,
        y: landmarks[POSE_INDEX_MAPPER[POSE_NAME]].y * videoHeight
    }
}

function torsoScalingFactor(landmarks, videoWidth, videoHeight){
    if(!landmarks || !landmarks.length){
        return;
    }
    const leftShoulderIndex = 11;
    const rightShoulderIndex = 12;
    const leftShoulder = {
        x: landmarks[leftShoulderIndex].x * videoWidth,
        y: landmarks[leftShoulderIndex].y * videoHeight
    }

    const rightShoulder = {
        x: landmarks[rightShoulderIndex].x * videoWidth,
        y: landmarks[rightShoulderIndex].y * videoHeight
    }

    const leftHipIndex = 23;
    const rightHipIndex = 24;
    const leftHip = {
        x: landmarks[leftHipIndex].x * videoWidth,
        y: landmarks[leftHipIndex].y * videoHeight
    }
    const rightHip = {
        x: landmarks[rightHipIndex].x * videoWidth,
        y: landmarks[rightHipIndex].y * videoHeight
    }


    // mid point
    const shoulderMidPoint = findMidPoint(leftShoulder, rightShoulder);
    const hipMidPoint = findMidPoint(leftHip, rightHip);

    const distance = distanceBetweenPoints(shoulderMidPoint, hipMidPoint);
    return distance / 100;
}

export {distanceBetweenPoints, disposeMesh, checkAndShowVisualisation, torsoScalingFactor, generateMidPoint, getLandmarkFromName}