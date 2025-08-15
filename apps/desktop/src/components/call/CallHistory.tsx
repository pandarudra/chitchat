import { useEffect, useState } from "react";
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Trash2,
  User,
} from "lucide-react";
import { getCallHistory, deleteCallHistoryEntry } from "../../lib/api";
import type { CallHistory as CallHistoryType } from "../../types";
import { getAvatarUrl } from "../../utils/constants";

export function CallHistory() {
  const [callHistory, setCallHistory] = useState<CallHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCallHistory = async (pageNum = 1, isLoadMore = false) => {
    try {
      setLoading(true);
      const response = await getCallHistory(pageNum, 20);

      if (response.success) {
        const newCalls = response.data.calls;
        setCallHistory((prev) =>
          isLoadMore ? [...prev, ...newCalls] : newCalls
        );
        setHasMore(response.data.pagination.hasMore);
        setPage(pageNum);
      } else {
        setError("Failed to fetch call history");
      }
    } catch (err) {
      setError("Error loading call history");
      console.error("Call history error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const handleDeleteCall = async (callId: string) => {
    try {
      const response = await deleteCallHistoryEntry(callId);
      if (response.success) {
        setCallHistory((prev) => prev.filter((call) => call.id !== callId));
      }
    } catch (err) {
      console.error("Error deleting call:", err);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchCallHistory(page + 1, true);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return "0:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const callDate = new Date(date);
    const diffInHours = (now.getTime() - callDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return callDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // Less than a week
      return callDate.toLocaleDateString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return callDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getCallIcon = (call: CallHistoryType) => {
    const iconClass = "w-4 h-4";

    if (call.status === "missed") {
      return <PhoneMissed className={`${iconClass} text-red-500`} />;
    }

    if (call.direction === "incoming") {
      return call.type === "video" ? (
        <Video className={`${iconClass} text-green-500`} />
      ) : (
        <PhoneIncoming className={`${iconClass} text-green-500`} />
      );
    } else {
      return call.type === "video" ? (
        <Video className={`${iconClass} text-blue-500`} />
      ) : (
        <PhoneOutgoing className={`${iconClass} text-blue-500`} />
      );
    }
  };

  const getStatusText = (call: CallHistoryType) => {
    if (call.status === "missed") return "Missed";
    if (call.status === "declined") return "Declined";
    if (call.status === "failed") return "Failed";
    return call.direction === "incoming" ? "Incoming" : "Outgoing";
  };

  if (loading && callHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading call history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => fetchCallHistory()}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (callHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No call history yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Your calls will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {callHistory.map((call) => (
          <div
            key={call.id}
            className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* User Avatar */}
              <div className="relative flex-shrink-0">
                {call.user.avatarUrl ? (
                  <img
                    src={getAvatarUrl(call.user.avatarUrl)}
                    alt={call.user.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                )}

                {/* Call type indicator */}
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                  {getCallIcon(call)}
                </div>
              </div>

              {/* Call Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 truncate">
                    {call.user.displayName}
                  </h3>
                  <span className="text-xs text-gray-400 ml-2">
                    {formatTime(call.timestamp)}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className={`text-sm ${
                      call.status === "missed"
                        ? "text-red-500"
                        : "text-gray-500"
                    }`}
                  >
                    {getStatusText(call)}
                  </span>

                  {call.duration > 0 && (
                    <>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(call.duration)}</span>
                      </div>
                    </>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-1">
                  {call.user.phoneNumber}
                </p>
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => handleDeleteCall(call.id)}
              className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 ml-2"
              title="Delete call"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Load More Button */}
        {hasMore && (
          <div className="p-4 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-4 py-2 text-sm text-green-600 hover:text-green-700 disabled:text-gray-400"
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
