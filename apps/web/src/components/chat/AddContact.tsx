import React, { useEffect, useState } from "react";
import { X, Mail, Search, UserPlus, UserCheck, Clock3 } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import toast from "react-hot-toast";
import { useDebounce } from "../../hooks/useDebounce";
import { searchUserSuggestions } from "../../lib/api";
import type { UserSuggestion } from "../../types/notification";

interface AddContactProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddContact({ isOpen, onClose }: AddContactProps) {
  const { addContact } = useChat();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  const loadSuggestions = async (searchQuery: string) => {
    try {
      setIsFetching(true);
      setError(null);
      const results = await searchUserSuggestions(searchQuery.trim());
      setSuggestions(results);
    } catch (fetchError) {
      console.error("Failed to load suggestions:", fetchError);
      setSuggestions([]);
      setError("Unable to load suggestions right now.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadSuggestions(debouncedQuery);
  }, [debouncedQuery, isOpen]);

  const handleSendRequest = async (emailAddress: string) => {
    const trimmedEmail = emailAddress.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error("Please enter an email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      await addContact(trimmedEmail);
      toast.success("Friend request sent");
      await loadSuggestions(debouncedQuery);
    } catch (requestError: unknown) {
      console.error("Failed to send contact request:", requestError);

      if (
        requestError &&
        typeof requestError === "object" &&
        "response" in requestError
      ) {
        const apiError = requestError as {
          response?: { data?: { error?: string } };
        };
        if (apiError.response?.data?.error) {
          toast.error(apiError.response.data.error);
        } else {
          toast.error("Failed to send request. Please try again.");
        }
      } else if (requestError instanceof Error) {
        toast.error(requestError.message);
      } else {
        toast.error("Failed to send request. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setQuery("");
    setSuggestions([]);
    setError(null);
    onClose();
  };

  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-card text-card-foreground rounded-3xl shadow-2xl border border-border w-full max-w-2xl overflow-hidden transform scale-100 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/15">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Find People</h2>
              <p className="text-xs text-muted-foreground">
                Search available users and send a request
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-5 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2"
            >
              Search by email or name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Search className="h-4.5 w-4.5" />
              </div>
              <input
                id="email"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="friend@domain.com or Rudra"
                className="w-full pl-10 pr-3.5 py-3 bg-muted/70 border border-border/80 focus:border-primary rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm sm:text-base"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {isFetching ? (
              <div className="px-4 py-10 text-center text-muted-foreground text-sm rounded-2xl border border-dashed border-border">
                Searching users...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="px-4 py-10 text-center text-muted-foreground text-sm rounded-2xl border border-dashed border-border bg-muted/20">
                <Mail className="h-5 w-5 mx-auto mb-2 opacity-60" />
                No available users found yet.
              </div>
            ) : (
              suggestions.map((suggestion) => {
                const actionLabel =
                  suggestion.requestStatus === "sent"
                    ? "Pending"
                    : suggestion.requestStatus === "received"
                      ? "Incoming"
                      : suggestion.isContact
                        ? "In Contact"
                        : "Add";

                return (
                  <div
                    key={suggestion.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-border bg-background/80 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {suggestion.avatarUrl ? (
                          <img
                            src={suggestion.avatarUrl}
                            alt={suggestion.displayName}
                            className="w-11 h-11 rounded-2xl object-cover border border-border"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary font-semibold">
                            {suggestion.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${suggestion.isOnline ? "bg-emerald-500" : "bg-slate-400"}`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">
                          {suggestion.displayName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {suggestion.email}
                        </div>
                        {suggestion.requestStatus !== "none" && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock3 className="h-3 w-3" />
                            {suggestion.requestStatus === "sent"
                              ? "Request sent"
                              : suggestion.requestStatus === "received"
                                ? "Request received"
                                : "Added"}
                          </div>
                        )}
                      </div>
                    </div>

                    {suggestion.requestStatus === "none" &&
                    !suggestion.isContact ? (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleSendRequest(suggestion.email)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-60"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground">
                        <UserCheck className="h-4 w-4" />
                        {actionLabel}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2.5 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-2xl transition-all cursor-pointer active:scale-97 border border-transparent"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => loadSuggestions(query)}
              disabled={isFetching}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-foreground hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-all shadow-md active:scale-97 cursor-pointer"
            >
              {isFetching ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
