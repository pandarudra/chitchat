import { isSameDay } from "date-fns";
import type { Message } from "../types";

export interface MessageGroup {
  date: Date;
  messages: Message[];
}

export function groupMessagesByDate(messages: Message[]): MessageGroup[] {
  if (messages.length === 0) return [];

  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  messages.forEach((message) => {
    const messageDate = new Date(message.timestamp);

    // If this is the first message or the date is different from the current group
    if (!currentGroup || !isSameDay(currentGroup.date, messageDate)) {
      // Start a new group
      currentGroup = {
        date: messageDate,
        messages: [message],
      };
      groups.push(currentGroup);
    } else {
      // Add to the current group
      currentGroup.messages.push(message);
    }
  });

  return groups;
}
