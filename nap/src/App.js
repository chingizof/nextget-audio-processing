import React, { useState, useRef } from 'react';

function App() {
  // State to track recording status
  const [isRecording, setIsRecording] = useState(false);
  // Use ref to store the MediaRecorder instance (so it persists between re-renders)
  const mediaRecorderRef = useRef(null);
  // State to hold the recorded audio chunks
  const [audioChunks, setAudioChunks] = useState([]);
  // State for the final audio Blob once recording stops
  const [audioBlob, setAudioBlob] = useState(null);

  // 1) Start / Stop Recording
  const handleRecordButtonClick = async () => {
    try {
      if (!isRecording) {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Create a new MediaRecorder with the audio stream
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const chunks = [];

        // Event: data is available
        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        });

        // Event: recording stops
        mediaRecorder.addEventListener('stop', () => {
          // Create a Blob from all audio chunks
          const recordedBlob = new Blob(chunks, { type: 'audio/wav' });
          setAudioBlob(recordedBlob);
          setAudioChunks(chunks); // store chunks if needed
        });

        // Start recording
        mediaRecorder.start();
        setIsRecording(true);
      } else {
        // If we are already recording, stop the MediaRecorder
        mediaRecorderRef.current.stop();
        // Also stop all tracks in the stream to release the mic
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  // 2) Send Recording to Server
  const handleSendButtonClick = async () => {
    if (!audioBlob) {
      alert('No audio recorded!');
      return;
    }

    try {
      // Build a FormData object to send as POST body
      const formData = new FormData();
      // Append the audio file (Blob) with some filename, e.g. "audio.wav"
      formData.append('audioFile', audioBlob, 'audio.wav');

      // Send POST request
      const response = await fetch('http://SERVER_IP:5000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send audio.');
      }

      // Optionally, handle server response
      const data = await response.json();
      console.log('Server response:', data);
      alert(`Server Response: ${JSON.stringify(data)}`);
    } catch (error) {
      console.error('Error sending audio file:', error);
    }
  };

  return (
    <div style={{ margin: '50px' }}>
      <h1>Audio Recorder</h1>

      <button onClick={handleRecordButtonClick}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>

      <button onClick={handleSendButtonClick} style={{ marginLeft: '10px' }}>
        Send Recording
      </button>

      {/* Optional: If you want to preview the audio locally once recorded */}
      {audioBlob && (
        <div style={{ marginTop: '20px' }}>
          <h3>Playback:</h3>
          <audio controls src={URL.createObjectURL(audioBlob)} />
        </div>
      )}
    </div>
  );
}

export default App;
