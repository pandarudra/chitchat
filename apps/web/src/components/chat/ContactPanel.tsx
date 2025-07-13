import React, { useState } from "react";
import { UserPlus, Search, Users } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";

export function ContactPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const { contacts, sendContactRequest } = useChat();
  const { user } = useAuth();

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
  );

  return (
    <div className="bg-white border-l border-gray-200 w-80 hidden lg:block">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contacts</h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-y-auto h-full">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">No contacts found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={
                        contact.avatar ||
                        "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1"
                      }
                      alt={contact.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {contact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {contact.name}
                    </h3>
                    <p className="text-sm text-gray-500">{contact.phone}</p>
                  </div>
                </div>

                <button
                  onClick={() => sendContactRequest(contact.id)}
                  className="text-green-500 hover:text-green-600 transition-colors"
                >
                  <UserPlus className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
