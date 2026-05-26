import React, { useState } from "react";
import { X, Mail, UserPlus } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import toast from "react-hot-toast";

interface AddContactProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddContact({ isOpen, onClose }: AddContactProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addContact } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error("Please enter an email address");
      return;
    }

    // Basic email validation regex
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      await addContact(trimmedEmail);
      toast.success("Contact added successfully!");
      handleClose();
    } catch (error: unknown) {
      console.error("Failed to add contact:", error);

      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as { response?: { data?: { error?: string } } };
        if (apiError.response?.data?.error) {
          toast.error(apiError.response.data.error);
        } else {
          toast.error("Failed to add contact. Please try again.");
        }
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add contact. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
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
  }, [isOpen, onClose]);

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
      <div className="bg-card text-card-foreground rounded-2xl shadow-xl border border-border w-full max-w-md overflow-hidden transform scale-100 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Add New Contact</h2>
              <p className="text-xs text-muted-foreground">Start a secure chitchat session</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@domain.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-muted border border-border/80 focus:border-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm sm:text-base"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl transition-all cursor-pointer active:scale-97 border border-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md active:scale-97 cursor-pointer"
            >
              {isLoading ? "Searching..." : "Add Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
