import { useEffect, useState } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";

function CallModal() {
  const { call, declineCall, endCall, acceptCall } = useChat();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (call.status === "ringing") {
      console.log("CallModal: Ringing state, callId:", call.callId);
    }
  }, [call.status, call.callId]);

  if (call.status === "idle") return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl w-11/12 max-w-md shadow-lg text-center">
        {error && (
          <div className="mb-4 text-red-600">
            <p>{error}</p>
            <button
              className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {call.status === "ringing" && (
          <>
            <h2 className="text-xl font-semibold mb-4">
              Incoming {call.callType} Call from <br />
              <span className="font-bold">{call.caller?.displayName}</span>
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => acceptCall(call.callId!)}
                disabled={!call.callId || !call.peerConnection}
                className="px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => declineCall(call.callId!)}
                className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Decline
              </button>
            </div>
          </>
        )}

        {call.status === "calling" && (
          <h2 className="text-lg font-medium">Calling {call.callee?.displayName}...</h2>
        )}

        {call.status === "connected" && (
          <>
            <h2 className="text-xl font-semibold mb-3">
              {call.callType} Call with{" "}
              <span className="font-bold">
                {call.caller?.id === user?.id
                  ? call.callee?.displayName
                  : call.caller?.displayName}
              </span>
            </h2>

            {call.callType === "video" && (
              <div className="flex justify-center gap-3 mb-4">
                <video
                  ref={(video) => {
                    if (video && call.localStream) video.srcObject = call.localStream;
                  }}
                  autoPlay
                  muted
                  className="w-36 h-24 rounded-md bg-black"
                />
                <video
                  ref={(video) => {
                    if (video && call.remoteStream) video.srcObject = call.remoteStream;
                  }}
                  autoPlay
                  className="w-36 h-24 rounded-md bg-black"
                />
              </div>
            )}

            <button
              onClick={() => endCall(call.callId!)}
              className="mt-2 px-5 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              End Call
            </button>
          </>
        )}

        {call.status === "declined" && (
          <h3 className="text-lg font-semibold text-gray-700">Call Declined</h3>
        )}

        {call.status === "missed" && (
          <h3 className="text-lg font-semibold text-gray-700">
            Missed Call from {call.caller?.displayName}
          </h3>
        )}

        {call.status === "ended" && (
          <h3 className="text-lg font-semibold text-gray-700">Call Ended</h3>
        )}
      </div>
    </div>
  );
}

export default CallModal;
