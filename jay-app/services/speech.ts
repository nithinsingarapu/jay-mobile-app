import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';

const DEEPGRAM_KEY = process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY || '';

/** Request mic permission and enable recording mode */
export async function requestMicPermission(): Promise<boolean> {
  const status = await AudioModule.requestRecordingPermissionsAsync();
  if (!status.granted) return false;
  await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  return true;
}

/** Send audio file to Deepgram and get transcript */
export function transcribeAudio(fileUri: string): Promise<string> {
  if (!DEEPGRAM_KEY) return Promise.reject(new Error('Deepgram API key not configured'));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&detect_language=true');
    xhr.setRequestHeader('Authorization', `Token ${DEEPGRAM_KEY}`);
    xhr.setRequestHeader('Content-Type', 'audio/m4a');

    xhr.onload = () => {
      try {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '');
        } else {
          reject(new Error(result.err_msg || `Deepgram error ${xhr.status}`));
        }
      } catch {
        reject(new Error('Deepgram parse error'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));

    fetch(fileUri)
      .then((r) => r.blob())
      .then((blob) => xhr.send(blob))
      .catch(reject);
  });
}

export { useAudioRecorder, RecordingPresets, setAudioModeAsync };
