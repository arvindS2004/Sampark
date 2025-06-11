const socket = io();
let localStream, remoteStream, peerConnection;
let audioEnabled = true;
let videoEnabled = true;

const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startCallButton = document.getElementById("startCall");
const endCallButton = document.getElementById("endCall");
const muteButton = document.getElementById("muteButton");
const videoButton = document.getElementById("videoButton");
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const sendButton = document.getElementById("sendButton");


muteButton.innerHTML = '<i class="fas fa-microphone"></i>';
videoButton.innerHTML = '<i class="fas fa-video"></i>';

startCallButton.addEventListener("click", startCall);
endCallButton.addEventListener("click", endCall);
muteButton.addEventListener("click", toggleMute);
videoButton.addEventListener("click", toggleVideo);
sendButton.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") sendMessage();
});

async function startCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    createPeerConnection();

    localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", offer);
}

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(servers);
    remoteStream = new MediaStream();
    remoteVideo.srcObject = remoteStream;

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) socket.emit("candidate", event.candidate);
    };
}

socket.on("offer", async (offer) => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    createPeerConnection();

    localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
    await peerConnection.setRemoteDescription(offer);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
});

socket.on("answer", (answer) => peerConnection.setRemoteDescription(answer));
socket.on("candidate", (candidate) => peerConnection.addIceCandidate(candidate));

function toggleMute() {
    audioEnabled = !audioEnabled;
    localStream.getAudioTracks()[0].enabled = audioEnabled;

    
    muteButton.innerHTML = audioEnabled 
        ? '<i class="fas fa-microphone"></i>'  
        : '<i class="fas fa-microphone-slash"></i>'; 
}

function toggleVideo() {
    videoEnabled = !videoEnabled;
    localStream.getVideoTracks()[0].enabled = videoEnabled;

    videoButton.innerHTML = videoEnabled 
        ? '<i class="fas fa-video"></i>'  
        : '<i class="fas fa-video-slash"></i>'; 
}

function endCall() {
    peerConnection?.close();
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (message !== "") {
        appendMessage(`You: ${message}`, true);
        socket.emit("message", message);
        chatInput.value = "";
    }
}

socket.on("message", (message) => appendMessage(`Stranger: ${message}`, false));

function appendMessage(message, isYou) {
    const msgDiv = document.createElement("div");
    msgDiv.textContent = message;
    msgDiv.classList.add("chat-message");
    if (isYou) msgDiv.classList.add("you");

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
